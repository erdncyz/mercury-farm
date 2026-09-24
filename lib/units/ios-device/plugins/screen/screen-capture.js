import EventEmitter from 'node:events'
import IosH264Capture from './h264-capture.js'
import IosAvCaptureH264Capture, {AVCAPTURE_EXIT_CODES} from './avcapture-h264-capture.js'

export const CAPTURE_MODES = Object.freeze(['auto', 'avcapture', 'mjpeg'])
// USB mirroring is opt-in: enabling screen capture makes the device re-enumerate
// on USB, which drops the usbmux tunnels to WDA and kills the device worker.
export const DEFAULT_CAPTURE_MODE = 'mjpeg'
const AVCAPTURE_RETRY_COOLDOWN_MS = 60000
const avCaptureUnavailableUntil = new Map()

export function normalizeCaptureMode(value) {
    const mode = String(value || DEFAULT_CAPTURE_MODE).trim().toLowerCase()
    return CAPTURE_MODES.includes(mode) ? mode : DEFAULT_CAPTURE_MODE
}

// Picks the fastest available iOS screen source. USB mirroring is tried first
// and the WDA MJPEG path is kept as the fallback for devices that are not on
// USB, providers without camera permission, or explicit opt-out.
export default class IosScreenCapture extends EventEmitter {
    constructor(options = {}, captures = {}) {
        super()
        this.options = options
        this.AvCapture = captures.AvCapture || IosAvCaptureH264Capture
        this.MjpegCapture = captures.MjpegCapture || IosH264Capture
        this.mode = normalizeCaptureMode(options.captureMode)
        this.inner = null
        this.source = null
        this.stopped = false
    }

    shouldTryAvCapture() {
        if (this.mode === 'mjpeg') {
            return false
        }
        if (this.mode === 'avcapture') {
            return true
        }
        const until = avCaptureUnavailableUntil.get(this.options.serial) || 0
        return Date.now() >= until
    }

    async start() {
        this.stopped = false
        if (this.shouldTryAvCapture()) {
            try {
                const info = await this.startInner(new this.AvCapture(this.options), 'avcapture')
                avCaptureUnavailableUntil.delete(this.options.serial)
                return info
            }
            catch (error) {
                if (this.mode === 'avcapture' || this.stopped) {
                    throw error
                }
                if (error.code === AVCAPTURE_EXIT_CODES.deviceNotFound ||
                    error.code === AVCAPTURE_EXIT_CODES.permissionDenied) {
                    avCaptureUnavailableUntil.set(this.options.serial, Date.now() + AVCAPTURE_RETRY_COOLDOWN_MS)
                }
                this.emit('warning', new Error(`Falling back to WDA MJPEG screen capture: ${error.message}`))
            }
        }
        return this.startInner(new this.MjpegCapture(this.options), 'mjpeg')
    }

    async startInner(capture, source) {
        this.detachInner()
        this.inner = capture
        this.source = source
        capture.on('packet', packet => this.emit('packet', packet))
        capture.on('warning', warning => this.emit('warning', warning))
        capture.on('error', error => {
            if (this.inner === capture) {
                this.emit('error', error)
            }
        })
        try {
            return await capture.start()
        }
        catch (error) {
            this.detachInner()
            throw error
        }
    }

    detachInner() {
        if (this.inner) {
            this.inner.removeAllListeners()
            this.inner.stop()
        }
        this.inner = null
        this.source = null
    }

    pause() {
        this.inner?.pause()
    }

    resume() {
        this.inner?.resume()
    }

    stop() {
        this.stopped = true
        this.detachInner()
    }
}
