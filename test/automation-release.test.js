import assert from 'node:assert/strict'
import {EventEmitter} from 'node:events'
import test from 'node:test'
import {setImmediate} from 'node:timers/promises'
import dbapi from '../lib/db/api.js'
import BuildModel from '../lib/db/models/build/index.js'
import {freeDevices} from '../lib/units/api/controllers/autotests.js'
import {Any} from '../lib/wire/google/protobuf/any.js'
import wireutil from '../lib/wire/util.js'
import {ConnectStopMessage, Envelope, UngroupMessage} from '../lib/wire/wire.js'

const GROUP = 'run-group'
const SERIAL = 'TEST_IOS_DEVICE'
const EMAIL = 'tester@example.invalid'

function setup(t, {device = {}, group = {}, result = 'failed'} = {}) {
    const record = {
        serial: SERIAL,
        channel: 'device_channel',
        present: true,
        usage: 'automation',
        owner: {email: EMAIL, group: GROUP},
        group: {id: GROUP},
        platform: 'iOS',
        ...device
    }
    const reservation = {
        id: GROUP, devices: [SERIAL], owner: {email: EMAIL},
        privilege: 'user', class: 'once', ...group
    }
    const events = []
    const pending = []
    const subscriptions = new Set()
    const channelRouter = new EventEmitter()
    t.mock.method(dbapi, 'getUserGroup', async() => reservation)
    t.mock.method(dbapi, 'loadDeviceBySerial', async() => record)
    t.mock.method(dbapi, 'loadDevicesBySerials', async() => [record])
    const deletion = t.mock.method(dbapi, 'deleteUserGroup', async(id) => {
        events.push('delete')
        return id
    })
    const update = t.mock.method(BuildModel, 'updateBuild', async(id, patch) => {
        events.push('finish')
        return {id, ...patch}
    })
    const response = {
        statusCode: null,
        body: null,
        headersSent: false,
        setHeader() {},
        status(code) {
            this.statusCode = code
            return this
        },
        json(body) {
            this.body = body
            this.headersSent = true
            events.push('respond')
            return this
        }
    }
    const request = {
        query: {group: GROUP, result},
        user: {email: EMAIL, privilege: 'user'},
        options: {
            timeout: 1000,
            channelRouter,
            sub: {
                subscribe: (channel) => subscriptions.add(channel),
                unsubscribe: (channel) => subscriptions.delete(channel)
            },
            push: {
                send([target, data]) {
                    assert.equal(target, record.channel)
                    const envelope = Envelope.fromBinary(data)
                    const message = envelope.message
                    const type = message.typeUrl
                    events.push(type === Any.typeNameToUrl(ConnectStopMessage.typeName) ? 'disconnect' : 'ungroup')
                    if (type === Any.typeNameToUrl(UngroupMessage.typeName)) {
                        const ungroup = Any.unpack(message, UngroupMessage)
                        assert.equal(ungroup.requirements[0].value, SERIAL)
                    }
                    pending.push(envelope.channel)
                }
            }
        }
    }
    function reply(success = true) {
        const channel = pending.shift()
        assert.ok(channel)
        channelRouter.emit(channel, channel, success ?
            wireutil.reply(SERIAL).okay() : wireutil.reply(SERIAL).fail('cleanup failed'))
    }
    return {request, response, events, reply, deletion, update, subscriptions, channelRouter}
}

test('release waits for disconnect and ungroup before deleting, finishing and responding', async(t) => {
    const state = setup(t)
    const release = freeDevices(state.request, state.response)
    await setImmediate()
    assert.deepEqual(state.events, ['disconnect'])
    assert.equal(state.response.statusCode, null)
    state.reply()
    await setImmediate()
    assert.deepEqual(state.events, ['disconnect', 'ungroup'])
    assert.equal(state.deletion.mock.callCount(), 0)
    state.reply()
    await release

    assert.deepEqual(state.events, ['disconnect', 'ungroup', 'delete', 'finish', 'respond'])
    assert.equal(state.response.statusCode, 200)
    assert.equal(state.response.body.success, true)
    const [id, patch] = state.update.mock.calls[0].arguments
    assert.equal(id, GROUP)
    assert.equal(patch.state, 'finished')
    assert.equal(patch.testResult, 'failed')
    assert.equal(patch.devices[0].ios, true)
    assert.equal(state.subscriptions.size, 0)
    assert.equal(state.channelRouter.eventNames().length, 0)
})

for (const failedStep of ['disconnect', 'ungroup', 'timeout']) {
    test(`a ${failedStep} failure keeps the reservation and build open for retry`, async(t) => {
        const state = setup(t)
        if (failedStep === 'timeout') {
            state.request.options.timeout = 25
        }
        const release = freeDevices(state.request, state.response)
        await setImmediate()
        if (failedStep === 'ungroup') {
            state.reply()
            await setImmediate()
        }
        if (failedStep !== 'timeout') {
            state.reply(false)
        }
        await release
        assert.equal(state.response.statusCode, 500)
        assert.equal(state.response.body.success, false)
        assert.equal(state.deletion.mock.callCount(), 0)
        assert.equal(state.update.mock.callCount(), 0)
        assert.equal(state.subscriptions.size, 0)
        assert.equal(state.channelRouter.eventNames().length, 0)
    })
}

for (const device of [
    {owner: {email: EMAIL, group: 'new-run'}},
    {owner: null, usage: null, group: {id: 'root'}}
]) {
    test('release leaves another run or an already released device alone', async(t) => {
        const state = setup(t, {device})
        await freeDevices(state.request, state.response)
        assert.deepEqual(state.events, ['delete', 'finish', 'respond'])
        assert.equal(state.response.statusCode, 200)
    })
}

test('automation heartbeat permits cleanup after the DB owner was cleared', async(t) => {
    const state = setup(t, {
        device: {owner: null, group: {id: 'root'}, automationAlive: {group: GROUP}}
    })
    const release = freeDevices(state.request, state.response)
    await setImmediate()
    state.reply()
    await setImmediate()
    state.reply()
    await release
    assert.equal(state.response.statusCode, 200)
    assert.deepEqual(state.events.slice(0, 2), ['disconnect', 'ungroup'])
})

test('unavailable active devices cannot produce a successful release', async(t) => {
    const state = setup(t, {device: {present: false}})
    await freeDevices(state.request, state.response)
    assert.equal(state.response.statusCode, 500)
    assert.equal(state.deletion.mock.callCount(), 0)
    assert.equal(state.update.mock.callCount(), 0)
})

test('a forbidden release neither cleans up devices nor finalizes the build', async(t) => {
    const state = setup(t, {group: {owner: {email: 'someone-else@example.invalid'}}})
    await freeDevices(state.request, state.response)
    assert.equal(state.response.statusCode, 403)
    assert.equal(state.deletion.mock.callCount(), 0)
    assert.equal(state.update.mock.callCount(), 0)
    assert.deepEqual(state.events, ['respond'])
})

test('a missing reservation does not finalize a build or touch devices', async(t) => {
    const state = setup(t)
    t.mock.method(dbapi, 'getUserGroup', async() => null)
    await freeDevices(state.request, state.response)
    assert.equal(state.response.statusCode, 404)
    assert.equal(state.deletion.mock.callCount(), 0)
    assert.equal(state.update.mock.callCount(), 0)
})

test('cleanup can be retried after a failed ungroup', async(t) => {
    const state = setup(t)
    let release = freeDevices(state.request, state.response)
    await setImmediate()
    state.reply()
    await setImmediate()
    state.reply(false)
    await release
    assert.equal(state.deletion.mock.callCount(), 0)

    state.response.headersSent = false
    state.response.statusCode = null
    release = freeDevices(state.request, state.response)
    await setImmediate()
    state.reply()
    await setImmediate()
    state.reply()
    await release
    assert.equal(state.response.statusCode, 200)
    assert.equal(state.deletion.mock.callCount(), 1)
    assert.equal(state.update.mock.callCount(), 1)
})
