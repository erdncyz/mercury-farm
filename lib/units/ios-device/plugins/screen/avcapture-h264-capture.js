import EventEmitter from 'node:events'
import {spawn} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {partitionAnnexBParameterSets} from './h264-capture.js'
import {compileSwiftTool} from './swift-tool.js'

const sourcePath = fileURLToPath(new URL('./ios-avcapture-encoder.swift', import.meta.url))
const MAX_ENCODED_FRAME_SIZE = 16 * 1024 * 1024
const DEFAULT_FRAME_RATE = 30
const DEFAULT_DISCOVERY_TIMEOUT_MS = 10000
const DEFAULT_STALL_TIMEOUT_MS = 10000

export const AVCAPTURE_EXIT_CODES = Object.freeze({
    deviceNotFound: 2,
    permissionDenied: 3,
    captureFailure: 4
})

export function describeAvCaptureExit(code, signal) {
    switch (code) {
    case AVCAPTURE_EXIT_CODES.deviceNotFound:
        return 'iOS device is not exposed as a USB screen capture device'
    case AVCAPTURE_EXIT_CODES.permissionDenied:
        return 'macOS camera permission is required for iOS screen mirroring'
    case AVCAPTURE_EXIT_CODES.captureFailure:
        return 'iOS screen mirroring session failed'
    default:
        return `iOS screen mirroring helper exited (${code ?? signal})`
    }
}

function avCaptureBinary() {
    return compileSwiftTool({
        sourcePath,
        prefix: 'mercury-ios-avcapture',
        frameworks: ['AVFoundation', 'CoreMediaIO', 'VideoToolbox', 'CoreMedia', 'CoreVideo', 'QuartzCore', 'IOKit']
    })
}

// One mirroring helper per device, shared by successive viewers. Starting and
// stopping mirroring re-enumerates the iPhone on USB and the mirroring device
// then disappears for ~25s, so the helper stays alive until the device leaves
// or the worker exits instead of following the 3s viewer idle timeout.
export class MirrorProcess extends EventEmitter {
    constructor({binary, args, stallTimeoutMs, startupTimeoutMs, spawnFn = spawn}) {
        super()
        this.setMaxListeners(0)
        this.output = Buffer.alloc(0)
        this.lastConfig = null
        this.closed = false
        this.started = false
        this.lastFrameAt = 0
        this.stallTimer = null
        this.stallTimeoutMs = stallTimeoutMs
        this.process = spawnFn(binary, args, {stdio: ['pipe', 'pipe', 'pipe']})
        this.ready = new Promise((resolve, reject) => {
            this.readyDeferred = {resolve, reject}
        })
        this.ready.catch(() => {})
        this.startupTimer = setTimeout(() => {
            this.fail(new Error(`iOS screen mirroring produced no frames within ${startupTimeoutMs}ms`))
        }, startupTimeoutMs)
        this.startupTimer.unref?.()

        this.process.stdout.on('data', data => this.onEncoderData(data))
        this.process.stderr.on('data', data => {
            const message = String(data).trim()
            if (message) {
                this.emit('log', message)
            }
        })
        this.process.on('error', error => this.fail(error))
        this.process.on('exit', (code, signal) => {
            if (this.closed) {
                return
            }
            const error = new Error(describeAvCaptureExit(code, signal))
            error.code = code
            this.fail(error)
        })
        this.process.stdin.on('error', error => this.fail(error))
    }

    requestKeyframe() {
        if (!this.closed && this.process?.stdin?.writable) {
            this.process.stdin.write('K')
        }
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
            this.lastFrameAt = Date.now()
            this.onStarted()
            const pts = Number(process.hrtime.bigint() / 1000n)
            const partitioned = partitionAnnexBParameterSets(frame)
            if (partitioned.config.length &&
                (!this.lastConfig || !partitioned.config.equals(this.lastConfig.data))) {
                this.lastConfig = {
                    data: Buffer.from(partitioned.config),
                    config: true,
                    keyframe: false,
                    pts
                }
                this.emit('packet', this.lastConfig)
            }
            if (!partitioned.frame.length) {
                continue
            }
            this.emit('packet', {
                data: partitioned.frame,
                keyframe,
                pts
            })
        }
    }

    onStarted() {
        if (this.started) {
            return
        }
        this.started = true
        clearTimeout(this.startupTimer)
        this.startupTimer = null
        this.stallTimer = setInterval(() => {
            if (!this.closed && Date.now() - this.lastFrameAt >= this.stallTimeoutMs) {
                this.fail(new Error(`iOS screen mirroring produced no frame for ${this.stallTimeoutMs}ms`))
            }
        }, Math.min(1000, Math.floor(this.stallTimeoutMs / 2)))
        this.stallTimer.unref?.()
        this.readyDeferred.resolve()
    }

    fail(error) {
        if (this.closed) {
            return
        }
        this.close()
        this.readyDeferred.reject(error)
        this.emit('exit', error)
    }

    close() {
        if (this.closed) {
            return
        }
        this.closed = true
        clearInterval(this.stallTimer)
        this.stallTimer = null
        clearTimeout(this.startupTimer)
        this.startupTimer = null
        const child = this.process
        this.process = null
        if (child) {
            child.stdin.end()
            child.kill('SIGTERM')
            const timer = setTimeout(() => child.kill('SIGKILL'), 2000)
            timer.unref?.()
            child.once('exit', () => clearTimeout(timer))
        }
    }
}

const sharedProcesses = new Map()

export function closeSharedMirrorProcesses() {
    for (const shared of sharedProcesses.values()) {
        shared.close()
    }
    sharedProcesses.clear()
}

// Streams the iOS screen through CoreMediaIO USB mirroring (the QuickTime
// path) instead of WDA screenshots. Same event contract as IosH264Capture.
export default class IosAvCaptureH264Capture extends EventEmitter {
    constructor(options = {}, deps = {}) {
        super()
        this.options = options
        this.processes = deps.processes || sharedProcesses
        this.createProcess = deps.createProcess || (config => new MirrorProcess(config))
        this.resolveBinary = deps.resolveBinary || avCaptureBinary
        this.shared = null
        this.stopped = false
        this.needKeyframe = true
        this.sentConfig = false
        this.onSharedPacket = packet => this.forwardPacket(packet)
        this.onSharedLog = message => this.emit('warning', new Error(message))
        this.onSharedExit = error => {
            if (!this.stopped) {
                this.emit('error', error)
                this.stop()
            }
        }
    }

    get discoveryTimeoutMs() {
        return Math.max(1000, Number(this.options.avCaptureDiscoveryTimeoutMs) || DEFAULT_DISCOVERY_TIMEOUT_MS)
    }

    async start() {
        this.stopped = false
        if (!this.options.serial) {
            throw new Error('iOS screen mirroring requires a device UDID')
        }
        const binary = await this.resolveBinary()
        if (this.stopped) {
            throw new Error('iOS screen mirroring stopped during startup')
        }

        let shared = this.processes.get(this.options.serial)
        if (!shared || shared.closed) {
            shared = this.spawnShared(binary)
            this.processes.set(this.options.serial, shared)
        }
        this.shared = shared
        shared.on('packet', this.onSharedPacket)
        shared.on('log', this.onSharedLog)
        shared.on('exit', this.onSharedExit)
        try {
            await shared.ready
        }
        catch (error) {
            this.detach()
            throw error
        }
        if (this.stopped) {
            this.detach()
            throw new Error('iOS screen mirroring stopped during startup')
        }
        if (shared.lastConfig && !this.sentConfig) {
            this.emit('packet', shared.lastConfig)
            this.sentConfig = true
        }
        shared.requestKeyframe()
        return {name: this.options.serial, width: 0, height: 0}
    }

    spawnShared(binary) {
        const frameRate = Math.max(1, Math.min(60, Number(this.options.avCaptureFrameRate) || DEFAULT_FRAME_RATE))
        const shared = this.createProcess({
            binary,
            args: [
                String(this.options.serial),
                String(Number(this.options.bitrate) || 1500000),
                String(frameRate),
                String(Number(this.options.maxSize) || 1280),
                String(Math.ceil(this.discoveryTimeoutMs / 1000)),
                String(this.options.avCaptureDeviceName || '')
            ],
            stallTimeoutMs: Math.max(3000, Number(this.options.avCaptureStallTimeoutMs) || DEFAULT_STALL_TIMEOUT_MS),
            startupTimeoutMs: this.discoveryTimeoutMs + 5000
        })
        shared.once('exit', () => {
            if (this.processes.get(this.options.serial) === shared) {
                this.processes.delete(this.options.serial)
            }
        })
        return shared
    }

    forwardPacket(packet) {
        if (this.stopped) {
            return
        }
        if (packet.config) {
            this.sentConfig = true
            this.emit('packet', packet)
            return
        }
        // A viewer that joins mid-stream must not see P-frames before its
        // first IDR; the shared helper was asked for one on attach.
        if (this.needKeyframe) {
            if (!packet.keyframe) {
                return
            }
            this.needKeyframe = false
        }
        this.emit('packet', packet)
    }

    // Mirroring is independent from WDA, so there is nothing to pause while
    // XCTest performs actions; keeping frames flowing is the whole point.
    pause() {}

    resume() {}

    detach() {
        if (this.shared) {
            this.shared.off('packet', this.onSharedPacket)
            this.shared.off('log', this.onSharedLog)
            this.shared.off('exit', this.onSharedExit)
        }
        this.shared = null
    }

    // Leaves the shared helper running for the next viewer.
    stop() {
        if (this.stopped) {
            return
        }
        this.stopped = true
        this.detach()
    }
}

export {avCaptureBinary}
