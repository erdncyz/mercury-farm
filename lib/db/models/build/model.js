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
