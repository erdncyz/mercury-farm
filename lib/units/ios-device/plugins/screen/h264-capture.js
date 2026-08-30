import EventEmitter from 'node:events'
import {createHash} from 'node:crypto'
import {execFile, spawn} from 'node:child_process'
import {promisify} from 'node:util'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {Writable} from 'node:stream'
import MjpegConsumer from 'mjpeg-consumer'
import request from 'postman-request'

const execFileAsync = promisify(execFile)
const sourcePath = fileURLToPath(new URL('./ios-h264-encoder.swift', import.meta.url))
const MAX_ENCODED_FRAME_SIZE = 16 * 1024 * 1024
let compilePromise = null

export function partitionAnnexBParameterSets(data) {
    const starts = []
    for (let index = 0; index + 3 < data.length;) {
        if (data[index] === 0 && data[index + 1] === 0 && data[index + 2] === 1) {
            starts.push({offset: index, length: 3})
            index += 3
        }
        else if (data[index] === 0 && data[index + 1] === 0 &&
            data[index + 2] === 0 && data[index + 3] === 1) {
            starts.push({offset: index, length: 4})
            index += 4
        }
        else {
            index += 1
        }
    }
    if (!starts.length) {
        return {config: Buffer.alloc(0), frame: data}
    }

    const config = []
    const frame = []
    starts.forEach((start, index) => {
        const end = starts[index + 1]?.offset ?? data.length
        const nal = data.subarray(start.offset, end)
        const nalType = data[start.offset + start.length] & 0x1f
        if (nalType === 7 || nalType === 8) {
            config.push(nal)
        }
        else {
            frame.push(nal)
        }
    })
    return {
        config: Buffer.concat(config),
        frame: Buffer.concat(frame)
    }
}

function jpegDimensions(data) {
    if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
        return null
    }
    for (let offset = 2; offset + 8 < data.length;) {
        if (data[offset] !== 0xff) {
            offset += 1
            continue
        }
        const marker = data[offset + 1]
        offset += 2
        if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
            continue
        }
        if (offset + 2 > data.length) {
            break
        }
        const length = data.readUInt16BE(offset)
        if (length < 2 || offset + length > data.length) {
            break
        }
        if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) ||
            (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
            return {height: data.readUInt16BE(offset + 3), width: data.readUInt16BE(offset + 5)}
        }
        offset += length
    }
    return null
}

async function encoderBinary() {
    if (!compilePromise) {
        compilePromise = (async() => {
            const source = await fs.promises.readFile(sourcePath)
            const digest = createHash('sha256').update(source).digest('hex').slice(0, 16)
            const binary = path.join(os.tmpdir(), `mercury-ios-h264-${digest}`)
            try {
                await fs.promises.access(binary, fs.constants.X_OK)
                return binary
            }
            catch {
                const temporary = `${binary}.${process.pid}.${Date.now()}`
                const moduleCache = path.join(os.tmpdir(), 'mercury-swift-module-cache')
                try {
                    await fs.promises.mkdir(moduleCache, {recursive: true})
                    await execFileAsync('xcrun', [
                        'swiftc', '-O', '-module-cache-path', moduleCache, sourcePath,
                        '-framework', 'VideoToolbox',
                        '-framework', 'CoreMedia',
                        '-framework', 'CoreVideo',
                        '-framework', 'CoreGraphics',
                        '-framework', 'ImageIO',
                        '-o', temporary
                    ], {timeout: 120000, maxBuffer: 1024 * 1024})
                    await fs.promises.rename(temporary, binary).catch(async(error) => {
                        if (error.code !== 'EEXIST') {
                            throw error
                        }
                    })
                    return binary
                }
                finally {
                    await fs.promises.rm(temporary, {force: true}).catch(() => {})
                }
            }
        })().catch(error => {
            compilePromise = null
            throw error
        })
    }
    return compilePromise
}

export default class IosH264Capture extends EventEmitter {
    constructor(options = {}) {
        super()
        this.options = options
        this.process = null
        this.frameStream = null
        this.consumer = null
        this.sink = null
        this.output = Buffer.alloc(0)
        this.codecConfig = null
        this.encoderFrameInFlight = false
        this.encoderFrameStartedAt = 0
        this.pendingJpegFrame = null
        this.stopped = false
        this.info = null
        this.lastFrameAt = 0
        this.lastSourceFrameAt = 0
        this.stallTimer = null
        this.recovering = false
        this.recoveryPromise = null
        this.streamGeneration = 0
        this.paused = false
    }

    async start() {
        this.stopped = false
        const binary = await encoderBinary()
        if (this.stopped) {
            throw new Error('iOS H.264 capture stopped during startup')
        }

        this.process = spawn(binary, [
            String(Number(this.options.bitrate) || 1500000),
            String(Number(this.options.frameRate) || 15),
            String(Number(this.options.maxSize) || 1280)
        ], {stdio: ['pipe', 'pipe', 'pipe']})
        this.process.stdout.on('data', data => this.onEncoderData(data))
        this.process.stderr.on('data', data => {
            const message = String(data).trim()
            if (message) {
                this.emit('warning', new Error(message))
            }
        })
        this.process.on('error', error => this.fail(error))
        this.process.on('exit', (code, signal) => {
            if (!this.stopped && code !== 0) {
                this.fail(new Error(`iOS VideoToolbox encoder exited (${code ?? signal})`))
            }
        })
        this.process.stdin.on('error', error => this.fail(error))
        this.lastSourceFrameAt = Date.now()
        this.openMjpegStream()
        const stallTimeoutMs = Math.max(3000, Number(this.options.stallTimeoutMs) || 5000)
        this.stallTimer = setInterval(() => {
            if (!this.stopped && !this.paused && this.encoderFrameInFlight &&
                Date.now() - this.encoderFrameStartedAt >= stallTimeoutMs) {
                this.fail(new Error(`iOS H.264 encoder produced no frame for ${stallTimeoutMs}ms`))
                return
            }
            if (!this.stopped && !this.paused && !this.recovering &&
                Date.now() - this.lastSourceFrameAt >= stallTimeoutMs) {
                this.recoverMjpegStream(`no WDA MJPEG frames for ${stallTimeoutMs}ms`)
            }
        }, Math.min(1000, Math.floor(stallTimeoutMs / 2)))
        this.stallTimer.unref?.()
        return {name: this.options.serial || 'ios-device', width: 0, height: 0}
    }

    openMjpegStream() {
        if (this.stopped || this.paused || this.frameStream) {
            return
        }
        const generation = ++this.streamGeneration
        const consumer = new MjpegConsumer()
        const sink = new Writable({
            write: (frame, encoding, callback) => {
                this.onJpegFrame(frame)
                callback()
            }
        })
        const frameStream = request.get(this.options.url)
        this.consumer = consumer
        this.sink = sink
        this.frameStream = frameStream
        const handleStreamError = error => {
            if (generation === this.streamGeneration) {
                this.recoverMjpegStream(error.message || 'WDA MJPEG stream error')
            }
        }
        consumer.on('error', handleStreamError)
        sink.on('error', handleStreamError)
        frameStream.on('response', response => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
                handleStreamError(new Error(`WDA MJPEG request failed with HTTP ${response.statusCode}`))
            }
        })
        frameStream.on('error', handleStreamError)
        frameStream.pipe(consumer).pipe(sink)
    }

    closeMjpegStream() {
        this.streamGeneration += 1
        this.frameStream?.unpipe?.()
        this.frameStream?.req?.end()
        this.frameStream?.destroy?.()
        this.consumer?.unpipe?.()
        this.consumer?.destroy?.()
        this.sink?.destroy?.()
        this.frameStream = null
        this.consumer = null
        this.sink = null
    }

    recoverMjpegStream(reason) {
        if (this.stopped || this.paused || this.recovering) {
            return this.recoveryPromise
        }
        this.recovering = true
        this.closeMjpegStream()
        this.emit('warning', new Error(`Recovering stalled iOS screen capture: ${reason}`))
        const recover = typeof this.options.recoverScreenCapture === 'function' ?
            this.options.recoverScreenCapture(reason) :
            Promise.reject(new Error('WDA screen recovery callback is unavailable'))
        this.recoveryPromise = Promise.resolve(recover)
            .then(() => {
                if (this.stopped) {
                    return
                }
                this.lastSourceFrameAt = Date.now()
                this.openMjpegStream()
                this.emit('warning', new Error('Stalled iOS screen capture recovered'))
            })
            .catch(error => this.fail(error))
            .finally(() => {
                this.recovering = false
                this.recoveryPromise = null
            })
        return this.recoveryPromise
    }

    onJpegFrame(frame) {
        this.lastSourceFrameAt = Date.now()
        if (this.stopped || !this.process?.stdin?.writable) {
            return
        }
        const now = Date.now()
        const minInterval = Math.floor(1000 / Math.max(1, Number(this.options.frameRate) || 15))
        if (now - this.lastFrameAt < minInterval) {
            return
        }
        this.lastFrameAt = now

        if (!this.info) {
            const dimensions = jpegDimensions(frame)
            if (dimensions) {
                this.info = {name: this.options.serial || 'ios-device', ...dimensions}
                this.emit('info', this.info)
            }
        }
        this.enqueueJpegFrame(frame)
    }

    enqueueJpegFrame(frame) {
        if (this.encoderFrameInFlight) {
            // Keep one fresh frame rather than allowing interaction latency to
            // grow behind a FIFO of screenshots waiting to be encoded.
            this.pendingJpegFrame = frame
            return
        }
        this.writeJpegFrame(frame)
    }

    writeJpegFrame(frame) {
        if (this.stopped || this.paused || !this.process?.stdin?.writable) {
            return
        }
        const header = Buffer.allocUnsafe(4)
        header.writeUInt32BE(frame.length)
        this.encoderFrameInFlight = true
        this.encoderFrameStartedAt = Date.now()
        try {
            this.process.stdin.write(Buffer.concat([header, frame]))
        }
        catch (error) {
            this.encoderFrameInFlight = false
            this.encoderFrameStartedAt = 0
            this.fail(error)
        }
    }

    writePendingJpegFrame() {
        this.encoderFrameInFlight = false
        this.encoderFrameStartedAt = 0
        if (this.stopped || this.paused || !this.pendingJpegFrame) {
            return
        }
        const frame = this.pendingJpegFrame
        this.pendingJpegFrame = null
        this.writeJpegFrame(frame)
    }

    pause() {
        if (this.stopped || this.paused) {
            return
        }
        this.paused = true
        this.pendingJpegFrame = null
        this.closeMjpegStream()
    }

    resume() {
        if (this.stopped || !this.paused) {
            return
        }
        this.paused = false
        if (this.encoderFrameInFlight) {
            this.encoderFrameStartedAt = Date.now()
        }
        this.lastSourceFrameAt = Date.now()
        this.openMjpegStream()
    }

    onEncoderData(data) {
        this.output = this.output.length ? Buffer.concat([this.output, data]) : data
        while (this.output.length >= 5) {
            const keyframe = this.output[0] === 1
            const length = this.output.readUInt32BE(1)
            if (length <= 0 || length > MAX_ENCODED_FRAME_SIZE) {
                this.fail(new Error(`Invalid iOS H.264 frame size: ${length}`))
                return
            }
            if (this.output.length < 5 + length) {
                return
            }
            const frame = this.output.subarray(5, 5 + length)
            this.output = this.output.subarray(5 + length)
            const pts = Number(process.hrtime.bigint() / 1000n)
            const partitioned = partitionAnnexBParameterSets(frame)
            if (partitioned.config.length &&
                (!this.codecConfig || !partitioned.config.equals(this.codecConfig))) {
                this.codecConfig = Buffer.from(partitioned.config)
                this.emit('packet', {
                    data: this.codecConfig,
                    config: true,
                    keyframe: false,
                    pts
                })
            }
            if (!partitioned.frame.length) {
                this.writePendingJpegFrame()
                continue
            }
            this.emit('packet', {
                data: partitioned.frame,
                keyframe,
                pts
            })
            this.writePendingJpegFrame()
        }
    }

    fail(error) {
        if (this.stopped) {
            return
        }
        this.emit('error', error)
        this.stop()
    }

    stop() {
        if (this.stopped) {
            return
        }
        this.stopped = true
        clearInterval(this.stallTimer)
        this.stallTimer = null
        this.closeMjpegStream()
        if (this.process) {
            this.process.stdin.end()
            const child = this.process
            const timer = setTimeout(() => child.kill('SIGKILL'), 2000)
            timer.unref?.()
            child.once('exit', () => clearTimeout(timer))
        }
        this.process = null
        this.recoveryPromise = null
        this.encoderFrameInFlight = false
        this.encoderFrameStartedAt = 0
        this.pendingJpegFrame = null
        this.output = Buffer.alloc(0)
        this.codecConfig = null
    }
}

export {encoderBinary, jpegDimensions}
