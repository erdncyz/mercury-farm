import Foundation
import VideoToolbox
import CoreMedia
import CoreVideo
import CoreGraphics
import ImageIO

private let annexBStartCode = Data([0, 0, 0, 1])

private func readExact(_ handle: FileHandle, count: Int) -> Data? {
    var result = Data()
    while result.count < count {
        let chunk = handle.readData(ofLength: count - result.count)
        if chunk.isEmpty {
            return nil
        }
        result.append(chunk)
    }
    return result
}

private func uint32BE(_ data: Data) -> UInt32 {
    data.reduce(UInt32(0)) { ($0 << 8) | UInt32($1) }
}

private func appendUInt32BE(_ value: UInt32, to data: inout Data) {
    data.append(UInt8((value >> 24) & 0xff))
    data.append(UInt8((value >> 16) & 0xff))
    data.append(UInt8((value >> 8) & 0xff))
    data.append(UInt8(value & 0xff))
}

final class Encoder {
    private let bitrate: Int
    private let frameRate: Int
    private let maxSize: Int
    private var session: VTCompressionSession?
    private var pixelBufferPool: CVPixelBufferPool?
    private var width = 0
    private var height = 0
    private var frameIndex: Int64 = 0

    init(bitrate: Int, frameRate: Int, maxSize: Int) {
        self.bitrate = bitrate
        self.frameRate = frameRate
        self.maxSize = maxSize
    }

    deinit {
        finish()
    }

    func finish() {
        guard let session else { return }
        VTCompressionSessionCompleteFrames(session, untilPresentationTimeStamp: .invalid)
        VTCompressionSessionInvalidate(session)
        self.session = nil
        self.pixelBufferPool = nil
    }

    func encode(jpeg: Data) {
        guard
            let source = CGImageSourceCreateWithData(jpeg as CFData, nil),
            let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
        else {
            return
        }

        let dimensions = scaledDimensions(width: image.width, height: image.height)
        if session == nil || dimensions.width != width || dimensions.height != height {
            finish()
            guard createSession(width: dimensions.width, height: dimensions.height) else { return }
        }

        guard let pixelBuffer = makePixelBuffer(image: image, width: width, height: height),
              let session else {
            return
        }

        let pts = CMTime(value: frameIndex, timescale: CMTimeScale(frameRate))
        let duration = CMTime(value: 1, timescale: CMTimeScale(frameRate))
        frameIndex += 1
        let status = VTCompressionSessionEncodeFrame(
            session,
            imageBuffer: pixelBuffer,
            presentationTimeStamp: pts,
            duration: duration,
            frameProperties: nil,
            sourceFrameRefcon: nil,
            infoFlagsOut: nil
        )
        if status != noErr {
            fputs("VideoToolbox encode failed: \(status)\n", stderr)
        }
    }

    private func scaledDimensions(width: Int, height: Int) -> (width: Int, height: Int) {
        let largest = max(width, height)
        let scale = largest > maxSize ? Double(maxSize) / Double(largest) : 1.0
        let scaledWidth = max(2, Int(Double(width) * scale)) & ~1
        let scaledHeight = max(2, Int(Double(height) * scale)) & ~1
        return (scaledWidth, scaledHeight)
    }

    private func createSession(width: Int, height: Int) -> Bool {
        self.width = width
        self.height = height
        self.frameIndex = 0

        let outputCallback: VTCompressionOutputCallback = { refcon, _, status, _, sampleBuffer in
                guard status == noErr, let refcon, let sampleBuffer else { return }
                Unmanaged<Encoder>.fromOpaque(refcon).takeUnretainedValue().write(sampleBuffer)
            }
        let refcon = Unmanaged.passUnretained(self).toOpaque()
        let pixelBufferAttributes: CFDictionary = [
            kCVPixelBufferPixelFormatTypeKey: kCVPixelFormatType_32BGRA,
            kCVPixelBufferWidthKey: width,
            kCVPixelBufferHeightKey: height,
            kCVPixelBufferCGImageCompatibilityKey: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey: true,
            kCVPixelBufferIOSurfacePropertiesKey: [:]
        ] as CFDictionary
        func makeSession(specification: CFDictionary) -> (OSStatus, VTCompressionSession?) {
            var candidate: VTCompressionSession?
            let status = VTCompressionSessionCreate(
                allocator: kCFAllocatorDefault,
                width: Int32(width),
                height: Int32(height),
                codecType: kCMVideoCodecType_H264,
                encoderSpecification: specification,
                imageBufferAttributes: pixelBufferAttributes,
                compressedDataAllocator: nil,
                outputCallback: outputCallback,
                refcon: refcon,
                compressionSessionOut: &candidate
            )
            return (status, candidate)
        }

        let hardwareSpecification = [
            kVTVideoEncoderSpecification_RequireHardwareAcceleratedVideoEncoder: true
        ] as CFDictionary
        var (status, created) = makeSession(specification: hardwareSpecification)
        if status != noErr || created == nil {
            let softwareSpecification = [
                kVTVideoEncoderSpecification_EnableHardwareAcceleratedVideoEncoder: false
            ] as CFDictionary
            (status, created) = makeSession(specification: softwareSpecification)
            if status == noErr, created != nil {
                fputs("Hardware VideoToolbox encoder unavailable; using software fallback\n", stderr)
            }
        }
        guard status == noErr, let created else {
            fputs("Unable to create VideoToolbox encoder: \(status)\n", stderr)
            return false
        }

        session = created
        VTSessionSetProperty(created, key: kVTCompressionPropertyKey_RealTime, value: kCFBooleanTrue)
        VTSessionSetProperty(created, key: kVTCompressionPropertyKey_AllowFrameReordering, value: kCFBooleanFalse)
        // Bound VideoToolbox's internal queue. Screen control values freshness
        // over throughput; an unbounded encoder queue makes interaction appear
        // progressively slower even when the source frame rate is healthy.
        VTSessionSetProperty(created, key: kVTCompressionPropertyKey_MaxFrameDelayCount, value: 1 as CFNumber)
        VTSessionSetProperty(created, key: kVTCompressionPropertyKey_ProfileLevel, value: kVTProfileLevel_H264_Baseline_AutoLevel)
        VTSessionSetProperty(created, key: kVTCompressionPropertyKey_AverageBitRate, value: bitrate as CFNumber)
        VTSessionSetProperty(created, key: kVTCompressionPropertyKey_ExpectedFrameRate, value: frameRate as CFNumber)
        VTSessionSetProperty(created, key: kVTCompressionPropertyKey_MaxKeyFrameInterval, value: (frameRate * 2) as CFNumber)
        let bytesPerSecond = max(1, bitrate / 8)
        VTSessionSetProperty(
            created,
            key: kVTCompressionPropertyKey_DataRateLimits,
            value: [bytesPerSecond, 1] as CFArray
        )
        let prepareStatus = VTCompressionSessionPrepareToEncodeFrames(created)
        if prepareStatus != noErr {
            fputs("Unable to prepare VideoToolbox encoder: \(prepareStatus)\n", stderr)
            finish()
            return false
        }
        pixelBufferPool = VTCompressionSessionGetPixelBufferPool(created)
        return true
    }

    private func makePixelBuffer(image: CGImage, width: Int, height: Int) -> CVPixelBuffer? {
        var pixelBuffer: CVPixelBuffer?

        if let pixelBufferPool {
            let status = CVPixelBufferPoolCreatePixelBuffer(
                kCFAllocatorDefault,
                pixelBufferPool,
                &pixelBuffer
            )
            if status != kCVReturnSuccess {
                pixelBuffer = nil
            }
        }

        // Older VideoToolbox implementations may not expose a pool for every
        // encoder configuration. Preserve the previous allocation path as a
        // compatibility fallback instead of failing screen capture.
        if pixelBuffer == nil {
            let attributes: CFDictionary = [
                kCVPixelBufferCGImageCompatibilityKey: true,
                kCVPixelBufferCGBitmapContextCompatibilityKey: true,
                kCVPixelBufferIOSurfacePropertiesKey: [:]
            ] as CFDictionary
            guard CVPixelBufferCreate(
                kCFAllocatorDefault,
                width,
                height,
                kCVPixelFormatType_32BGRA,
                attributes,
                &pixelBuffer
            ) == kCVReturnSuccess else {
                return nil
            }
        }

        guard let pixelBuffer else {
            return nil
        }

        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }
        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer),
              let context = CGContext(
                data: baseAddress,
                width: width,
                height: height,
                bitsPerComponent: 8,
                bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
                space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGBitmapInfo.byteOrder32Little.rawValue |
                    CGImageAlphaInfo.premultipliedFirst.rawValue
              ) else {
            return nil
        }
        context.interpolationQuality = .medium
        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        return pixelBuffer
    }

    private func write(_ sampleBuffer: CMSampleBuffer) {
        guard CMSampleBufferDataIsReady(sampleBuffer),
              let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) else {
            return
        }
        let attachments = CMSampleBufferGetSampleAttachmentsArray(sampleBuffer, createIfNecessary: false)
        let attachment = (attachments as? [[CFString: Any]])?.first
        let isKeyframe = attachment?[kCMSampleAttachmentKey_NotSync] == nil
        var accessUnit = Data()

        if isKeyframe, let format = CMSampleBufferGetFormatDescription(sampleBuffer) {
            var parameterCount = 0
            CMVideoFormatDescriptionGetH264ParameterSetAtIndex(
                format,
                parameterSetIndex: 0,
                parameterSetPointerOut: nil,
                parameterSetSizeOut: nil,
                parameterSetCountOut: &parameterCount,
                nalUnitHeaderLengthOut: nil
            )
            for index in 0..<parameterCount {
                var pointer: UnsafePointer<UInt8>?
                var size = 0
                if CMVideoFormatDescriptionGetH264ParameterSetAtIndex(
                    format,
                    parameterSetIndex: index,
                    parameterSetPointerOut: &pointer,
                    parameterSetSizeOut: &size,
                    parameterSetCountOut: nil,
                    nalUnitHeaderLengthOut: nil
                ) == noErr, let pointer {
                    accessUnit.append(annexBStartCode)
                    accessUnit.append(pointer, count: size)
                }
            }
        }

        var totalLength = 0
        var dataPointer: UnsafeMutablePointer<Int8>?
        guard CMBlockBufferGetDataPointer(
            blockBuffer,
            atOffset: 0,
            lengthAtOffsetOut: nil,
            totalLengthOut: &totalLength,
            dataPointerOut: &dataPointer
        ) == kCMBlockBufferNoErr, let dataPointer else {
            return
        }

        let bytes = UnsafeRawPointer(dataPointer).assumingMemoryBound(to: UInt8.self)
        var offset = 0
        while offset + 4 <= totalLength {
            let nalLength = Int(bytes[offset]) << 24 |
                Int(bytes[offset + 1]) << 16 |
                Int(bytes[offset + 2]) << 8 |
                Int(bytes[offset + 3])
            offset += 4
            guard nalLength > 0, offset + nalLength <= totalLength else { return }
            accessUnit.append(annexBStartCode)
            accessUnit.append(bytes.advanced(by: offset), count: nalLength)
            offset += nalLength
        }

        guard !accessUnit.isEmpty, accessUnit.count <= Int(UInt32.max) else { return }
        var output = Data([isKeyframe ? 1 : 0])
        appendUInt32BE(UInt32(accessUnit.count), to: &output)
        output.append(accessUnit)
        FileHandle.standardOutput.write(output)
    }
}

let arguments = CommandLine.arguments
let bitrate = arguments.count > 1 ? Int(arguments[1]) ?? 1_500_000 : 1_500_000
let frameRate = arguments.count > 2 ? Int(arguments[2]) ?? 15 : 15
let maxSize = arguments.count > 3 ? Int(arguments[3]) ?? 1280 : 1280
let encoder = Encoder(
    bitrate: max(100_000, bitrate),
    frameRate: max(1, min(60, frameRate)),
    maxSize: max(128, maxSize)
)
let input = FileHandle.standardInput

while let header = readExact(input, count: 4) {
    let frameLength = Int(uint32BE(header))
    if frameLength <= 0 || frameLength > 32 * 1024 * 1024 {
        break
    }
    guard let jpeg = readExact(input, count: frameLength) else { break }
    encoder.encode(jpeg: jpeg)
}
encoder.finish()
