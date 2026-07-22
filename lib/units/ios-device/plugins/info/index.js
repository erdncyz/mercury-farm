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

        const handleRequest = (reqOptions) => {
            return new Promise((resolve, reject) => {
                request(reqOptions)
                    .then((res) => {
                        resolve(res)
                    })
                    .catch((err) => {
                        reject(err)
                    })
            })
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
            const sessionResponse = await handleRequest({
                method: 'POST',
                uri: `${baseUrl}/session`,
                body: {capabilities: {}},
                json: true,
            })
            let sessionId = sessionResponse.sessionId
            // Store device version
            log.info('Storing device version')
            push.send([
                wireutil.global,
                wireutil.envelope(new wire.SdkIosVersion(options.serial, sessionResponse.value.capabilities.sdkVersion))
            ])
            // Store battery info
            if (deviceType !== 'Apple TV') {
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
            // Store size info
            const firstSessionSize = await handleRequest({
                method: 'GET',
                uri: `${baseUrl}/session/${sessionId}/window/size`,
                json: true
            })
            let deviceSize = firstSessionSize.value
            options.deviceInfo.screenSize = deviceSize
            let {width, height} = deviceSize
            const scaleResponse = await handleRequest({
                method: 'GET',
                uri: `${baseUrl}/session/${sessionId}/wda/screen`,
            })
            let parsedResponse = JSON.parse(scaleResponse)
            log.debug(`Screen sizes: ${JSON.stringify(deviceSize)}, ${scaleResponse}`)
            let scale = parsedResponse.value.scale
            height *= scale
            width *= scale

            Object.assign(extendedInfo, {width, height, scale})
            log.info('Storing device size/scale')

            push.send([
                wireutil.global,
                wireutil.envelope(new wire.SizeIosDevice(options.serial, height, width, scale))
            ])
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
