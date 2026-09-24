import db from '../../index.js'
import logger from '../../../util/logger.js'

const log = logger.createLogger('dbapi:build')

export const BUILD_RUNNING = 'running'
export const BUILD_FINISHED = 'finished'
export const BUILD_FAILED = 'failed'

/**
 * Create a build record for an automation run.
 * A build mirrors the transient group created via the autotests API,
 * but is kept as history even after the group is deleted.
 */
export const createBuild = async(build) => {
    try {
        return await db.builds.insertOne(build)
    }
    catch (err) {
        log.error('Failed to create build record: %s', err instanceof Error ? err.message : String(err))
        return null
    }
}

/** Patch a build record by id. No-op if the build does not exist. */
export const updateBuild = async(id, patch) => {
    return db.builds.updateOne({id: id}, {$set: patch})
}

// Devices in an automation group send AutomationAliveMessage every
// AUTOMATION_ALIVE_INTERVAL; a device counts as alive for AUTOMATION_ALIVE_GRACE
// after its last signal (a few missed signals are tolerated).
export const AUTOMATION_ALIVE_INTERVAL = 30 * 1000
export const AUTOMATION_ALIVE_GRACE = 3 * AUTOMATION_ALIVE_INTERVAL

const aliveCutoff = (now = Date.now()) => new Date(now - AUTOMATION_ALIVE_GRACE)

/**
 * A device is active in a build while the DB says the build owns it, or while
 * the device itself still reports being in the build's automation group. The
 * second signal keeps a run alive when the stored owner is cleared mid-run
 * (e.g. a heartbeat or USB flap marks the device absent for a moment).
 */
export const isDeviceActiveForBuild = (device, buildId, now = Date.now()) => {
    if (!device || !buildId) {
        return false
    }

    if (device.owner && (device.owner.group === buildId || device.group?.id === buildId)) {
        return true
    }

    const alive = device.automationAlive
    const aliveAt = alive?.at ? new Date(alive.at).getTime() : 0
    return aliveAt > aliveCutoff(now).getTime() && (alive.group === buildId || device.group?.id === buildId)
}

export const markDeviceAutomationAlive = async(serial, group) => {
    if (!serial || !group) {
        return null
    }

    return db.devices.updateOne(
        {serial: serial},
        {$set: {automationAlive: {group: group, at: new Date()}}}
    )
}

export const clearDeviceAutomationAlive = async(serial) => {
    return db.devices.updateOne({serial: serial}, {$unset: {automationAlive: ''}})
}

const activeDevicesFilter = (id) => ({
    $or: [
        {
            owner: {$ne: null},
            $or: [{'owner.group': id}, {'group.id': id}]
        },
        {
            'automationAlive.at': {$gt: aliveCutoff()},
            $or: [{'automationAlive.group': id}, {'group.id': id}]
        }
    ]
})

/**
 * Finish an automation build after its last device leaves the automation
 * group. Provider leases are activity based, so plannedStop is not the actual
 * finish time while ADB/WDA traffic is keeping the lease alive.
 */
export const finishBuildIfInactive = async(id) => {
    if (!id) {
        return false
    }

    const activeDevices = await db.devices.countDocuments(activeDevicesFilter(id))

    if (activeDevices > 0) {
        return false
    }

    await db.builds.updateOne(
        {id: id, state: BUILD_RUNNING},
        {$set: {state: BUILD_FINISHED, releasedAt: new Date()}}
    )

    return true
}

export const getActiveAutomationGroupIds = async() => {
    const ownedDeviceFilter = {owner: {$ne: null}}
    const aliveDeviceFilter = {'automationAlive.at': {$gt: aliveCutoff()}}
    const [ownerGroupIds, currentGroupIds, aliveGroupIds] = await Promise.all([
        db.devices.distinct('owner.group', ownedDeviceFilter),
        db.devices.distinct('group.id', ownedDeviceFilter),
        db.devices.distinct('automationAlive.group', aliveDeviceFilter)
    ])

    return [...new Set([...ownerGroupIds, ...currentGroupIds, ...aliveGroupIds].filter(Boolean))]
}

/** @returns {Promise<object | null>} */
export const getBuild = async(id) => {
    return db.builds.findOne({id: id})
}

/** @returns {Promise<Array<object>>} */
export const getBuilds = async(filter = {}, limit = 100) => {
    return db.builds
        .find(filter, {sort: {started: -1}, limit: limit})
        .toArray()
}

export const deleteBuild = async(id) => {
    return db.builds.deleteOne({id: id})
}

export const deleteBuilds = async(filter) => {
    return db.builds.deleteMany(filter)
}
