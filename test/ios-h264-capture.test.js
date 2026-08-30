import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import test from 'node:test'
import jpeg from 'jpeg-js'
import IosH264Capture, {
    encoderBinary,
    jpegDimensions,
    partitionAnnexBParameterSets
} from '../lib/units/ios-device/plugins/screen/h264-capture.js'
import {splitAnnexB} from '../lib/units/device/plugins/screen/webrtc.js'

function makeJpeg(width = 160, height = 240) {
    const data = Buffer.alloc(width * height * 4)
    for (let offset = 0; offset < data.length; offset += 4) {
        data[offset] = 32
        data[offset + 1] = 120
        data[offset + 2] = 220
        data[offset + 3] = 255
    }
    return jpeg.encode({data, width, height}, 70).data
}

function encodeFrame(binary, frame, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const child = spawn(binary, ['500000', '10', '320'], {stdio: ['pipe', 'pipe', 'pipe']})
        let output = Buffer.alloc(0)
        let errors = ''
        const header = Buffer.alloc(4)
        header.writeUInt32BE(frame.length)
        const framedJpeg = Buffer.concat([header, frame])
        const frameTimer = setInterval(() => {
            if (child.stdin.writable) {
                child.stdin.write(framedJpeg)
            }
        }, 250)
        const timer = setTimeout(() => {
            clearInterval(frameTimer)
            child.kill('SIGKILL')
            reject(new Error(`Timed out waiting for VideoToolbox H.264 output: ${errors}`))
        }, timeoutMs)
        child.stderr.on('data', data => {
            errors += data
        })
        child.on('error', error => {
            clearTimeout(timer)
            clearInterval(frameTimer)
            reject(error)
        })
        child.stdout.on('data', data => {
            output = Buffer.concat([output, data])
            if (output.length < 5) return
            const length = output.readUInt32BE(1)
            if (output.length < 5 + length) return
            clearTimeout(timer)
            clearInterval(frameTimer)
            child.stdin.end()
            resolve({keyframe: output[0] === 1, data: output.subarray(5, 5 + length)})
        })
        child.on('exit', code => {
            if (code !== 0 && output.length < 5) {
                clearTimeout(timer)
                clearInterval(frameTimer)
                reject(new Error(`VideoToolbox helper exited with ${code}: ${errors}`))
            }
        })
        child.stdin.write(framedJpeg)
    })
}

test('reads JPEG dimensions without decoding the full frame', () => {
    const frame = makeJpeg(96, 144)
    assert.deepEqual(jpegDimensions(frame), {width: 96, height: 144})
    assert.equal(jpegDimensions(Buffer.from('not-a-jpeg')), null)
})

test('separates SPS and PPS from an iOS keyframe for WebCodecs configuration', () => {
    const startCode = Buffer.from([0, 0, 0, 1])
    const sps = Buffer.concat([startCode, Buffer.from([0x67, 0x42, 0xe0, 0x1e])])
    const pps = Buffer.concat([startCode, Buffer.from([0x68, 0xce, 0x06])])
    const idr = Buffer.concat([startCode, Buffer.from([0x65, 0x88, 0x84])])

    const result = partitionAnnexBParameterSets(Buffer.concat([sps, pps, idr]))

    assert.deepEqual(result.config, Buffer.concat([sps, pps]))
    assert.deepEqual(result.frame, idr)
})

test('publishes the initial iOS codec config before its keyframe', () => {
    const startCode = Buffer.from([0, 0, 0, 1])
    const sps = Buffer.concat([startCode, Buffer.from([0x67, 0x42, 0xe0, 0x1e])])
    const pps = Buffer.concat([startCode, Buffer.from([0x68, 0xce, 0x06])])
    const idr = Buffer.concat([startCode, Buffer.from([0x65, 0x88, 0x84])])
    const encoded = Buffer.concat([sps, pps, idr])
    const output = Buffer.alloc(5 + encoded.length)
    output[0] = 1
    output.writeUInt32BE(encoded.length, 1)
    encoded.copy(output, 5)

    const packets = []
    const capture = new IosH264Capture()
    capture.on('packet', packet => packets.push(packet))
    capture.onEncoderData(output)

    assert.equal(packets.length, 2)
    assert.equal(packets[0].config, true)
    assert.deepEqual(packets[0].data, Buffer.concat([sps, pps]))
    assert.equal(packets[1].keyframe, true)
    assert.deepEqual(packets[1].data, idr)
})

test('coalesces concurrent WDA screen-stall recovery and reopens MJPEG', async() => {
    let recoveryCalls = 0
    let closeCalls = 0
    let openCalls = 0
    const capture = new IosH264Capture({
        recoverScreenCapture: async() => {
            recoveryCalls += 1
            await new Promise(resolve => setTimeout(resolve, 10))
        }
    })
    capture.on('warning', () => {})
    capture.closeMjpegStream = () => {
        closeCalls += 1
    }
    capture.openMjpegStream = () => {
        openCalls += 1
    }

    const first = capture.recoverMjpegStream('test stall')
    const second = capture.recoverMjpegStream('duplicate stall')
    assert.equal(first, second)
    await first

    assert.equal(recoveryCalls, 1)
    assert.equal(closeCalls, 1)
    assert.equal(openCalls, 1)
    assert.equal(capture.recovering, false)
})

test('pauses the MJPEG source during WDA actions without stopping the encoder', () => {
    let closeCalls = 0
    let openCalls = 0
    const capture = new IosH264Capture()
    capture.closeMjpegStream = () => {
        closeCalls += 1
    }
    capture.openMjpegStream = () => {
        openCalls += 1
    }

    capture.pause()
    capture.pause()
    assert.equal(capture.paused, true)
    assert.equal(capture.stopped, false)
    assert.equal(closeCalls, 1)

    capture.resume()
    capture.resume()
    assert.equal(capture.paused, false)
    assert.equal(openCalls, 1)
})

test('keeps only the newest JPEG while an encoder frame is in flight', () => {
    const writes = []
    const capture = new IosH264Capture()
    capture.process = {
        stdin: {
            writable: true,
            write(data) {
                writes.push(Buffer.from(data))
                return true
            }
        }
    }
    const first = Buffer.from('first-frame')
    const stale = Buffer.from('stale-frame')
    const newest = Buffer.from('newest-frame')

    capture.enqueueJpegFrame(first)
    capture.enqueueJpegFrame(stale)
    capture.enqueueJpegFrame(newest)

    assert.equal(writes.length, 1)
    assert.deepEqual(writes[0].subarray(4), first)
    assert.deepEqual(capture.pendingJpegFrame, newest)

    const encoded = Buffer.from([0, 0, 0, 1, 0x65, 0x01])
    const output = Buffer.alloc(5 + encoded.length)
    output[0] = 1
    output.writeUInt32BE(encoded.length, 1)
    encoded.copy(output, 5)
    capture.onEncoderData(output)

    assert.equal(writes.length, 2)
    assert.deepEqual(writes[1].subarray(4), newest)
    assert.equal(capture.pendingJpegFrame, null)
})

test('re-encodes a WDA JPEG frame as Annex-B H.264 with VideoToolbox', {timeout: 45000}, async() => {
    const frame = makeJpeg()
    const binary = await encoderBinary()
    const packet = await encodeFrame(binary, frame)
    const nalTypes = splitAnnexB(packet.data).map(nal => nal[0] & 0x1f)
    assert.equal(packet.keyframe, true)
    assert.ok(nalTypes.includes(7), `missing SPS in NAL types: ${nalTypes}`)
    assert.ok(nalTypes.includes(8), `missing PPS in NAL types: ${nalTypes}`)
    assert.ok(nalTypes.includes(5), `missing IDR in NAL types: ${nalTypes}`)
})
