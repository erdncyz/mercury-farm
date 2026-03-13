import syrup from '@devicefarmer/stf-syrup'
import logger from '../../../util/logger.js'
import {DeviceGetIsInOrigin} from '../../../wire/wire.js'
import wireutil from '../../../wire/util.js'
import * as grouputil from '../../../util/grouputil.js'
import solo from './solo.js'
import identity from './util/identity.js'
import service from './service.js'
import router from '../../base-device/support/router.js'
import push from '../../base-device/support/push.js'
import sub from '../../base-device/support/sub.js'
import channels from '../../base-device/support/channels.js'
import group from '../../base-device/plugins/group.js'
import {runTransactionDev} from '../../../wire/transmanager.js'

export default syrup.serial()
    .dependency(solo)
    .dependency(identity)
    .dependency(service)
    .dependency(router)
    .dependency(push)
    .dependency(sub)
    .dependency(channels)
    .dependency(group)
    .define(async(options, solo, ident, /** @type {any} */ service, router, push, sub, channels, group) => {
        const log = logger.createLogger('device:plugins:group')

        group.setCheckBeforeAction(async(message: any) =>
            !message.requirements || grouputil.match(ident, message.requirements)
        )

        group.on('join', () => {
            service.freezeRotation(0)
            service.sendCommand('input keyevent 224') // KEYCODE_WAKEUP
            service.acquireWakeLock()
        })

        group.on('leave', async() => {
            try {
                if (options.screenReset) {
                    service.pressKey('home')
                    service.thawRotation()

                    const {isInOrigin} = await runTransactionDev(
                        wireutil.global,
                        DeviceGetIsInOrigin,
                        {serial: options.serial},
                        {sub, push, router}
                    ) as { isInOrigin: boolean }

                    if (isInOrigin) {
                        log.warn('Cleaning device')

                        const cleanupCommands = [
                            'settings put system screen_brightness_mode 0',
                            'settings put system screen_brightness 0',
                            'input keyevent 223',
                            'settings put global http_proxy :0',
                            'pm clear com.android.chrome',
                            'pm clear com.chrome.beta',
                            'pm clear com.sec.android.app.sbrowser',
                            'pm uninstall com.vkontakte.android',
                            'pm uninstall com.vk.im',
                            'pm uninstall com.vk.clips',
                            'pm uninstall com.vk.calls',
                            'pm uninstall com.vk.admin',
                            'pm clear com.mi.globalbrowser',
                            'pm clear com.microsoft.emmx',
                            'pm clear com.huawei.browser',
                            'pm uninstall --user 0 com.samsung.clipboardsaveservice',
                            'pm uninstall --user 0 com.samsung.android.clipboarduiservice',
                            'rm -rf /sdcard/Downloads',
                            'rm -rf /storage/emulated/legacy/Downloads',
                            'settings put global always_finish_activities 0',
                            'pm enable-user com.google.android.gms',
                            'settings put system font_scale 1.0',
                            'echo "chrome --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line',
                            'am set-debug-app --persistent com.android.chrome'
                        ]

                        await service.setMasterMute(true)

                        for (const cmd of cleanupCommands) {
                            try {
                                await service.sendCommand(cmd)
                            }
                            catch (err: any) {
                                log.warn('Cleanup command failed: %s - %s', cmd, err?.message)
                            }
                        }
                    }
                    else {
                        log.warn('Device was not cleared because it in custom group')
                    }
                }
            }
            catch (err: any) {
                log.error('Clear device on group.leave failed: %s', err?.message)
            }
            finally {
                service.releaseWakeLock()
            }
        })

        return group
    })
