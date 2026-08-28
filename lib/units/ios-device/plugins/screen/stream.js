// @ts-nocheck
import syrup from '@devicefarmer/stf-syrup'
import webSocketServer from 'ws'
import {Writable} from 'stream'
import MjpegConsumer from 'mjpeg-consumer'
import request from 'postman-request'
import logger from '../../../../util/logger.js'
import * as iosutil from '../util/iosutil.js'
import solo from '../../../base-device/plugins/solo.js'
import devicenotifier from '../devicenotifier.js'
import wdaClient from '../wda/client.js'
import push from '../../../base-device/support/push.js'
import group from '../../../base-device/plugins/group.js'
import {NoGroupError} from '../../../../util/grouputil.js'
import {decode} from '../../../../util/jwtutil.js'
import lifecycle from '../../../../util/lifecycle.js'
import {v4 as uuidv4} from 'uuid'
import H264WebRtcTransport from '../../../device/plugins/screen/webrtc.js'
import IosH264Capture from './h264-capture.js'
export default syrup.serial()
    .dependency(solo)
    .dependency(devicenotifier)
    .dependency(wdaClient)
    .dependency(push)
    .dependency(group)
    .define(function(options, solo, notifier, WdaClient, push, group) {
        const log = logger.createLogger('device:plugins:screen:stream')
        const wss = new webSocketServer.Server({port: options.screenPort})
        let url = iosutil.getUri(options.wdaHost, options.mjpegPort)
        const targetFps = Math.max(1, Number(options.screenFrameRate || 15))
        const webRtcTransport = new H264WebRtcTransport(options, {H264Capture: IosH264Capture}, {
            platform: 'iOS',
            streamIdPrefix: 'ios',
            captureOptions: {
                url,
                serial: options.serial,
                frameRate: targetFps,
                stallTimeoutMs: Math.max(3000, Number(process.env.IOS_SCREEN_STALL_TIMEOUT_MS || 5000)),
                recoverScreenCapture: reason => WdaClient.recoverScreenCapture(reason)
            }
        })
        options.pauseScreenCapture = () => webRtcTransport.pauseCapture()
        options.resumeScreenCapture = () => webRtcTransport.resumeCapture()
        const minFrameIntervalMs = Math.floor(1000 / targetFps)
        const maxBufferedBytes = 512 * 1024

        // Ping/pong heartbeat to detect stale connections
        const PING_INTERVAL_MS = 30000
        const PONG_TIMEOUT_MS = 10000
        const pingIntervalTimer = setInterval(() => {
            wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    log.warn('WebSocket client did not respond to ping, terminating')
                    return ws.terminate()
                }
                ws.isAlive = false
                ws.ping()
            })
        }, PING_INTERVAL_MS)

        wss.on('close', () => {
            clearInterval(pingIntervalTimer)
        })
        lifecycle.observe(() => wss.close())
        lifecycle.observe(() => webRtcTransport.close())

        wss.on('connection', async(ws, req) => {
            const id = uuidv4()
            ws.isAlive = true
            ws.on('pong', () => {
                ws.isAlive = true
            })
            // Extract token from WebSocket subprotocols
            const token = ws.protocol.substring('access_token.'.length)
            const user = !!token && decode(token, options.secret)

            if (!token || !user) {
                log.warn('WebSocket connection attempt without token from %s', req.socket.remoteAddress)
                ws.send(JSON.stringify({
                    type: 'auth_error',
                    message: 'Authentication token required'
                }))
                ws.close(1008, 'Authentication token required')
                return
            }

            let authed = false
            const tryCheckDeviceGroup = async(fail = false) => {
                try {
                    await new Promise(r => setTimeout(r, 200))

                    const deviceGroup = await group.get()
                    if (deviceGroup.email !== user?.email && !group.isAutomation()) {
                        const err = 'Device used by another user'
                        log.warn('WebSocket authentication failed for device %s: $s', options.serial, err)
                        ws.send(JSON.stringify({
                            type: 'auth_error',
                            message: err
                        }))
                        ws.close(1008, 'Authentication failed')
                        return
                    }

                    await WdaClient.startSession()
                    authed = true
                    log.info('WebSocket authenticated for device %s', options.serial)

                    // Send success message
                    ws.send(JSON.stringify({
                        type: 'auth_success',
                        message: 'Authentication successful',
                        webrtc: webRtcTransport.enabled,
                        websocketH264: webRtcTransport.enabled,
                        webrtcConfig: webRtcTransport.enabled ? webRtcTransport.clientConfig : undefined
                    }))
                }
                catch (/** @type {any} */err) {
                    if (!fail && err instanceof NoGroupError) {
                        await new Promise(r => setTimeout(r, 1000))
                        return tryCheckDeviceGroup(true)
                    }

                    log.error('WebSocket authentication error for device %s: %s', options.serial, err.message)
                    ws.send(JSON.stringify({
                        type: 'auth_error',
                        message: 'iOS control service is recovering; please retry shortly'
                    }), () => {})
                    ws.close(1013, 'iOS control service is recovering')
                }
            }

            await tryCheckDeviceGroup()

            // Orientation polling for auto-rotation detection (e.g. YouTube fullscreen)
            let lastPolledOrientation = WdaClient.orientation || 'PORTRAIT'
            let isOrientationPolling = false
            const orientationPollTimer = setInterval(async() => {
                if (!authed || ws.readyState !== ws.OPEN || !WdaClient.sessionId ||
                    WdaClient.isGestureActive?.() || WdaClient.screenRecoveryPromise) {
                    return
                }

                // Skip if previous poll is still in-flight (prevents pileup when WDA is busy)
                if (isOrientationPolling) {
                    return
                }

                isOrientationPolling = true
                try {
                    await WdaClient.getOrientation()
                    const current = WdaClient.orientation

                    if (current && current !== lastPolledOrientation) {
                        const prevOrientation = lastPolledOrientation
                        lastPolledOrientation = current
                        const degrees = iosutil.orientationToDegrees(current)

                        if (typeof degrees === 'number') {
                            log.important('Orientation changed: %s -> %s (rotation=%d), sending to client', prevOrientation, current, degrees)
                            ws.send(JSON.stringify({
                                type: 'orientation',
                                rotation: degrees
                            }))
                        }
                    }
                }
                catch (err) {
                    // Ignore polling errors
                }
                finally {
                    isOrientationPolling = false
                }
            }, 5000)

            let lastFrameSentAt = 0
            // Wait for an explicit `on` before opening the MJPEG fallback.
            // WebRTC clients negotiate H.264 on the same socket and must not
            // briefly create a second WDA screenshot broadcaster first.
            let streamPaused = true
            let scalingDebounceTimer = null
            let frameStream = null
            let pendingFrameStream = null
            let consumer = null
            let mjpegStartGeneration = 0
            let mjpegStarting = false

            const pickScalingForViewport = (width, height) => {
                const maxDim = Math.max(width, height)
                if (maxDim >= 1100) {
                    return 70
                }
                if (maxDim >= 800) {
                    return 50
                }
                if (maxDim >= 500) {
                    return 40
                }
                return 30
            }

            ws.on('message', async(data, isBinary) => {
                if (!authed || isBinary) {
                    return
                }
                const message = String(data)
                try {
                    if (await webRtcTransport.handleMessage(id, ws, message)) {
                        return
                    }
                }
                catch (error) {
                    log.warn('WebRTC signaling failed for iOS device %s: %s', options.serial, error.message)
                    if (ws.readyState === ws.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'webrtc_error',
                            message: 'Unable to start WebRTC stream'
                        }))
                    }
                    return
                }
                const match = /^(on|off|(size) ([0-9]+)x([0-9]+))$/.exec(message)
                if (!match) {
                    return
                }
                if (match[2] === 'size') {
                    if (scalingDebounceTimer) {
                        clearTimeout(scalingDebounceTimer)
                    }
                    const width = Number(match[3])
                    const height = Number(match[4])
                    scalingDebounceTimer = setTimeout(() => {
                        scalingDebounceTimer = null
                        WdaClient.setViewportScaling(pickScalingForViewport(width, height))
                    }, 300)
                    return
                }
                if (match[1] === 'off') {
                    streamPaused = true
                    stopMjpegStream()
                    log.info('Screen stream paused by client (tab hidden)')
                }
                else if (match[1] === 'on') {
                    streamPaused = false
                    startMjpegStream().catch(err => handleSocketError(err, 'Consumer error'))
                    log.info('Screen stream resumed by client')
                }
            })

            const stream = new Writable({
                write(chunk, encoding, callback) {
                    if (streamPaused) {
                        callback()
                        return
                    }

                    const now = Date.now()
                    if ((now - lastFrameSentAt) < minFrameIntervalMs) {
                        callback()
                        return
                    }

                    if (ws.readyState === ws.OPEN && ws.bufferedAmount < maxBufferedBytes) {
                        lastFrameSentAt = now
                        ws.send(chunk)
                    }
                    callback()
                }
            })

            stream.socket = ws

            let isConnectionAlive = true

            function handleSocketError(err, message) {
                log.error(message, err)
                notifier.setDeviceTemporaryUnavailable(err)
                ws.close()
            }

            const stopMjpegStream = () => {
                mjpegStartGeneration += 1
                mjpegStarting = false
                const activeFrameStream = frameStream
                frameStream = null
                activeFrameStream?.unpipe?.()
                activeFrameStream?.req?.end()
                activeFrameStream?.destroy?.()
                const pendingStream = pendingFrameStream
                pendingFrameStream = null
                pendingStream?.req?.end()
                pendingStream?.destroy?.()
                consumer?.unpipe?.()
                consumer?.destroy?.()
                consumer = null
            }

            const openMjpegRequest = () => new Promise((resolve, reject) => {
                const candidate = request.get(url)
                pendingFrameStream = candidate
                candidate.once('response', response => {
                    if (pendingFrameStream === candidate) {
                        pendingFrameStream = null
                    }
                    resolve({candidate, response})
                })
                candidate.once('error', err => {
                    if (pendingFrameStream === candidate) {
                        pendingFrameStream = null
                    }
                    reject(err)
                })
            })

            const activateMjpegStream = (result, generation) => {
                frameStream = result.candidate
                consumer = new MjpegConsumer()
                consumer.on('error', err => {
                    if (generation === mjpegStartGeneration && !streamPaused) {
                        handleSocketError(err, 'Consumer error')
                    }
                })
                result.candidate.on('error', err => {
                    if (generation === mjpegStartGeneration && !streamPaused && isConnectionAlive) {
                        handleSocketError(err, 'frameStream error ')
                    }
                })
                result.response.pipe(consumer).pipe(stream, {end: false})
                WdaClient.startSession().catch((err) => {
                    log.warn('Failed to start WDA session from stream: %s', err?.message || err)
                })
                mjpegStarting = false
            }

            const startMjpegStream = async() => {
                if (streamPaused || !isConnectionAlive || frameStream || mjpegStarting) {
                    return
                }

                const generation = ++mjpegStartGeneration
                mjpegStarting = true
                let lastError = null
                for (let attempt = 0; attempt < 10; attempt += 1) {
                    if (attempt > 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000))
                    }
                    if (generation !== mjpegStartGeneration || streamPaused || !isConnectionAlive) {
                        return
                    }

                    try {
                        const result = await openMjpegRequest()
                        if (generation !== mjpegStartGeneration || streamPaused || !isConnectionAlive) {
                            result.candidate.req?.end()
                            result.candidate.destroy?.()
                            return
                        }
                        if (result.response.statusCode < 200 || result.response.statusCode >= 300) {
                            result.candidate.req?.end()
                            result.candidate.destroy?.()
                            throw new Error(`WDA MJPEG request failed with HTTP ${result.response.statusCode}`)
                        }

                        activateMjpegStream(result, generation)
                        return
                    }
                    catch (err) {
                        lastError = err
                    }
                }

                mjpegStarting = false
                if (generation === mjpegStartGeneration && !streamPaused && isConnectionAlive) {
                    handleSocketError(lastError || {message: 'Connection failed to WDA MJPEG port'}, 'Consumer error')
                }
            }

            stream.on('error', (err) => {
                log.warn('Stream error: %s', err?.message || err)
                stopMjpegStream()
            })
            stream.socket.on('error', (err) => {
                log.warn('Websocket stream error: %s', err?.message || err)
                stopMjpegStream()
            })
            ws.on('close', async() => {
            // @TODO handle close event
            // stream.socket.onclose()
                if (!authed) {
                    return
                }

                clearInterval(orientationPollTimer)
                if (scalingDebounceTimer) {
                    clearTimeout(scalingDebounceTimer)
                    scalingDebounceTimer = null
                }
                WdaClient.viewportScaling = null
                stopMjpegStream()
                webRtcTransport.removeWebSocketClient(id)
                await webRtcTransport.removePeer(id)
                const orientation = WdaClient.orientation
                const stoppingSession = () => {
                    WdaClient.stopSession()
                    isConnectionAlive = false
                    log.important('ws on close event')
                }
                if (WdaClient.deviceType === 'Apple TV' || orientation === 'PORTRAIT') {
                    return stoppingSession()
                }

                // #770: Reset rotation to Portrait when closing device
                // Ensure that rotation is done, then stop session
                WdaClient.rotation({orientation: 'PORTRAIT'})
                await new Promise(r => setTimeout(r, 2000))
                stoppingSession()
            })
            ws.on('error', function() {
            // @TODO handle error event
            // stream.socket.onclose()
                if (!authed) {
                    return
                }

                clearInterval(orientationPollTimer)
                webRtcTransport.removeWebSocketClient(id)
                webRtcTransport.removePeer(id).catch(error => {
                    log.warn('Failed to close iOS WebRTC peer: %s', error.message)
                })
                WdaClient.stopSession()
                isConnectionAlive = false
                log.important('ws on error event')
            })
        })
    })
