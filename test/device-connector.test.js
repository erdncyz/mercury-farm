import assert from 'node:assert/strict'
import {EventEmitter} from 'node:events'
import test from 'node:test'
import {setImmediate} from 'node:timers/promises'
import connectorModule, {DEVICE_TYPE} from '../lib/units/base-device/support/connector.js'
import useDevice, {UseDeviceError} from '../lib/units/api/helpers/useDevice.js'
import {WireRouter} from '../lib/wire/router.js'
import wireutil from '../lib/wire/util.js'
import {Any} from '../lib/wire/google/protobuf/any.js'
import {ConnectStartedMessage, Envelope, GroupMessage, JoinGroupMessage, TransactionDoneMessage, UngroupMessage} from '../lib/wire/wire.js'

const SERIAL = 'TEST_IOS_DEVICE'
const URL = 'device.example.invalid:8100'

async function createConnector(start = async() => URL) {
    const sent = []
    const connector = await connectorModule.invoke({}, new WireRouter(), {
        send: (packet) => sent.push(packet)
    })
    connector.init({
        serial: SERIAL,
        deviceType: DEVICE_TYPE.IOS,
        handlers: {start, stop: async() => {}}
    })
    return {connector, sent}
}

function assertStartReply(sent, channel) {
    const messages = sent
        .filter(([target]) => target === channel)
        .map(([, data]) => {
            const {message} = Envelope.fromBinary(data)
            assert.ok(message)
            return message
        })
    assert.deepEqual(messages.map(message => message.typeUrl), [
        Any.typeNameToUrl(TransactionDoneMessage.typeName),
        Any.typeNameToUrl(ConnectStartedMessage.typeName)
    ])
    const reply = Any.unpack(messages[0], TransactionDoneMessage)
    assert.equal(reply.success, true)
    assert.equal(reply.data, URL)
    const started = Any.unpack(messages[1], ConnectStartedMessage)
    assert.equal(started.serial, SERIAL)
    assert.equal(started.url, URL)
}

test('fresh and reused starts acknowledge each request without restarting the endpoint', async() => {
    let starts = 0
    const {connector, sent} = await createConnector(async() => {
        starts += 1
        return URL
    })

    assert.equal(await connector.start('txn_first'), URL)
    assertStartReply(sent, 'txn_first')
    assert.equal(await connector.start('txn_reuse'), URL)
    assertStartReply(sent, 'txn_reuse')
    assert.equal(starts, 1)
})

test('concurrent start requests each receive their own connection-started acknowledgement', async() => {
    const {promise, resolve} = Promise.withResolvers()
    let starts = 0
    const {connector, sent} = await createConnector(async() => {
        starts += 1
        await promise
        return URL
    })

    const first = connector.start('txn_first')
    const second = connector.start('txn_second')
    resolve()

    assert.deepEqual(await Promise.all([first, second]), [URL, URL])
    assertStartReply(sent, 'txn_first')
    assertStartReply(sent, 'txn_second')
    assert.equal(starts, 1)
})

test('retrieving an existing forward URL remains a transaction-only response', async() => {
    const {connector, sent} = await createConnector()
    await connector.start('txn_start')
    await connector.getUrl('txn_url')

    const replies = sent.filter(([channel]) => channel === 'txn_url')
    assert.equal(replies.length, 1)
    const {message} = Envelope.fromBinary(replies[0][1])
    assert.ok(message)
    assert.equal(message.typeUrl, Any.typeNameToUrl(TransactionDoneMessage.typeName))
    assert.equal(Any.unpack(message, TransactionDoneMessage).data, URL)
})

async function createDeviceRequest({respondToConnect = true} = {}) {
    const deviceChannel = 'test_device_channel'
    const user = {email: 'test@example.invalid', name: 'Test', group: 'test_group', adbKeys: []}
    const channelRouter = new EventEmitter()
    const deviceRouter = new WireRouter()
    const subscriptions = new Set()
    const push = {
        send([channel, data]) {
            if (channel !== deviceChannel) {
                channelRouter.emit(channel, channel, data)
                return
            }
            const {message, channel: responseChannel} = Envelope.fromBinary(data)
            assert.ok(message)
            if (message.typeUrl === Any.typeNameToUrl(UngroupMessage.typeName)) {
                channelRouter.emit(responseChannel, responseChannel, wireutil.reply(SERIAL).okay())
            }
            else if (message.typeUrl === Any.typeNameToUrl(GroupMessage.typeName)) {
                const group = Any.unpack(message, GroupMessage)
                channelRouter.emit(wireutil.global, wireutil.global, wireutil.pack(JoinGroupMessage, {
                    serial: SERIAL,
                    owner: group.owner,
                    usage: group.usage,
                    timeout: group.timeout
                }))
                channelRouter.emit(responseChannel, responseChannel, wireutil.reply(SERIAL).okay())
            }
            else if (respondToConnect) {
                deviceRouter.handler()(channel, data)
            }
        }
    }
    const connector = await connectorModule.invoke({}, deviceRouter, push)
    connector.init({
        serial: SERIAL,
        deviceType: DEVICE_TYPE.IOS,
        handlers: {start: async() => URL, stop: async() => {}}
    })
    return {
        connector,
        subscriptions,
        params: {
            user,
            device: {
                serial: SERIAL,
                present: true,
                ready: true,
                owner: null,
                channel: deviceChannel,
                group: {id: user.group, lifeTime: {stop: new Date(Date.now() + 600_000)}}
            },
            channelRouter,
            push,
            sub: {
                subscribe: (channel) => subscriptions.add(channel),
                unsubscribe: (channel) => subscriptions.delete(channel)
            },
            usage: 'automation',
            groupId: user.group
        }
    }
}

test('useDevice reacquires a free device whose previous connector is still open', async(t) => {
    t.mock.timers.enable({apis: ['setTimeout']})
    const {connector, subscriptions, params} = await createDeviceRequest()

    assert.equal(await useDevice(params), URL)
    assert.equal(connector.started, true)
    assert.equal(params.device.owner, null)

    const reacquired = useDevice(params)
    const acknowledgement = assert.doesNotReject(reacquired)
    await setImmediate()
    t.mock.timers.tick(20_000)
    await acknowledgement

    assert.equal(await reacquired, URL)
    assert.equal(subscriptions.size, 0)
    assert.equal(params.channelRouter.eventNames().length, 0)
})

test('useDevice still fails after 20 seconds when no connection confirmation arrives', async(t) => {
    t.mock.timers.enable({apis: ['setTimeout']})
    const {subscriptions, params} = await createDeviceRequest({respondToConnect: false})
    let settled = false
    const failure = assert.rejects(useDevice(params), error => {
        settled = true
        return error === UseDeviceError.FAILED_CONNECT
    })
    await setImmediate()

    t.mock.timers.tick(19_999)
    await setImmediate()
    assert.equal(settled, false)
    t.mock.timers.tick(1)
    await failure

    assert.equal(subscriptions.size, 0)
    assert.equal(params.channelRouter.eventNames().length, 0)
})
