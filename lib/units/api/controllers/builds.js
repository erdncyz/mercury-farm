import * as apiutil from '../../../util/apiutil.js'
import logger from '../../../util/logger.js'
import BuildModel from '../../../db/models/build/index.js'

const log = logger.createLogger('api:controllers:builds')

const BUILD_RUNNING_STATE = 'running'

// Builds older than this many days are removed automatically.
// Set BUILDS_RETENTION_DAYS=0 to disable automatic cleanup.
const RETENTION_DAYS = process.env.BUILDS_RETENTION_DAYS ?
    Number(process.env.BUILDS_RETENTION_DAYS) :
    30
const CLEANUP_INTERVAL = 60 * 60 * 1000 // at most once per hour
let lastCleanup = 0

// Matches builds that are NOT actively running
// (either not in running state, or their planned stop time has passed).
const notRunningFilter = () => ({
    $or: [
        {state: {$ne: BUILD_RUNNING_STATE}},
        {plannedStop: {$lt: new Date()}}
    ]
})

function cleanupOldBuilds() {
    if (!(RETENTION_DAYS > 0)) {
        return
    }
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL) {
        return
    }
    lastCleanup = now
    const cutoff = new Date(now - RETENTION_DAYS * 24 * 60 * 60 * 1000)
    BuildModel.deleteBuilds({started: {$lt: cutoff}})
        .then(function(result) {
            if (result?.deletedCount) {
                log.info(`Retention cleanup removed ${result.deletedCount} builds older than ${RETENTION_DAYS} days`)
            }
        })
        .catch(function(err) {
            log.error('Retention cleanup failed: %s', err instanceof Error ? err.message : String(err))
        })
}

/** @param {any} build */
function publishBuild(build, options = {}) {
    const now = Date.now()
    const plannedStop = build.plannedStop ? new Date(build.plannedStop) : null
    let state = build.state
    let finishedAt = build.releasedAt || null

    // A build whose planned stop time has passed is finished (group timed out),
    // even if it was never explicitly released.
    if (state === BUILD_RUNNING_STATE && plannedStop && plannedStop.getTime() < now) {
        state = 'finished'
        finishedAt = finishedAt || build.plannedStop
    }

    const scenarios = Array.isArray(build.scenarios) ? build.scenarios : []
    const scenarioSummary = {
        total: scenarios.length,
        passed: scenarios.filter(s => s.status === 'passed').length,
        failed: scenarios.filter(s => s.status === 'failed').length,
        skipped: scenarios.filter(s => s.status === 'skipped').length
    }
    // Explicit result from the release call wins; otherwise derive it from the
    // reported scenarios so a run with any failed scenario shows FAILED.
    const testResult = build.testResult ||
        (scenarioSummary.total > 0 ? (scenarioSummary.failed > 0 ? 'failed' : 'passed') : null)

    const published = {
        id: build.id,
        name: build.name,
        project: build.project || null,
        runUrl: build.runUrl || null,
        owner: build.owner || null,
        started: build.started,
        plannedStop: build.plannedStop,
        finishedAt: finishedAt,
        state: state,
        testResult: testResult,
        scenarioSummary: scenarioSummary,
        devices: build.devices || []
    }
    if (options.includeScenarios) {
        published.scenarios = scenarios
    }
    return published
}

/**
 * @param {any} req
 * @param {any} res
 */
function getBuilds(req, res) {
    cleanupOldBuilds()

    const limit = Math.min(Number(req.query.limit) || 100, 500)
    const filter = req.user.privilege === apiutil.ADMIN ?
        {} :
        {'owner.email': req.user.email}

    BuildModel.getBuilds(filter, limit)
        .then(function(builds) {
            res.json({
                success: true,
                description: 'Builds Information',
                builds: (builds || []).map(publishBuild)
            })
        })
        .catch(function(err) {
            apiutil.internalError(res, 'Failed to get builds: ', err.stack)
        })
}

/**
 * Delete one build by id. Allowed for the build owner and admins.
 * Actively running builds cannot be deleted.
 * @param {any} req
 * @param {any} res
 */
function deleteBuild(req, res) {
    const id = req.params.id

    BuildModel.getBuild(id)
        .then(function(build) {
            if (!build) {
                return apiutil.respond(res, 404, 'Not Found (build)')
            }

            const isAdmin = req.user.privilege === apiutil.ADMIN
            if (!isAdmin && build.owner?.email !== req.user.email) {
                return apiutil.respond(res, 403, 'Forbidden (build)')
            }

            const plannedStop = build.plannedStop ? new Date(build.plannedStop).getTime() : 0
            if (build.state === BUILD_RUNNING_STATE && plannedStop > Date.now()) {
                return apiutil.respond(res, 403, 'Forbidden (build is running)')
            }

            return BuildModel.deleteBuild(id).then(function() {
                return apiutil.respond(res, 200, 'Deleted (build)')
            })
        })
        .catch(function(err) {
            apiutil.internalError(res, 'Failed to delete build: ', err.stack)
        })
}

/**
 * Bulk delete builds. Admins delete all builds, users delete their own.
 * Actively running builds are never removed.
 * @param {any} req
 * @param {any} res
 */
function deleteBuilds(req, res) {
    const scope = req.user.privilege === apiutil.ADMIN ?
        {} :
        {'owner.email': req.user.email}
    const filter = {$and: [scope, notRunningFilter()]}

    BuildModel.deleteBuilds(filter)
        .then(function(result) {
            apiutil.respond(res, 200, 'Deleted (builds)', {deletedCount: result?.deletedCount || 0})
        })
        .catch(function(err) {
            apiutil.internalError(res, 'Failed to delete builds: ', err.stack)
        })
}

/**
 * Get one build with its full scenario list.
 * Allowed for the build owner and admins.
 * @param {any} req
 * @param {any} res
 */
function getBuild(req, res) {
    BuildModel.getBuild(req.params.id)
        .then(function(build) {
            if (!build) {
                return apiutil.respond(res, 404, 'Not Found (build)')
            }
            const isAdmin = req.user.privilege === apiutil.ADMIN
            if (!isAdmin && build.owner?.email !== req.user.email) {
                return apiutil.respond(res, 403, 'Forbidden (build)')
            }
            res.json({
                success: true,
                description: 'Build Information',
                build: publishBuild(build, {includeScenarios: true})
            })
        })
        .catch(function(err) {
            apiutil.internalError(res, 'Failed to get build: ', err.stack)
        })
}

const SCENARIO_STATUSES = ['passed', 'failed', 'skipped']
const MAX_SCENARIOS = 500

/**
 * Replace the scenario results of a build. The test client reports its
 * scenario list (e.g. from a Cucumber After hook); the Builds page shows
 * them under the run. Allowed for the build owner and admins.
 * @param {any} req
 * @param {any} res
 */
function setBuildScenarios(req, res) {
    const raw = req.body?.scenarios
    if (!Array.isArray(raw) || raw.length > MAX_SCENARIOS) {
        return apiutil.respond(res, 400, `Bad Request (scenarios must be an array of at most ${MAX_SCENARIOS})`)
    }

    const scenarios = []
    for (const entry of raw) {
        const name = (entry?.name || '').toString().trim().slice(0, 500)
        const scenarioStatus = (entry?.status || '').toString().toLowerCase()
        if (!name || !SCENARIO_STATUSES.includes(scenarioStatus)) {
            return apiutil.respond(res, 400, 'Bad Request (each scenario needs a name and a passed|failed|skipped status)')
        }
        const scenario = {name: name, status: scenarioStatus}
        if (Number.isFinite(Number(entry?.durationSec))) {
            scenario.durationSec = Number(entry.durationSec)
        }
        if (entry?.error) {
            scenario.error = entry.error.toString().slice(0, 2000)
        }
        scenarios.push(scenario)
    }

    BuildModel.getBuild(req.params.id)
        .then(function(build) {
            if (!build) {
                return apiutil.respond(res, 404, 'Not Found (build)')
            }
            const isAdmin = req.user.privilege === apiutil.ADMIN
            if (!isAdmin && build.owner?.email !== req.user.email) {
                return apiutil.respond(res, 403, 'Forbidden (build)')
            }
            return BuildModel.updateBuild(build.id, {scenarios: scenarios}).then(function() {
                apiutil.respond(res, 200, 'Updated (build scenarios)', {count: scenarios.length})
            })
        })
        .catch(function(err) {
            apiutil.internalError(res, 'Failed to set build scenarios: ', err.stack)
        })
}

export {getBuilds, getBuild, setBuildScenarios, deleteBuild, deleteBuilds}
export default {getBuilds, getBuild, setBuildScenarios, deleteBuild, deleteBuilds}
