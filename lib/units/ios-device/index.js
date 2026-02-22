import syrup from '@devicefarmer/stf-syrup'
import logger from '../../util/logger.js'
import lifecycle from '../../util/lifecycle.js'
import logger$0 from '../base-device/support/logger.js'
import heartbeat from '../base-device/plugins/heartbeat.js'
import solo from '../base-device/plugins/solo.js'
import info from './plugins/info/index.js'
import wda from './plugins/wda/index.js'
import push from '../base-device/support/push.js'
import sub from '../base-device/support/sub.js'
import group from '../base-device/plugins/group.js'
import storage from '../base-device/support/storage.js'
import devicelog from './plugins/devicelog.js'
import stream from './plugins/screen/stream.js'
import install from './plugins/install.js'
import reboot from './plugins/reboot.js'
import clipboard from './plugins/clipboard.js'
import remotedebug from './plugins/remotedebug.js'
import filesystem from './plugins/filesystem.js'
import * as iosutil from './plugins/util/iosutil.js'
import { execFileSync } from 'child_process'
import connect from './plugins/wda/connect.js'
import WDAService from './plugins/wda/WDAService.js'

const runCommand = (cmd, args) => {
    try {
        return execFileSync(cmd, args, {timeout: 5000}).toString().trim()
    }
    catch (err) {
        return null
    }
}

const readIdeviceInfo = (serial) => {
    const productType = runCommand('ideviceinfo', ['-u', serial, '-k', 'ProductType'])
    const productVersion = runCommand('ideviceinfo', ['-u', serial, '-k', 'ProductVersion'])
    const deviceName = runCommand('ideviceinfo', ['-u', serial, '-k', 'DeviceName'])
    const architecture = runCommand('ideviceinfo', ['-u', serial, '-k', 'CPUArchitecture']) || 'arm64'

    if (!productType && !productVersion && !deviceName) {
        return null
    }

    return {
        name: deviceName || serial,
        os_version: `iOS ${productVersion || '0.0'}`,
        architecture,
        extended: {
            device: {
                ProductType: productType || null
            }
        }
    }
}

const readPymobiledeviceInfo = (serial) => {
    const raw = runCommand('pymobiledevice3', ['lockdown', 'info', '--udid', serial, '--json'])

    if (!raw) {
        return null
    }

    try {
        const parsed = JSON.parse(raw)
        const productType = parsed.ProductType || null
        const productVersion = parsed.ProductVersion || '0.0'
        const deviceName = parsed.DeviceName || serial
        const architecture = parsed.CPUArchitecture || 'arm64'

        return {
            name: deviceName,
            os_version: `iOS ${productVersion}`,
            architecture,
            extended: {
                device: {
                    ProductType: productType
                }
            }
        }
    }
    catch (err) {
        return null
    }
}

const resolveIosDeviceInfo = (options, log) => {
    let deviceInfo = {name: options.serial, os_version: 'iOS 0.0', architecture: 'arm64', extended: {device: {}}}
    let source = 'fallback'

    try {
        deviceInfo = JSON.parse(execFileSync('idb', ['describe', '--udid', options.serial, '--json']).toString())
        source = 'idb'
    }
    catch (err) {
        const ideviceInfo = readIdeviceInfo(options.serial)

        if (ideviceInfo) {
            deviceInfo = ideviceInfo
            source = 'ideviceinfo'
        }
        else {
            const pymobiledeviceInfo = readPymobiledeviceInfo(options.serial)

            if (pymobiledeviceInfo) {
                deviceInfo = pymobiledeviceInfo
                source = 'pymobiledevice3'
            }
            else {
                log.warn('idb/ideviceinfo/pymobiledevice3 unavailable, using fallback device info')
            }
        }
    }

    const productType = deviceInfo?.extended?.device?.ProductType
    const mappedModelName = productType ? iosutil.getModelName(productType) : null

    if (!options.isSimulator) {
        options.deviceName = mappedModelName || deviceInfo.name || options.deviceName || `iOS Device ${options.serial.substring(0, 8)}`
    }
    else {
        options.deviceName = `Simulator ${deviceInfo.name || options.serial}`
    }

    log.info('Resolved iOS device info source: %s, name: %s, productType: %s, os: %s',
        source,
        options.deviceName,
        productType || '-',
        deviceInfo.os_version || '-'
    )

    return deviceInfo
}

export default (async (/** @type {{ serial: any; } & any} */ options) => {
    console.log('DEBUG: MONGODB_PORT_27017_TCP =', process.env.MONGODB_PORT_27017_TCP)
    const wdaService = new WDAService(options.wdaPath)
    try {
        await wdaService.start(
            options.serial,
            // @ts-ignore
            ...(!options.isSimulator ? [] : [options.wdaPort, options.mjpegPort])
        )

    }
    catch (err) {
        await wdaService.cleanup(options.serial)
        lifecycle.fatal(err)
    }

    return syrup.serial()
        .dependency(logger$0)
        .define(function (options) {
            const log = logger.createLogger('ios-device')
            log.info('Preparing device options: %s', JSON.stringify(options))

            options.deviceInfo = resolveIosDeviceInfo(options, log)

            return syrup.serial()
                .dependency(heartbeat)
                .dependency(solo)
                .dependency(info)
                .dependency(wda)
                .dependency(connect)
                .dependency(push)
                .dependency(sub)
                .dependency(group)
                .dependency(storage)
                .dependency(devicelog)
                .dependency(stream)
                .dependency(install)
                .dependency(reboot)
                .dependency(clipboard)
                .dependency(remotedebug)
                .dependency(filesystem)
                .define(async (options, heartbeat, solo, info, wda, connect) => {

                    try {
                        await info.init()

                        await wda.connect()
                        solo.poke()
                        connect()

                        if (process.send) {
                            process.send('ready')
                        }
                    }
                    catch (err) {
                        lifecycle.fatal(err)
                    }
                })
                .consume(options)
        })
        .consume(options)
        .catch((err) => {
            lifecycle.fatal(err)
        })
})
