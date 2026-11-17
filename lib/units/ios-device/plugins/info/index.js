import syrup from '@devicefarmer/stf-syrup'
import wireutil from '../../../../wire/util.js'
import wire from '../../../../wire/index.js'
import logger from '../../../../util/logger.js'
import request from 'request-promise'
import _ from 'lodash'
import push from '../../../base-device/support/push.js'
import sub from '../../../base-device/support/sub.js'
import solo from '../../../base-device/plugins/solo.js'
import * as iosutil from '../util/iosutil.js'
import {WireRouter} from '../../../../wire/router.js'
import {InitializeIosDeviceState, IosDevicePorts, ProbeMessage, ProviderIosMessage, UpdateIosDevice} from '../../../../wire/wire.js'

const INIT_REQUEST_TIMEOUT_MS = 30000
const SIZE_RETRY_DELAY_MS = 15000

/**
 * WDA keeps a single session, so creating one deletes any session an
 * automation client (Appium) is using. Reuse the active session when present.
 *
 * @param {{getStatus: () => Promise<any>, createSession: () => Promise<any>}} params
 * @returns {Promise<{sessionId: string, sdkVersion: string | null, reused: boolean}>}
 */
export async function resolveInfoSession({getStatus, createSession}) {
    let status = null
    try {
        status = await getStatus()
    }
    catch {
        // Fall through and create a session; that request reports real failures.
    }

    if (status?.sessionId) {
        return {
            sessionId: status.sessionId,
            sdkVersion: status.value?.os?.sdkVersion || status.value?.os?.version || null,
            reused: true
        }
    }

    const session = await createSession()
    return {
        sessionId: session?.sessionId || session?.value?.sessionId,
        sdkVersion: session?.value?.capabilities?.sdkVersion || null,
        reused: false
    }
}

export default syrup.serial()
    .dependency(push)
    .dependency(sub)
    .dependency(solo)
    .define(async(options, push, sub, solo) => {
        const log = logger.createLogger('device:info')

        const baseUrl = iosutil.getUri(options.wdaHost, options.wdaPort)

        /** @type {{width?: number, height?: number, scale?: number}} */
        const extendedInfo = {}

        log.info('device.name: ' + options.deviceName)

        let osName = options.deviceInfo.os_version.split(' ')[0]
        let osVersion = options.deviceInfo.os_version.split(' ')[1]

        const serviceData = {hasAPNS: true}
        const wsUrl = _.template(options.screenWsUrlPattern || '')({
            publicIp: options.publicIp,
            publicPort: options.screenPort,
            serial: options.serial
        })

        push.send([
            wireutil.global,
            wireutil.pack(InitializeIosDeviceState, {
                serial: options.serial,
                status: wireutil.toDeviceStatus('device'),
                provider: ProviderIosMessage.create({
                    channel: solo.channel,
                    name: options.provider,
                    screenWsUrlPattern: wsUrl
                }),
                ports: IosDevicePorts.create({
                    screenPort: options.screenPort,
                    connectPort: options.mjpegPort
                }),
                options: UpdateIosDevice.create({
                    id: options.serial,
                    name: options.deviceName,
                    platform: osName,
                    architecture: options.deviceInfo.architecture,
                    sdk: osVersion,
                    service: serviceData
                })
            })
        ])

        const handleRequest = (reqOptions) => request({timeout: INIT_REQUEST_TIMEOUT_MS, ...reqOptions})

        let sizeRetryTimer = null
        const fetchScreenMetrics = async(sessionId) => {
            const sessionPath = sessionId ? `/session/${sessionId}` : ''
            const firstSessionSize = await handleRequest({
                method: 'GET',
                uri: `${baseUrl}${sessionPath}/window/size`,
                json: true
            })
            const deviceSize = firstSessionSize.value
            let {width, height} = deviceSize
            const scaleResponse = await handleRequest({
                method: 'GET',
                uri: `${baseUrl}${sessionPath}/wda/screen`,
            })
            const parsedResponse = JSON.parse(scaleResponse)
            log.debug(`Screen sizes: ${JSON.stringify(deviceSize)}, ${scaleResponse}`)
            const scale = parsedResponse.value.scale
            height *= scale
            width *= scale

            options.deviceInfo.screenSize = deviceSize
            Object.assign(extendedInfo, {width, height, scale})
            log.info('Storing device size/scale')

            push.send([
                wireutil.global,
                wireutil.envelope(new wire.SizeIosDevice(options.serial, height, width, scale))
            ])
        }

        // window/size resolves the active app and can hang while it is busy
        // (e.g. under an automation run). Keep the worker alive and retry
        // instead of crash-looping the device.
        const retryScreenMetrics = () => {
            clearTimeout(sizeRetryTimer)
            sizeRetryTimer = setTimeout(async() => {
                try {
                    await fetchScreenMetrics(null)
                }
                catch (/** @type {any} */err) {
                    log.warn('Retrying device size lookup failed: %s', err?.message || err)
                    retryScreenMetrics()
                }
            }, SIZE_RETRY_DELAY_MS)
            sizeRetryTimer.unref?.()
        }

        const init = async() => {
            // Get device type
            let deviceType
            const deviceInfo = await handleRequest({
                method: 'GET',
                uri: `${baseUrl}/wda/device/info`,
                json: true
            })
            const currentName = options.deviceName || ''
            const looksLikeSerial = currentName === options.serial || /^[A-F0-9-]{8,}$/i.test(currentName)
            const isFallbackName = currentName.startsWith('iOS Device ') || looksLikeSerial
            const resolvedName = isFallbackName
                ? (deviceInfo.value.model || deviceInfo.value.name || currentName)
                : currentName

            if (resolvedName && resolvedName !== currentName) {
                options.deviceName = resolvedName
                push.send([
                    wireutil.global,
                    wireutil.pack(UpdateIosDevice, {
                        id: options.serial,
                        name: resolvedName,
                        platform: osName,
                        architecture: options.deviceInfo.architecture,
                        sdk: osVersion,
                        service: serviceData
                    })
                ])
            }

            let deviceInfoModel = deviceInfo.value.model.toLowerCase()
            let deviceInfoName = deviceInfo.value.name.toLowerCase()
            if (deviceInfoModel.includes('tv') || deviceInfoName.includes('tv')) {
                deviceType = 'Apple TV'
            }
            else {
                deviceType = 'iPhone'
            }
            // Store device type
            log.info('Storing device type value: ' + deviceType)
            push.send([
                wireutil.global,
                wireutil.envelope(new wire.DeviceTypeMessage(options.serial, deviceType))
            ])
            const {sessionId, sdkVersion, reused} = await resolveInfoSession({
                getStatus: () => handleRequest({
                    method: 'GET',
                    uri: `${baseUrl}/status`,
                    json: true
                }),
                createSession: () => handleRequest({
                    method: 'POST',
                    uri: `${baseUrl}/session`,
                    body: {capabilities: {}},
                    json: true,
                })
            })
            if (reused) {
                log.info('Reusing active WDA session %s for device info', sessionId)
            }
            // Store device version
            if (sdkVersion) {
                log.info('Storing device version')
                push.send([
                    wireutil.global,
                    wireutil.envelope(new wire.SdkIosVersion(options.serial, sdkVersion))
                ])
            }
            // Store battery info
            if (deviceType !== 'Apple TV') {
                try {
                    const batteryInfoResponse = await handleRequest({
                        method: 'GET',
                        uri: `${baseUrl}/session/${sessionId}/wda/batteryInfo`,
                        json: true,
                    })
                    let batteryState = iosutil.batteryState(batteryInfoResponse.value.state)
                    let batteryLevel = iosutil.batteryLevel(batteryInfoResponse.value.level)
                    push.send([
                        wireutil.global,
                        wireutil.envelope(new wire.BatteryEvent(options.serial, batteryState, 'good', 'usb', batteryLevel, 1, 0.0, 5))
                    ])
                }
                catch (/** @type {any} */err) {
                    log.warn('Failed to read battery info: %s', err?.message || err)
                }
            }
            // Store size info
            try {
                await fetchScreenMetrics(sessionId)
            }
            catch (/** @type {any} */err) {
                log.warn('Failed to read device size, retrying in background: %s', err?.message || err)
                retryScreenMetrics()
            }
        }

        // Re-report the stored screen size on demand (display.refresh from the
        // UI). Restores display.width/height in DB if they ever get corrupted,
        // which would otherwise silently break touch input.
        sub.on('message', new WireRouter()
            .on(ProbeMessage, () => {
                const {width, height, scale} = extendedInfo
                if (width && height && scale) {
                    log.info('Re-reporting device size on probe')
                    push.send([
                        wireutil.global,
                        wireutil.envelope(new wire.SizeIosDevice(options.serial, height, width, scale))
                    ])
                }
            })
            .handler())

        return {
            init, extendedInfo
        }
    })
