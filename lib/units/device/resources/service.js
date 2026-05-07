import util from 'util'
import syrup from '@devicefarmer/stf-syrup'
import ProtoBuf from 'protobufjs'
import semver from 'semver'
import * as pathutil from '../../../util/pathutil.cjs'
import * as streamutil from '../../../util/streamutil.js'
import logger from '../../../util/logger.js'
import {Adb} from '@u4/adbkit'
import adb from '../support/adb.js'
export default syrup.serial()
    .dependency(adb)
    .define(function(options, adb) {
        let log = logger.createLogger('device:resources:service')
        let builder = ProtoBuf.loadProtoFile(pathutil.vendor('STFService/wire.proto'))
        let STFServiceResource = {
            requiredVersion: '3.0.0',
            pkg: 'jp.co.cyberagent.stf',
            main: 'jp.co.cyberagent.stf.Agent',
            apk: pathutil.vendor('STFService/STFService.apk'),
            wire: builder.build().jp.co.cyberagent.stf.proto,
            builder: builder,
            startIntent: {
                action: 'jp.co.cyberagent.stf.ACTION_START',
                component: 'jp.co.cyberagent.stf/.Service'
            },
            path: ''
        }
        // am startservice -a jp.co.cyberagent.stf.ACTION_START jp.co.cyberagent.stf/.Service
        function getPath() {
            log.info('Calling getPath()')
            return adb.getDevice(options.serial).shell(['pm', 'path', STFServiceResource.pkg])
                .then(function(out) {
                    return streamutil.findLine(out, (/^package:/))
                        .timeout(15000)
                        .then(function(line) {
                            log.info(`getPath pm exec returned ${line}`)
                            return line.substr(8)
                        })
                })
        }
        function install() {
            const installApk = () =>
                adb.getDevice(options.serial).install(STFServiceResource.apk)
                    .then(function() {
                        log.info('Installed sucessfully')
                        return getPath()
                    })

            log.info('Checking whether we need to install STFService')
            return getPath()
                .then(function(installedPath) {
                    log.info('Running version check')
                    return adb.getDevice(options.serial).shell(util.format("CLASSPATH='%s' exec app_process /system/bin '%s' --version 2>/dev/null", installedPath, STFServiceResource.main))
                        .then(function(out) {
                            return streamutil.readAll(out)
                                .timeout(10000)
                                .then(function(buffer) {
                                    let version = buffer.toString()
                                    if (semver.satisfies(version, STFServiceResource.requiredVersion)) {
                                        return installedPath
                                    }
                                    else {
                                        throw new Error(util.format('Incompatible version %s', version))
                                    }
                                })
                        })
                })
                .catch(async function(err) {
                    log.warn('STFService validation failed, reinstalling: %s', err?.message || err)

                    try {
                        await adb.getDevice(options.serial).uninstall(STFServiceResource.pkg)
                    }
                    catch (uninstallErr) {
                        log.info('STFService uninstall skipped: %s', uninstallErr?.message || uninstallErr)
                    }

                    log.info('Installing STFService')
                    try {
                        return await installApk()
                    }
                    catch (installErr) {
                        log.error('STFService install failed: %s', installErr?.message || installErr)
                        throw installErr
                    }
                })
        }
        function setPermission(path) {
            const isGrantPermissionDenied = (output) =>
                /SecurityException/i.test(output) &&
                /GRANT_RUNTIME_PERMISSIONS|grantRuntimePermission/i.test(output)

            const grantPermission = (permission) =>
                adb.getDevice(options.serial).shell([
                    'pm', 'grant', STFServiceResource.pkg, permission
                ])
                    .then(Adb.util.readAll)
                    .then(function(out) {
                        const output = out.toString()

                        if (isGrantPermissionDenied(output)) {
                            log.info('permission grant skipped (%s): shell user cannot grant runtime permissions', permission)

                            return
                        }

                        log.debug('permission grant output (%s): %s', permission, output)
                    })
                    .catch((err) => {
                        // Older Android versions don't know some permissions; keep initialization moving.
                        log.debug('permission grant skipped (%s): %s', permission, err?.message || err)
                    })

            return grantPermission('android.permission.BLUETOOTH_CONNECT')
                .then(() => grantPermission('android.permission.SYSTEM_ALERT_WINDOW'))
                .then(() => path)
        }
        return install()
            .then(setPermission)
            .then(function(path) {
                adb.getDevice(options.serial).shell('ime enable jp.co.cyberagent.stf/.ADBKeyBoardService')
                adb.getDevice(options.serial).shell('ime set jp.co.cyberagent.stf/.ADBKeyBoardService')
                log.info('STFService up to date')
                STFServiceResource.path = path
                return STFServiceResource
            })
    })
