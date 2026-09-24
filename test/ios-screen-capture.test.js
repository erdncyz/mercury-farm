import assert from 'node:assert/strict'
import EventEmitter from 'node:events'
import test from 'node:test'
import IosScreenCapture, {normalizeCaptureMode} from '../lib/units/ios-device/plugins/screen/screen-capture.js'
import IosAvCaptureH264Capture, {
    AVCAPTURE_EXIT_CODES,
    MirrorProcess,
    describeAvCaptureExit
} from '../lib/units/ios-device/plugins/screen/avcapture-h264-capture.js'

function fakeChild() {
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    child.stdin = Object.assign(new EventEmitter(), {
        writable: true,
        writes: [],
        write(data) {
            this.writes.push(String(data))
            return true
        },
        end() {
            this.writable = false
        }
    })
    child.killed = []
    child.kill = signal => child.killed.push(signal)
    return child
}

function fakeMirrorProcess(overrides = {}) {
    const child = fakeChild()
    const shared = new MirrorProcess({
        binary: '/bin/false',
        args: [],
        stallTimeoutMs: 3000,
        startupTimeoutMs: 60000,
        spawnFn: () => child,
        ...overrides
    })
    shared.child = child
    return shared
}

class FakeCapture extends EventEmitter {
    constructor(options, behaviour) {
        super()
        this.options = options
        this.behaviour = behaviour
        this.stopped = false
        this.paused = false
    }

    async start() {
        this.behaviour.started += 1
        if (this.behaviour.failWith) {
            throw this.behaviour.failWith
        }
        return {name: this.options.serial, width: 0, height: 0}
    }

    pause() {
        this.paused = true
    }

    resume() {
        this.paused = false
    }

    stop() {
        this.stopped = true
    }
}

function fakes({avFailWith = null} = {}) {
    const av = {started: 0, failWith: avFailWith, instances: []}
    const mjpeg = {started: 0, failWith: null, instances: []}
    const AvCapture = class extends FakeCapture {
        constructor(options) {
            super(options, av)
            av.instances.push(this)
        }
    }
    const MjpegCapture = class extends FakeCapture {
        constructor(options) {
            super(options, mjpeg)
            mjpeg.instances.push(this)
        }
    }
    return {av, mjpeg, captures: {AvCapture, MjpegCapture}}
}

function encoded(keyframe, ...nals) {
    const startCode = Buffer.from([0, 0, 0, 1])
    const payload = Buffer.concat(nals.flatMap(nal => [startCode, Buffer.from(nal)]))
    const output = Buffer.alloc(5 + payload.length)
    output[0] = keyframe ? 1 : 0
    output.writeUInt32BE(payload.length, 1)
    payload.copy(output, 5)
    return output
}

test('normalizes iOS capture mode with mjpeg as the default', () => {
    assert.equal(normalizeCaptureMode(undefined), 'mjpeg')
    assert.equal(normalizeCaptureMode(' AVCapture '), 'avcapture')
    assert.equal(normalizeCaptureMode('auto'), 'auto')
    assert.equal(normalizeCaptureMode('bogus'), 'mjpeg')
})

test('auto mode prefers USB mirroring and forwards its packets', async() => {
    const {av, mjpeg, captures} = fakes()
    const capture = new IosScreenCapture({serial: 'udid-1', captureMode: 'auto'}, captures)
    const packets = []
    capture.on('packet', packet => packets.push(packet))

    const info = await capture.start()

    assert.equal(info.name, 'udid-1')
    assert.equal(av.started, 1)
    assert.equal(mjpeg.started, 0)
    assert.equal(capture.source, 'avcapture')
    av.instances[0].emit('packet', {data: Buffer.from([1]), keyframe: true})
    assert.equal(packets.length, 1)
})

test('auto mode falls back to WDA MJPEG when the device is not on USB and remembers it', async() => {
    const notFound = new Error('no usb device')
    notFound.code = AVCAPTURE_EXIT_CODES.deviceNotFound
    const {av, mjpeg, captures} = fakes({avFailWith: notFound})
    const warnings = []
    const capture = new IosScreenCapture({serial: 'udid-fallback', captureMode: 'auto'}, captures)
    capture.on('warning', warning => warnings.push(warning.message))

    await capture.start()
    assert.equal(av.started, 1)
    assert.equal(mjpeg.started, 1)
    assert.equal(capture.source, 'mjpeg')
    assert.ok(warnings.some(message => message.includes('Falling back to WDA MJPEG')))

    // A fresh capture for the same serial skips the slow USB discovery
    // while the cooldown is active.
    const again = new IosScreenCapture({serial: 'udid-fallback', captureMode: 'auto'}, captures)
    await again.start()
    assert.equal(av.started, 1)
    assert.equal(mjpeg.started, 2)
})

test('explicit avcapture mode surfaces mirroring failures instead of falling back', async() => {
    const denied = new Error('camera denied')
    denied.code = AVCAPTURE_EXIT_CODES.permissionDenied
    const {mjpeg, captures} = fakes({avFailWith: denied})
    const capture = new IosScreenCapture({serial: 'udid-strict', captureMode: 'avcapture'}, captures)

    await assert.rejects(capture.start(), /camera denied/)
    assert.equal(mjpeg.started, 0)
})

test('explicit mjpeg mode never spawns the mirroring helper', async() => {
    const {av, mjpeg, captures} = fakes()
    const capture = new IosScreenCapture({serial: 'udid-mjpeg', captureMode: 'mjpeg'}, captures)

    await capture.start()
    assert.equal(av.started, 0)
    assert.equal(mjpeg.started, 1)

    capture.pause()
    assert.equal(mjpeg.instances[0].paused, true)
    capture.stop()
    assert.equal(mjpeg.instances[0].stopped, true)
})

test('describes mirroring helper exit codes for operators', () => {
    assert.match(describeAvCaptureExit(AVCAPTURE_EXIT_CODES.deviceNotFound), /USB screen capture device/)
    assert.match(describeAvCaptureExit(AVCAPTURE_EXIT_CODES.permissionDenied), /camera permission/)
    assert.match(describeAvCaptureExit(null, 'SIGKILL'), /SIGKILL/)
})

test('mirroring helper output is parsed into codec config and frame packets', async() => {
    const shared = fakeMirrorProcess()
    const packets = []
    shared.on('packet', packet => packets.push(packet))

    shared.child.stdout.emit('data', encoded(true, [0x67, 0x42, 0xe0, 0x1e], [0x68, 0xce, 0x06], [0x65, 0x88]))
    await shared.ready

    assert.equal(packets.length, 2)
    assert.equal(packets[0].config, true)
    assert.deepEqual(shared.lastConfig, packets[0])
    assert.equal(packets[1].keyframe, true)

    shared.child.stdout.emit('data', encoded(false, [0x41, 0x9a]))
    assert.equal(packets.length, 3)
    assert.equal(packets[2].keyframe, false)
    shared.close()
    assert.deepEqual(shared.child.killed, ['SIGTERM'])
})

test('mirroring helper exit before the first frame rejects startup with its exit code', async() => {
    const shared = fakeMirrorProcess()
    const exits = []
    shared.on('exit', error => exits.push(error))

    shared.child.emit('exit', AVCAPTURE_EXIT_CODES.deviceNotFound, null)

    await assert.rejects(shared.ready, error => error.code === AVCAPTURE_EXIT_CODES.deviceNotFound)
    assert.equal(exits.length, 1)
    assert.equal(shared.closed, true)
})

test('viewers share one mirroring helper, replay its config and wait for a fresh keyframe', async() => {
    const processes = new Map()
    let spawned = 0
    const deps = {
        processes,
        resolveBinary: async() => '/tmp/fake-mirror-helper',
        createProcess: config => {
            spawned += 1
            return fakeMirrorProcess(config)
        }
    }
    const first = new IosAvCaptureH264Capture({serial: 'udid-shared'}, deps)
    const firstPackets = []
    first.on('packet', packet => firstPackets.push(packet))
    const firstStart = first.start()
    await new Promise(resolve => setImmediate(resolve))
    const shared = processes.get('udid-shared')
    shared.child.stdout.emit('data', encoded(true, [0x67, 0x42], [0x68, 0xce], [0x65, 0x01]))
    await firstStart
    assert.equal(spawned, 1)
    assert.equal(firstPackets.filter(packet => packet.config).length, 1)
    assert.equal(firstPackets.filter(packet => !packet.config).length, 1)
    assert.deepEqual(shared.child.stdin.writes, ['K'])

    // The first viewer leaves; the helper keeps running for the next one.
    first.stop()
    assert.equal(shared.closed, false)
    assert.equal(processes.get('udid-shared'), shared)

    const second = new IosAvCaptureH264Capture({serial: 'udid-shared'}, deps)
    const secondPackets = []
    second.on('packet', packet => secondPackets.push(packet))
    await second.start()
    assert.equal(spawned, 1)
    assert.equal(secondPackets.length, 1, 'cached codec config is replayed on attach')
    assert.equal(secondPackets[0].config, true)
    assert.deepEqual(shared.child.stdin.writes, ['K', 'K'])

    shared.child.stdout.emit('data', encoded(false, [0x41, 0x9a]))
    assert.equal(secondPackets.length, 1, 'P-frames before the first IDR are dropped')
    shared.child.stdout.emit('data', encoded(true, [0x65, 0x02]))
    shared.child.stdout.emit('data', encoded(false, [0x41, 0x9b]))
    assert.equal(secondPackets.length, 3)
    assert.equal(firstPackets.length, 2, 'stopped viewer receives nothing')

    const errors = []
    second.on('error', error => errors.push(error))
    shared.child.emit('exit', AVCAPTURE_EXIT_CODES.captureFailure, null)
    assert.equal(errors.length, 1)
    assert.equal(processes.has('udid-shared'), false)
})
