import assert from 'node:assert/strict'
import net from 'node:net'
import test from 'node:test'
import {
    buildAppSwitcherGesture,
    createWdaSessionWithRecovery,
    getDirectionalSwipe,
    hasPhysicalHomeButton,
    isPointerAction,
    watchWdaMjpeg
} from '../lib/units/ios-device/plugins/wda/client.js'

test('restarts WDA once when session bootstrap times out', async() => {
    let createCalls = 0
    let restartCalls = 0
    const result = await createWdaSessionWithRecovery({
        createSession: async() => {
            createCalls += 1
            if (createCalls === 1) {
                throw new Error('ESOCKETTIMEDOUT')
            }
            return {sessionId: 'recovered-session'}
        },
        restartWda: async() => {
            restartCalls += 1
        }
    })

    assert.equal(result.sessionId, 'recovered-session')
    assert.equal(createCalls, 2)
    assert.equal(restartCalls, 1)
})

test('recovers a missing session id and accepts nested WDA responses', async() => {
    let createCalls = 0
    let restartCalls = 0
    const result = await createWdaSessionWithRecovery({
        createSession: async() => {
            createCalls += 1
            return createCalls === 1 ? {value: {}} : {value: {sessionId: 'nested-session'}}
        },
        restartWda: async() => {
            restartCalls += 1
        }
    })

    assert.equal(result.sessionId, 'nested-session')
    assert.equal(restartCalls, 1)
})

test('does not loop indefinitely when WDA session recovery fails', async() => {
    let createCalls = 0
    let restartCalls = 0
    await assert.rejects(() => createWdaSessionWithRecovery({
        createSession: async() => {
            createCalls += 1
            throw new Error(`failure-${createCalls}`)
        },
        restartWda: async() => {
            restartCalls += 1
        }
    }), /failure-2/)

    assert.equal(createCalls, 2)
    assert.equal(restartCalls, 1)
})

test('uses directional swipes for large axis-aligned scroll gestures', () => {
    assert.equal(getDirectionalSwipe({fromX: 200, fromY: 700, toX: 205, toY: 250}), 'up')
    assert.equal(getDirectionalSwipe({fromX: 350, fromY: 400, toX: 100, toY: 390}), 'left')
})

test('keeps precise actions for short or diagonal drags', () => {
    assert.equal(getDirectionalSwipe({fromX: 200, fromY: 300, toX: 210, toY: 350}), null)
    assert.equal(getDirectionalSwipe({fromX: 100, fromY: 100, toX: 300, toY: 300}), null)
})

test('recognizes an iOS pointer tap', () => {
    assert.equal(isPointerAction({
        actions: [{
            type: 'pointer',
            actions: [
                {type: 'pointerMove', duration: 0, x: 100, y: 200},
                {type: 'pointerDown', button: 0},
                {type: 'pointerMove', duration: 0, x: 100, y: 200},
                {type: 'pointerUp'}
            ]
        }]
    }), true)
})

test('recognizes an iOS pointer swipe', () => {
    assert.equal(isPointerAction({
        actions: [{
            type: 'pointer',
            actions: [
                {type: 'pointerDown', button: 0},
                {type: 'pause', duration: 40},
                {type: 'pointerMove', duration: 300, x: 100, y: 200},
                {type: 'pointerUp'}
            ]
        }]
    }), true)
})

test('does not classify keyboard actions as pointer gestures', () => {
    assert.equal(isPointerAction({
        actions: [{type: 'key', actions: [{type: 'keyDown', value: 'a'}]}]
    }), false)
})

test('detects home-button iPhones from their point size', () => {
    assert.equal(hasPhysicalHomeButton({width: 375, height: 667}), true)
    assert.equal(hasPhysicalHomeButton({width: 736, height: 414}), true)
    assert.equal(hasPhysicalHomeButton({width: 402, height: 874}), false)
    assert.equal(hasPhysicalHomeButton({width: 820, height: 1180}), false)
    assert.equal(hasPhysicalHomeButton(null), false)
})

test('opens the app switcher with a bottom-edge drag that holds mid-screen', () => {
    assert.deepEqual(buildAppSwitcherGesture({width: 402, height: 874}), {
        fromX: 201,
        fromY: 872,
        toX: 201,
        toY: 437,
        pressDuration: 0.05,
        velocity: 1000,
        holdDuration: 0.8
    })
})

const quietLog = {info() {}, warn() {}}
const delay = (ms) => new Promise(r => setTimeout(r, ms))

function listen(onConnection) {
    return new Promise((resolve) => {
        const server = net.createServer(onConnection)
        server.listen(0, '127.0.0.1', () => resolve(server))
    })
}

test('reconnects to WDA MJPEG after a brief drop instead of reporting it lost', async() => {
    let connections = 0
    const server = await listen((conn) => {
        connections += 1
        if (connections === 1) {
            conn.destroy()
        }
    })
    let lost = 0
    const watcher = watchWdaMjpeg({
        socket: new net.Socket(),
        port: server.address().port,
        host: '127.0.0.1',
        log: quietLog,
        onLost: () => { lost += 1 },
        retryDelayMs: 10
    })
    await delay(200)
    watcher.stop()
    server.close()

    assert.equal(connections, 2)
    assert.equal(lost, 0)
})

test('reports WDA MJPEG lost once reconnects are exhausted without crashing on refusal', async() => {
    const server = await listen(() => {})
    const {port} = server.address()
    await new Promise(r => server.close(r))

    let lost = 0
    watchWdaMjpeg({
        socket: new net.Socket(),
        port,
        host: '127.0.0.1',
        log: quietLog,
        onLost: () => { lost += 1 },
        attempts: 2,
        retryDelayMs: 10
    })
    await delay(300)

    assert.equal(lost, 1)
})

test('resets the WDA MJPEG reconnect budget after a stable connection', async() => {
    const sockets = []
    const server = await listen((conn) => sockets.push(conn))
    let lost = 0
    const watcher = watchWdaMjpeg({
        socket: new net.Socket(),
        port: server.address().port,
        host: '127.0.0.1',
        log: quietLog,
        onLost: () => { lost += 1 },
        attempts: 1,
        retryDelayMs: 10,
        stableMs: 30
    })
    for (let i = 0; i < 3; i++) {
        await delay(80)
        sockets.at(-1).destroy()
    }
    await delay(80)
    watcher.stop()
    server.close()

    assert.equal(sockets.length, 4)
    assert.equal(lost, 0)
})

test('carries the per-user iOS screen capture mode over the wire', async() => {
    const {ApplyIosRuntimeSettingsMessage} = await import('../lib/wire/wire.js')
    const encode = (screenCaptureMode) => ApplyIosRuntimeSettingsMessage.fromBinary(
        ApplyIosRuntimeSettingsMessage.toBinary(ApplyIosRuntimeSettingsMessage.create({typeKeyDelayMs: 80, screenCaptureMode}))
    )

    assert.equal(encode('auto').screenCaptureMode, 'auto')
    assert.equal(encode('').screenCaptureMode, '')
    assert.equal(encode(undefined).screenCaptureMode, undefined)
})
