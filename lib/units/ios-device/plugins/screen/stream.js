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

        wss.on('connection', async(ws, req) => {
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

                    authed = true
                    log.info('WebSocket authenticated for device %s', options.serial)

                    // Send success message
                    ws.send(JSON.stringify({
                        type: 'auth_success',
                        message: 'Authentication successful'
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
                        message: 'Authentication error'
                    }), () => {})
                    ws.close(1008, 'Authentication error')
                }
            }

            await tryCheckDeviceGroup()

            // Orientation polling for auto-rotation detection (e.g. YouTube fullscreen)
            let lastPolledOrientation = WdaClient.orientation || 'PORTRAIT'
            let isOrientationPolling = false
            const orientationPollTimer = setInterval(async() => {
                if (!authed || ws.readyState !== ws.OPEN || !WdaClient.sessionId) {
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
            }, 2000)

            let lastFrameSentAt = 0
            let streamPaused = false
            let scalingDebounceTimer = null

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

            ws.on('message', (data, isBinary) => {
                if (!authed || isBinary) {
                    return
                }
                const match = /^(on|off|(size) ([0-9]+)x([0-9]+))$/.exec(String(data))
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
                    log.info('Screen stream paused by client (tab hidden)')
                }
                else if (match[1] === 'on') {
                    streamPaused = false
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

            const consumer = new MjpegConsumer()

            let frameStream = null
            let chain = Promise.resolve()
            let isConnectionAlive = true

            function handleSocketError(err, message) {
                log.error(message, err)
                notifier.setDeviceTemporaryUnavailable(err)
                ws.close()
            }

            /** @returns {Promise<void>} */
            const handleRequestStream = () => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (frameStream !== null) {
                            frameStream.req.end()
                        }
                        frameStream = request.get(url)
                        frameStream.on('response', response => {
                            reject({response, frameStream})
                        })
                        frameStream.on('error', err => {
                            // checking for ws connection in order to stop chain promise if connection closed
                            if (isConnectionAlive) {
                                resolve()
                            }
                            else {
                                reject()
                            }
                        })
                    }, 1000)
                })
            }
            const getRequestStream = () => {
                for (let i = 0; i < 10; i++) {
                    chain = chain.then(() => handleRequestStream())
                }
                chain
                    .then(() => handleSocketError({message: 'Connection failed to WDA MJPEG port'}, 'Consumer error'))
                    .catch(result => {
                        if (result) {
                            result.response.pipe(consumer).pipe(stream)
                            // [VD] We can't launch homeBtn here; opening in Mercury can corrupt automation run. Also no sense to execute connect
                            WdaClient.startSession()
                                .catch((err) => {
                                    log.warn('Failed to start WDA session from stream: %s', err?.message || err)
                                })
                            // WdaClient.homeBtn() //no existing session detected so we can press home button to wake up device automatically
                            // override already existing error handler
                            result.frameStream.on('error', function(err) {
                                handleSocketError(err, 'frameStream error ')
                            })
                        }
                    })
            }

            consumer.on('error', (err) => {
                handleSocketError(err, 'Consumer error')
                frameStream?.req?.end()
            })
            stream.on('error', (err) => {
                log.warn('Stream error: %s', err?.message || err)
                frameStream?.req?.end()
            })
            stream.socket.on('error', (err) => {
                log.warn('Websocket stream error: %s', err?.message || err)
                frameStream?.req?.end()
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
                frameStream?.req?.end()
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
                WdaClient.stopSession()
                isConnectionAlive = false
                log.important('ws on error event')
            })
            getRequestStream()
        })
    })
