import assert from 'node:assert/strict'
import test from 'node:test'
import DbClient from '../lib/db/index.js'
import {AUTOMATION_ALIVE_GRACE, isDeviceActiveForBuild} from '../lib/db/models/build/model.js'
import {getBuilds} from '../lib/units/api/controllers/builds.js'

const BUILD_ID = 'build-1'
const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000)

test('device owned by the build is active', () => {
    assert.equal(isDeviceActiveForBuild({owner: {group: BUILD_ID}}, BUILD_ID), true)
    assert.equal(isDeviceActiveForBuild({owner: {group: 'x'}, group: {id: BUILD_ID}}, BUILD_ID), true)
})

test('device still reporting the run stays active even if its DB owner was cleared', () => {
    const device = {owner: null, group: {id: 'root'}, automationAlive: {group: BUILD_ID, at: new Date()}}

    assert.equal(isDeviceActiveForBuild(device, BUILD_ID), true)
    assert.equal(isDeviceActiveForBuild(device, 'other-build'), false)
})

test('device that stopped reporting is no longer active', () => {
    const device = {
        owner: null,
        automationAlive: {group: BUILD_ID, at: new Date(Date.now() - AUTOMATION_ALIVE_GRACE - 1000)}
    }

    assert.equal(isDeviceActiveForBuild(device, BUILD_ID), false)
    assert.equal(isDeviceActiveForBuild(null, BUILD_ID), false)
})

function useFakeDb({builds, devices}) {
    DbClient.connection = {
        collection: (name) => ({
            find: () => ({toArray: async() => (name === 'builds' ? builds : devices)}),
            distinct: async() => [],
            deleteMany: async() => ({deletedCount: 0})
        })
    }
}

async function listBuilds() {
    let body = null
    await getBuilds({user: {privilege: 'admin', email: 'admin@example.com'}, query: {}}, {
        json: (value) => {
            body = value
        },
        status: () => ({json: (value) => {
            body = value
        }})
    })
    return body.builds
}

const runningBuild = () => ({
    id: BUILD_ID,
    name: 'run',
    state: 'running',
    started: minutesAgo(15),
    plannedStop: minutesAgo(5),
    devices: [{serial: 'SERIAL'}]
})

test('Builds keeps a run past its planned stop while its device reports it', async() => {
    useFakeDb({
        builds: [runningBuild()],
        devices: [{serial: 'SERIAL', owner: null, automationAlive: {group: BUILD_ID, at: new Date()}}]
    })

    const [build] = await listBuilds()

    assert.equal(build.state, 'running')
    assert.equal(build.devices[0].active, true)
})

test('Builds finishes an abandoned run at its last sign of life', async() => {
    const lastAlive = minutesAgo(3)
    useFakeDb({
        builds: [runningBuild()],
        devices: [{serial: 'SERIAL', owner: null, automationAlive: {group: BUILD_ID, at: lastAlive}}]
    })

    const [build] = await listBuilds()

    assert.equal(build.state, 'finished')
    assert.equal(new Date(build.finishedAt).getTime(), lastAlive.getTime())
})

test('Builds finishes an unused run at its planned stop', async() => {
    const build = runningBuild()
    useFakeDb({builds: [build], devices: [{serial: 'SERIAL', owner: null}]})

    const [published] = await listBuilds()

    assert.equal(published.state, 'finished')
    assert.equal(new Date(published.finishedAt).getTime(), build.plannedStop.getTime())
})
