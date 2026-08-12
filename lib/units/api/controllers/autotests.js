import * as apiutil from '../../../util/apiutil.js'
import groups from './groups.js'
import dbapi from '../../../db/api.js'
import wireutil from '../../../wire/util.js'
import {WireRouter} from '../../../wire/router.js'
import wire from '../../../wire/index.js'
import {v4 as uuidv4} from 'uuid'
import logger from '../../../util/logger.js'
import * as Sentry from '@sentry/node'
import _ from 'lodash'
import useDevice, {UseDeviceError} from '../helpers/useDevice.js'
import {InstallResultMessage} from '../../../wire/wire.js'
import BuildModel from '../../../db/models/build/index.js'

const log = logger.createLogger('api:controllers:autotests')

// iOS devices are not guaranteed to carry the `ios` boolean: the live records
// use `platform: 'iOS'/'tvOS'` and `manufacturer: 'Apple'` instead. Mirror the
// detection used by the device-type filter so build snapshots label correctly.
function isIosDevice(device) {
    return device.ios === true ||
        /^(ios|tvos)$/i.test(device.platform || '') ||
        /^apple$/i.test(device.manufacturer || '')
}

// Snapshot the devices of an autotests group into its build record so the
// run history stays intact even after the group itself is deleted.
function syncBuildDevices(buildId) {
    return dbapi.getGroup(buildId)
        .then(function(group) {
            if (!group) {
                // Group was rolled back (quota/conflict/not enough devices)
                return BuildModel.updateBuild(buildId, {
                    state: 'failed',
                    releasedAt: new Date()
                })
            }
            return dbapi.loadDevicesBySerials(group.devices || []).then(function(devices) {
                return BuildModel.updateBuild(buildId, {
                    devices: (devices || []).map(function(device) {
                        return {
                            serial: device.serial,
                            model: device.model || null,
                            marketName: device.marketName || null,
                            version: device.version || null,
                            manufacturer: device.manufacturer || null,
                            ios: isIosDevice(device)
                        }
                    })
                })
            })
        })
        .catch(function(err) {
            log.error('Failed to sync build devices: %s', err?.message || err)
        })
}

// Reserve specific devices: reuse the filtered capture path with a
// serial $in condition so the free/ready/bookable checks and locking
// still apply, and needAmount guarantees all requested serials are taken.
function serialsToBody(serialList, needAmount) {
    return {
        amount: serialList.length,
        needAmount: needAmount === undefined ? true : needAmount,
        isInternal: true,
        filters: {serial: {$in: serialList}}
    }
}

function parseSerials(serials) {
    return _.without((serials || '').split(','), '')
}

function captureDevices(req, res) {
    const amount = req.query.amount
    const needAmount = req.query.need_amount
    const runId = req.query.run // instead of group name
    const project = (req.query.project || '').toString().trim().slice(0, 120) || null
    const abi = req.query.abi
    const model = req.query.model
    const type = req.query.type
    const sdk = req.query.sdk
    const version = req.query.version
    const serialList = parseSerials(req.query.serials)
    const email = req.user.email
    const privilege = req.user.privilege
    const username = req.user.name
    const runUrl = req.query.runUrl
    const timeout = Number(req.query.timeout) * 1000 // because Date use milliseconds
    const now = Date.now()
    const start = new Date(now)
    const stop = new Date(now + timeout)
    const dates = apiutil.computeGroupDates({start: start, stop: stop}, apiutil.ONCE, 0)
    const state = apiutil.READY
    if (!serialList.length && !amount) {
        apiutil.respond(res, 400, 'Bad Request (amount or serials is required)')
        return
    }
    const requestedDevices = serialList.length || Number(amount)
    if (requestedDevices > 2 && privilege === apiutil.USER) {
        apiutil.respond(res, 400, 'Non admins cant use more than 2 devices')
        return
    }
    log.info('Creating group for autotests with params')
    log.info('Devices amount - %s', amount)
    log.info('Need amount - %s', needAmount)
    log.info('Serials - %s', serialList.join(',') || '-')
    log.info('Run Id - %s', runId)
    log.info('Timeout - %s', timeout)
    return groups.createGroupFunc(res, apiutil.ONCE, email, 0, runId, username, privilege, false, dates, start, stop, 0, state, runUrl)
        .then(function(group) {
            if (typeof group !== 'boolean' && group) {
                const deviceReq = { // fucking hell
                    params: {
                        id: group.id
                    },
                    query: {},
                    body: serialList.length ? serialsToBody(serialList, needAmount) : {
                        amount: amount,
                        needAmount: needAmount,
                        isInternal: true,
                        abi: abi,
                        model: model,
                        version: version,
                        sdk: sdk,
                        type: type
                    },
                    user: req.user,
                }
                const build = {
                    id: group.id,
                    name: runId,
                    project: project,
                    runUrl: runUrl || null,
                    owner: {
                        email: email,
                        name: username
                    },
                    state: 'running',
                    started: start,
                    plannedStop: stop,
                    releasedAt: null,
                    testResult: null,
                    scenarios: [],
                    devices: []
                }
                return dbapi.addAdminsToGroup(group.id)
                    .then(() => groups.addGroupDevices(deviceReq, res))
                    .then(function(allocatedGroup) {
                        if (!allocatedGroup) {
                            return null
                        }
                        return BuildModel.createBuild(build)
                            .then(() => syncBuildDevices(group.id))
                            .then(() => allocatedGroup)
                    })
            }
            else {
                apiutil.respond(res, 403, 'Forbidden (groups number quota is reached, autotests)')
            }
        })
        .catch(function(err) {
            apiutil.internalError(res, 'Failed to create group: ', err.stack)
        })
}

function addDevices(req, res) {
    const amount = req.query.amount
    const needAmount = req.query.need_amount
    const abi = req.query.abi
    const model = req.query.model
    const type = req.query.type
    const sdk = req.query.sdk
    const version = req.query.version
    const serialList = parseSerials(req.query.serials)
    const groupId = req.params.id

    const deviceReq = { // fucking hell
        params: {
            id: groupId
        },
        query: {},
        body: serialList.length ? serialsToBody(serialList, needAmount) : {
            amount: amount,
            needAmount: needAmount,
            isInternal: true,
            abi: abi,
            model: model,
            version: version,
            sdk: sdk,
            type: type
        },
        user: req.user,
    }
    return Promise.resolve(groups.addGroupDevices(deviceReq, res)).then((result) => {
        return syncBuildDevices(groupId).then(() => result)
    })
}

function freeDevices(req, res) {
    const groupId = req.query.group
    // Optional test outcome reported by the client on release; shown as a
    // PASSED/FAILED badge on the Builds page. Left unset when not reported.
    const testResult = ['passed', 'failed'].includes(req.query.result) ? req.query.result : null
    let request = {
        body: {
            ids: groupId
        },
        user: req.user,
        query: {
            redirected: true
        },
        options: req.options
    }
    const ids = _.without((groupId || '').split(','), '')
    Promise.all(ids.map(function(id) {
        return dbapi.getGroup(id)
            .then(function(group) {
                const patch = {
                    state: 'finished',
                    releasedAt: new Date()
                }
                if (testResult) {
                    patch.testResult = testResult
                }
                if (group?.devices?.length) {
                    return dbapi.loadDevicesBySerials(group.devices).then(function(devices) {
                        patch.devices = (devices || []).map(function(device) {
                            return {
                                serial: device.serial,
                                model: device.model || null,
                                marketName: device.marketName || null,
                                version: device.version || null,
                                manufacturer: device.manufacturer || null,
                                ios: isIosDevice(device)
                            }
                        })
                        return BuildModel.updateBuild(id, patch)
                    })
                }
                return BuildModel.updateBuild(id, patch)
            })
            .catch(function(err) {
                log.error('Failed to finalize build %s: %s', id, err?.message || err)
            })
    })).finally(function() {
        groups.deleteGroups(request, res)
    })
}

function installOnDevice(req, res) {
    const serial = req.params.serial
    const apkUrl = req.body.url.replace('apk', 'blob')
    let installFlags = apiutil.getBodyParameter(req.body, 'installFlags')
    if (installFlags) {
        installFlags = _.without(installFlags.toString().split(','), '')
    }
    log.info(`Install apk from url: ${apkUrl}`)
    log.info('Adb install flags: ' + installFlags)
    // log.info('Manifest captured succesfully')
    let manifest = {
        package: 'app_from_api',
        application: {launcherActivities: []}
    }
    return dbapi.loadDeviceBySerial(serial).then(device => {
        if (device === null) {
            res.status(404).json({
                success: false,
                description: 'Could not find device by serial'
            })
            return
        }
        let responseChannel = 'txn_' + uuidv4()
        req.options.sub.subscribe(responseChannel)
        // Timer will be called if no InstallResultMessage is received till 5 seconds
        let timer = setTimeout(function() {
            req.options.channelRouter.removeListener(responseChannel, messageListener)
            req.options.sub.unsubscribe(responseChannel)
            log.info('Installation result: Device is not responding')
            return apiutil.respond(res, 504, 'Device is not responding')
        }, apiutil.INSTALL_APK_WAIT)
        let messageListener = new WireRouter()
            .on(InstallResultMessage, function(channel, message) {
                if (message.serial === serial) {
                    clearTimeout(timer)
                    req.options.sub.unsubscribe(responseChannel)
                    req.options.channelRouter.removeListener(responseChannel, messageListener)
                    log.info('Installation result:' + message.result)
                    if (message.result === 'Installed successfully') {
                        return res.json({
                            success: true,
                            description: message.result
                        })
                    }
                    else {
                        return res.status(400).json({
                            success: false,
                            description: message.result
                        })
                    }
                }
            })
            .handler()
        req.options.channelRouter.on(responseChannel, messageListener)
        let isApi = true
        log.info('Sending InstallMessage on channel ', device.channel, ' with response in ', responseChannel)
        req.options.push.send([
            device.channel,
            wireutil.transaction(responseChannel, new wire.InstallMessage(apkUrl, false, // <- doesn't work
                isApi, JSON.stringify(manifest), installFlags, req.internalJwt))
        ])
    })
}

async function useAndConnectDevice(req, res) {
    const serial = req.hasOwnProperty('body') ? req.body.serial : req.query.serial
    try {
        const device = await dbapi.loadDevice(req.user.groups.subscribed, serial)
        const remoteConnectUrl = await useDevice({
            user: req.user,
            device,
            channelRouter: req.options.channelRouter,
            push: req.options.push,
            sub: req.options.sub,
            usage: 'automation',
            log
        })

        return res.json({
            success: true,
            description: 'Device is in use and remote connection is enabled',
            remoteConnectUrl
        })
    }
    catch (/** @type {any} */err) {
        switch (err) {
        case UseDeviceError.NOT_FOUND:
            return res.status(404).json({
                success: false,
                description: 'Device not found'
            })

        case UseDeviceError.ALREADY_IN_USE:
            return res.status(403).json({
                success: false,
                description: 'Device is currently in use or not available'
            })

        case UseDeviceError.FAILED_JOIN:
            Sentry.captureMessage('504: Device is not responding (failed to join group)')
            return apiutil.respond(res, 504, 'Device is not responding (failed to join group)')

        case UseDeviceError.FAILED_CONNECT:
            Sentry.captureMessage('504: Device is not responding (failed to connect to device)')
            return apiutil.respond(res, 504, 'Device is not responding (failed to connect to device)')

        default:
            log.error('Failed to load device "%s": ', req.params.serial, err.stack)
            apiutil.respond(res, 500, 'Failed to load device', {deviceSerial: req.params.serial})
        }
    }
}
export {captureDevices}
export {freeDevices}
export {installOnDevice}
export {useAndConnectDevice}
export {addDevices}
export default {
    captureDevices: captureDevices,
    freeDevices: freeDevices,
    installOnDevice: installOnDevice,
    useAndConnectDevice: useAndConnectDevice,
    addDevices: addDevices
}
