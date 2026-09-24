// Captures an iOS device screen through the same USB screen-mirroring path
// QuickTime Player uses (CoreMediaIO "screen capture" DAL devices) and
// encodes it with VideoToolbox. Unlike the WDA MJPEG path this never asks
// XCTest for screenshots, so frames arrive at the device refresh rate with
// tens of milliseconds of latency instead of hundreds.
//
// Usage: ios-avcapture-encoder <udid> <bitrate> <frameRate> <maxSize> <discoveryTimeoutSeconds> [deviceName]
//
// Device matching: modern macOS exposes iOS mirroring devices with a random
// GUID as uniqueID instead of the UDID, so the UDID is confirmed through the
// USB serial number (IOKit) and the mirroring device is picked by name, or by
// elimination when exactly one Apple mobile device is on USB.
//
// stdout: framed Annex-B access units, identical to ios-h264-encoder.swift:
//   [1 byte keyframe flag][4 byte big-endian length][access unit]
// stderr: diagnostics, one message per line.
// Exit codes: 2 device not found, 3 camera permission denied, 4 capture failure.

import Foundation
import AVFoundation
import CoreMediaIO
import VideoToolbox
import CoreMedia
import CoreVideo
import IOKit

private let annexBStartCode = Data([0, 0, 0, 1])
private let exitDeviceNotFound: Int32 = 2
private let exitPermissionDenied: Int32 = 3
private let exitCaptureFailure: Int32 = 4

private func log(_ message: String) {
    fputs(message + "\n", stderr)
}

private func appendUInt32BE(_ value: UInt32, to data: inout Data) {
    data.append(UInt8((value >> 24) & 0xff))
    data.append(UInt8((value >> 16) & 0xff))
    data.append(UInt8((value >> 8) & 0xff))
    data.append(UInt8(value & 0xff))
}

private func normalizeUdid(_ value: String) -> String {
    String(value.lowercased().filter { $0.isLetter || $0.isNumber })
}

// iOS devices only show up as AVCapture devices after opting in through
// CoreMediaIO; this is the same switch QuickTime flips before listing iPhones.
private func enableScreenCaptureDevices() {
    var address = CMIOObjectPropertyAddress(
        mSelector: CMIOObjectPropertySelector(kCMIOHardwarePropertyAllowScreenCaptureDevices),
        mScope: CMIOObjectPropertyScope(kCMIOObjectPropertyScopeGlobal),
        mElement: CMIOObjectPropertyElement(kCMIOObjectPropertyElementMain)
    )
    var allow: UInt32 = 1
    let status = CMIOObjectSetPropertyData(
        CMIOObjectID(kCMIOObjectSystemObject),
        &address,
        0,
        nil,
        UInt32(MemoryLayout<UInt32>.size),
        &allow
    )
    if status != kCMIOHardwareNoError {
        log("Unable to enable CoreMediaIO screen capture devices: \(status)")
    }
}

private func discoverMuxedDevices() -> [AVCaptureDevice] {
    let deviceTypes: [AVCaptureDevice.DeviceType]
    if #available(macOS 14.0, *) {
        deviceTypes = [.external]
    } else {
        deviceTypes = [.externalUnknown]
    }
    return AVCaptureDevice.DiscoverySession(
        deviceTypes: deviceTypes,
        mediaType: .muxed,
        position: .unspecified
    ).devices
}

private func findDevice(udid: String, name: String?, timeout: TimeInterval) -> AVCaptureDevice? {
    let wanted = normalizeUdid(udid)
    let deadline = Date().addingTimeInterval(timeout)
    var reportedCandidates = false
    var reportedUsb = false
    repeat {
        let devices = discoverMuxedDevices()
        if let match = devices.first(where: { normalizeUdid($0.uniqueID) == wanted }) {
            return match
        }

        let usbDevices = usbAppleMobileDevices()
        let onUsb = usbDevices.contains { normalizeUdid($0.serial) == wanted }
        if !onUsb {
            if !reportedUsb {
                reportedUsb = true
                log("\(udid) is not connected over USB; waiting up to \(Int(timeout))s for it to appear")
            }
        } else if !devices.isEmpty {
            if let name, !name.isEmpty {
                let byName = devices.filter { $0.localizedName == name }
                if byName.count == 1 {
                    return byName[0]
                }
                if byName.count > 1 {
                    log("Several mirroring devices are named \"\(name)\"; cannot tell which one is \(udid)")
                    return nil
                }
            }
            if devices.count == 1 && usbDevices.count == 1 {
                return devices[0]
            }
            if !reportedCandidates {
                reportedCandidates = true
                let names = devices.map { "\($0.localizedName)=\($0.uniqueID)" }.joined(separator: ", ")
                log("Mirroring devices present but none match \(udid)\(name.map { " (\"\($0)\")" } ?? ""): \(names)")
            }
        }
        RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        Thread.sleep(forTimeInterval: 0.4)
    } while Date() < deadline
    return nil
}

private func usbRegistryString(_ service: io_object_t, _ key: String) -> String? {
    IORegistryEntryCreateCFProperty(service, key as CFString, kCFAllocatorDefault, 0)?
        .takeRetainedValue() as? String
}

private func usbAppleMobileDevices() -> [(serial: String, name: String)] {
    var iterator: io_iterator_t = 0
    guard IOServiceGetMatchingServices(mach_port_t(MACH_PORT_NULL), IOServiceMatching("IOUSBHostDevice"), &iterator) == KERN_SUCCESS else {
        return []
    }
    defer { IOObjectRelease(iterator) }
    var found: [(serial: String, name: String)] = []
    var service = IOIteratorNext(iterator)
    while service != 0 {
        let vendor = IORegistryEntryCreateCFProperty(service, "idVendor" as CFString, kCFAllocatorDefault, 0)?
            .takeRetainedValue() as? Int
        let product = usbRegistryString(service, "USB Product Name") ?? ""
        if vendor == 0x05ac, product == "iPhone" || product == "iPad" || product == "iPod",
           let serial = usbRegistryString(service, "USB Serial Number") {
            found.append((serial: serial, name: product))
        }
        IOObjectRelease(service)
        service = IOIteratorNext(iterator)
    }
    return found
}

private func ensureCameraAccess() -> Bool {
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .authorized:
        return true
    case .denied, .restricted:
        return false
    case .notDetermined:
        let semaphore = DispatchSemaphore(value: 0)
        var granted = false
        AVCaptureDevice.requestAccess(for: .video) { result in
            granted = result
            semaphore.signal()
        }
        // Headless providers cannot answer the TCC prompt; do not hang forever.
        let deadline = Date().addingTimeInterval(30)
        while semaphore.wait(timeout: .now() + 0.1) == .timedOut {
            RunLoop.current.run(until: Date().addingTimeInterval(0.05))
            if Date() > deadline {
                return false
            }
        }
        return granted
    @unknown default:
        return false
    }
}

final class Encoder {
    private let bitrate: Int
    private let frameRate: Int
    private let maxSize: Int
    private var session: VTCompressionSession?
    private var transferSession: VTPixelTransferSession?
    private var pixelBufferPool: CVPixelBufferPool?
    private var width = 0
    private var height = 0
    private var sourceWidth = 0
    private var sourceHeight = 0
    private var frameIndex: Int64 = 0
    private let outputLock = NSLock()
    private let keyframeLock = NSLock()
    private var keyframeRequested = false
    var onFirstFrame: ((Int, Int, Int, Int) -> Void)?

    init(bitrate: Int, frameRate: Int, maxSize: Int) {
        self.bitrate = bitrate
        self.frameRate = frameRate
        self.maxSize = maxSize
    }

    deinit {
        finish()
    }

    // Called from the stdin reader when a new viewer attaches so it can start
    // decoding immediately instead of waiting for the periodic IDR.
    func requestKeyframe() {
        keyframeLock.lock()
        keyframeRequested = true
        keyframeLock.unlock()
    }

    private func takeKeyframeRequest() -> Bool {
        keyframeLock.lock()
        defer { keyframeLock.unlock() }
        let requested = keyframeRequested
        keyframeRequested = false
        return requested
    }

    func finish() {
        if let session {
            VTCompressionSessionCompleteFrames(session, untilPresentationTimeStamp: .invalid)
            VTCompressionSessionInvalidate(session)
        }
        session = nil
        if let transferSession {
            VTPixelTransferSessionInvalidate(transferSession)
        }
        transferSession = nil
        pixelBufferPool = nil
    }

    func encode(pixelBuffer source: CVPixelBuffer) {
        let inputWidth = CVPixelBufferGetWidth(source)
        let inputHeight = CVPixelBufferGetHeight(source)
        let dimensions = scaledDimensions(width: inputWidth, height: inputHeight)
        if session == nil || dimensions.width != width || dimensions.height != height {
            finish()
            guard createSession(width: dimensions.width, height: dimensions.height) else { return }
            sourceWidth = inputWidth
            sourceHeight = inputHeight
            onFirstFrame?(inputWidth, inputHeight, width, height)
        }
        guard let session else { return }

        let input: CVPixelBuffer
        if inputWidth == width && inputHeight == height &&
            CVPixelBufferGetPixelFormatType(source) == kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange {
            input = source
        } else {
            guard let scaled = scale(source) else { return }
            input = scaled
        }

        let pts = CMTime(value: frameIndex, timescale: CMTimeScale(frameRate))
        let duration = CMTime(value: 1, timescale: CMTimeScale(frameRate))
        frameIndex += 1
        let frameProperties: CFDictionary? = takeKeyframeRequest()
            ? [kVTEncodeFrameOptionKey_ForceKeyFrame: kCFBooleanTrue] as CFDictionary
            : nil
        let status = VTCompressionSessionEncodeFrame(
            session,
            imageBuffer: input,
            presentationTimeStamp: pts,
            duration: duration,
            frameProperties: frameProperties,
            sourceFrameRefcon: nil,
            infoFlagsOut: nil
        )
        if status != noErr {
            log("VideoToolbox encode failed: \(status)")
        }
    }

    private func scaledDimensions(width: Int, height: Int) -> (width: Int, height: Int) {
        let largest = max(width, height)
        let scale = largest > maxSize ? Double(maxSize) / Double(largest) : 1.0
        let scaledWidth = max(2, Int(Double(width) * scale)) & ~1
        let scaledHeight = max(2, Int(Double(height) * scale)) & ~1
        return (scaledWidth, scaledHeight)
    }

    private func scale(_ source: CVPixelBuffer) -> CVPixelBuffer? {
        if transferSession == nil {
            var created: VTPixelTransferSession?
            guard VTPixelTransferSessionCreate(allocator: kCFAllocatorDefault, pixelTransferSessionOut: &created) == noErr,
                  let created else {
                log("Unable to create VideoToolbox pixel transfer session")
                return nil
            }
            VTSessionSetProperty(created, key: kVTPixelTransferPropertyKey_ScalingMode, value: kVTScalingMode_Normal)
            VTSessionSetProperty(created, key: kVTPixelTransferPropertyKey_RealTime, value: kCFBooleanTrue)
            transferSession = created
        }
        guard let transferSession else { return nil }

        var destination: CVPixelBuffer?
        if let pixelBufferPool {
            CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, pixelBufferPool, &destination)
        }
        if destination == nil {
            let attributes: CFDictionary = [
                kCVPixelBufferIOSurfacePropertiesKey: [:]
            ] as CFDictionary
            CVPixelBufferCreate(
                kCFAllocatorDefault,
                width,
                height,
                kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange,
                attributes,
                &destination
            )
        }
        guard let destination else {
            log("Unable to allocate scaled pixel buffer")
            return nil
        }
        let status = VTPixelTransferSessionTransferImage(transferSession, from: source, to: destination)
        if status != noErr {
            log("VideoToolbox pixel transfer failed: \(status)")
            return nil
        }
        return destination
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
            kCVPixelBufferPixelFormatTypeKey: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange,
            kCVPixelBufferWidthKey: width,
            kCVPixelBufferHeightKey: height,
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
                log("Hardware VideoToolbox encoder unavailable; using software fallback")
            }
        }
        guard status == noErr, let created else {
            log("Unable to create VideoToolbox encoder: \(status)")
            return false
        }

        session = created
        VTSessionSetProperty(created, key: kVTCompressionPropertyKey_RealTime, value: kCFBooleanTrue)
        VTSessionSetProperty(created, key: kVTCompressionPropertyKey_AllowFrameReordering, value: kCFBooleanFalse)
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
            log("Unable to prepare VideoToolbox encoder: \(prepareStatus)")
            finish()
            return false
        }
        pixelBufferPool = VTCompressionSessionGetPixelBufferPool(created)
        return true
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
        outputLock.lock()
        FileHandle.standardOutput.write(output)
        outputLock.unlock()
    }
}

final class CaptureDelegate: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
    private let encoder: Encoder
    private let interval: TimeInterval
    private var nextDue: TimeInterval = 0

    init(encoder: Encoder, frameRate: Int) {
        self.encoder = encoder
        self.interval = 1.0 / Double(max(1, frameRate))
    }

    func captureOutput(
        _ output: AVCaptureOutput,
        didOutput sampleBuffer: CMSampleBuffer,
        from connection: AVCaptureConnection
    ) {
        // The mirroring device pushes frames at the display refresh rate
        // (variable on ProMotion panels). Pace on a running deadline rather
        // than "time since last accepted frame" so an input cadence that does
        // not divide evenly into the target rate does not alias to half of it.
        let now = CACurrentMediaTime()
        if now < nextDue {
            return
        }
        nextDue = max(nextDue + interval, now - interval)
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        encoder.encode(pixelBuffer: pixelBuffer)
    }
}

let arguments = CommandLine.arguments
guard arguments.count > 1, !arguments[1].isEmpty else {
    log("Usage: ios-avcapture-encoder <udid> [bitrate] [frameRate] [maxSize] [discoveryTimeoutSeconds] [deviceName]")
    exit(1)
}
let udid = arguments[1]
let bitrate = arguments.count > 2 ? Int(arguments[2]) ?? 1_500_000 : 1_500_000
let frameRate = arguments.count > 3 ? Int(arguments[3]) ?? 30 : 30
let maxSize = arguments.count > 4 ? Int(arguments[4]) ?? 1280 : 1280
let discoveryTimeout = arguments.count > 5 ? TimeInterval(arguments[5]) ?? 10 : 10
let deviceName = arguments.count > 6 ? arguments[6] : nil

guard ensureCameraAccess() else {
    log("Camera access is required to mirror the iOS screen; grant it to the provider process in System Settings > Privacy & Security > Camera")
    exit(exitPermissionDenied)
}

enableScreenCaptureDevices()
guard let device = findDevice(udid: udid, name: deviceName, timeout: discoveryTimeout) else {
    log("No mirroring device for \(udid) appeared within \(Int(discoveryTimeout))s")
    exit(exitDeviceNotFound)
}
log("Using mirroring device \(device.localizedName) (\(device.uniqueID)) for \(udid)")

let encoder = Encoder(
    bitrate: max(100_000, bitrate),
    frameRate: max(1, min(60, frameRate)),
    maxSize: max(128, maxSize)
)
encoder.onFirstFrame = { sourceWidth, sourceHeight, width, height in
    log("Mirroring \(device.localizedName) (\(device.uniqueID)) \(sourceWidth)x\(sourceHeight) -> \(width)x\(height)")
}

let session = AVCaptureSession()
let queue = DispatchQueue(label: "mercury.ios.avcapture", qos: .userInteractive)
let delegate = CaptureDelegate(encoder: encoder, frameRate: frameRate)
do {
    session.beginConfiguration()
    let input = try AVCaptureDeviceInput(device: device)
    guard session.canAddInput(input) else {
        log("Capture session rejected \(device.localizedName)")
        exit(exitCaptureFailure)
    }
    session.addInput(input)
    let output = AVCaptureVideoDataOutput()
    output.videoSettings = [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange
    ]
    output.alwaysDiscardsLateVideoFrames = true
    output.setSampleBufferDelegate(delegate, queue: queue)
    guard session.canAddOutput(output) else {
        log("Capture session cannot add a video output for \(device.localizedName)")
        exit(exitCaptureFailure)
    }
    // Muxed (video+audio) mirroring devices do not auto-connect their video
    // port to a data output; wire the connection explicitly.
    session.addOutputWithNoConnections(output)
    let videoPorts = input.ports.filter { $0.mediaType == .video }
    guard !videoPorts.isEmpty else {
        log("\(device.localizedName) exposes no video port")
        exit(exitCaptureFailure)
    }
    let connection = AVCaptureConnection(inputPorts: videoPorts, output: output)
    guard session.canAddConnection(connection) else {
        log("Capture session rejected the video connection for \(device.localizedName)")
        exit(exitCaptureFailure)
    }
    session.addConnection(connection)
    session.commitConfiguration()
} catch {
    log("Unable to open \(device.localizedName): \(error.localizedDescription)")
    exit(exitCaptureFailure)
}

let runtimeErrorName: Notification.Name
let disconnectedName: Notification.Name
if #available(macOS 15.0, *) {
    runtimeErrorName = AVCaptureSession.runtimeErrorNotification
    disconnectedName = AVCaptureDevice.wasDisconnectedNotification
} else {
    runtimeErrorName = .AVCaptureSessionRuntimeError
    disconnectedName = .AVCaptureDeviceWasDisconnected
}
let center = NotificationCenter.default
center.addObserver(forName: runtimeErrorName, object: session, queue: nil) { notification in
    let error = notification.userInfo?[AVCaptureSessionErrorKey] as? NSError
    log("Capture session runtime error: \(error?.localizedDescription ?? "unknown")")
    exit(exitCaptureFailure)
}
center.addObserver(forName: disconnectedName, object: device, queue: nil) { _ in
    log("\(device.localizedName) disconnected")
    exit(exitCaptureFailure)
}

func shutdown() {
    session.stopRunning()
    encoder.finish()
    exit(0)
}
signal(SIGTERM) { _ in exit(0) }
signal(SIGINT) { _ in exit(0) }
// The parent keeps stdin open for the lifetime of the capture; EOF means it
// went away and we must not linger holding the device. Any 'K' byte asks for
// an immediate keyframe (a new viewer attached).
DispatchQueue.global().async {
    while true {
        let chunk = FileHandle.standardInput.availableData
        if chunk.isEmpty {
            DispatchQueue.main.async { shutdown() }
            return
        }
        if chunk.contains(UInt8(ascii: "K")) {
            encoder.requestKeyframe()
        }
    }
}

session.startRunning()
if !session.isRunning {
    log("Capture session failed to start for \(device.localizedName)")
    exit(exitCaptureFailure)
}
RunLoop.main.run()
