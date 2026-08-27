import assert from 'node:assert/strict'
import EventEmitter from 'node:events'
import test from 'node:test'
import {RTCPeerConnection, useH264} from 'werift'
import AndroidWebRtcTransport, {H264RtpPacketizer} from '../lib/units/device/plugins/screen/webrtc.js'

class FakeCapture extends EventEmitter {
    async start() {
        return {name: 'test-device', width: 1080, height: 2400}
    }

    stop() {}
}

test('packetizes oversized Annex-B NAL units as RFC 6184 FU-A packets', () => {
    const packetizer = new H264RtpPacketizer(102)
    const idr = Buffer.concat([Buffer.from([0, 0, 0, 1, 0x65]), Buffer.alloc(3000, 0xab)])
    const packets = packetizer.packetize(idr, 90000)

    assert.equal(packets.length, 3)
    assert.equal(packets[0].payload[0] & 0x1f, 28)
    assert.equal(packets[0].payload[1] & 0x80, 0x80)
    assert.equal(packets.at(-1).payload[1] & 0x40, 0x40)
    assert.equal(packets.at(-1).header.marker, true)
    assert.deepEqual(
        packets.map(packet => packet.header.sequenceNumber),
        packets.map((_, index) => (packets[0].header.sequenceNumber + index) & 0xffff)
    )
})

test('bootstraps a newly connected peer with codec config and the current GOP', () => {
    const transport = new AndroidWebRtcTransport({
        serial: 'android-test',
        screenWebrtc: true,
        screenWebrtcIceServers: '[]'
    }, {H264Capture: FakeCapture})
    const written = []
    const peer = {
        packetizer: new H264RtpPacketizer(102),
        track: {writeRtp: packet => written.push(packet)},
        bytes: 0,
        packets: 0
    }

    transport.onPacket({config: true, data: Buffer.from([0, 0, 0, 1, 0x67, 1]), pts: 0})
    transport.onPacket({keyframe: true, data: Buffer.from([0, 0, 0, 1, 0x65, 2]), pts: 1000000})
    transport.onPacket({keyframe: false, data: Buffer.from([0, 0, 0, 1, 0x41, 3]), pts: 1033000})
    transport.sendBootstrap(peer)

    assert.deepEqual(written.map(packet => packet.payload[0] & 0x1f), [7, 5, 1])
    assert.deepEqual(written.map(packet => packet.header.timestamp), [90000, 90000, 92970])
    assert.equal(peer.packets, 3)
})

test('rotates the ICE port window between sessions to dodge stale UDP NAT flows', () => {
    const transport = new AndroidWebRtcTransport({
        serial: 'android-test',
        screenWebrtc: true,
        screenWebrtcIceServers: '[]',
        screenWebrtcPortMin: 13000,
        screenWebrtcPortMax: 13100
    }, {H264Capture: FakeCapture})

    const first = transport.allocateIcePortRange()
    const second = transport.allocateIcePortRange()

    assert.notEqual(first[0], second[0])
    for (const [start, end] of [first, second]) {
        assert.ok(start >= 13000 && start < 13100)
        assert.equal(end, 13100)
    }
})

test('keeps the full ICE port range when it is too small to rotate', () => {
    const transport = new AndroidWebRtcTransport({
        serial: 'android-test',
        screenWebrtc: true,
        screenWebrtcIceServers: '[]',
        screenWebrtcPortMin: 15000,
        screenWebrtcPortMax: 15010
    }, {H264Capture: FakeCapture})

    assert.deepEqual(transport.allocateIcePortRange(), [15000, 15010])
    assert.deepEqual(transport.allocateIcePortRange(), [15000, 15010])
})

test('streams codec config and H.264 frames over the authenticated WebSocket', async () => {
    const sent = []
    const ws = {
        readyState: 1,
        bufferedAmount: 0,
        send(value, options, callback) {
            sent.push({value, options})
            callback?.()
        }
    }
    const transport = new AndroidWebRtcTransport({
        serial: 'android-test',
        screenWebrtc: true,
        screenWebrtcIceServers: '[]'
    }, {H264Capture: FakeCapture})

    await transport.handleMessage('client-1', ws, 'h264_on')
    transport.onPacket({config: true, data: Buffer.from([0, 0, 0, 1, 0x67]), pts: 0})
    transport.onPacket({keyframe: true, data: Buffer.from([0, 0, 0, 1, 0x65]), pts: 123456})

    const codec = JSON.parse(sent[0].value)
    assert.deepEqual(codec, {type: 'codec', codec: 'h264', width: 1080, height: 2400})
    assert.equal(sent[1].options.binary, true)
    assert.equal(sent[1].value.readUInt8(0), 1)
    assert.equal(sent[2].value.readUInt8(0), 2)
    assert.equal(sent[2].value.readBigUInt64BE(1), 123456n)
    assert.deepEqual(sent[2].value.subarray(9), Buffer.from([0, 0, 0, 1, 0x65]))

    transport.removeWebSocketClient('client-1')
    assert.ok(transport.capture)
    await transport.close()
})

test('answers an H.264 WebRTC offer over the authenticated screen signaling channel', async () => {
    const sent = []
    const ws = {
        readyState: 1,
        send(value, callback) {
            sent.push(JSON.parse(value))
            callback?.()
        }
    }
    const transport = new AndroidWebRtcTransport({
        serial: 'android-test',
        screenWebrtc: true,
        screenWebrtcIceServers: '[]',
        screenWebrtcPortMin: 15000,
        screenWebrtcPortMax: 15020
    }, {H264Capture: FakeCapture})
    const browser = new RTCPeerConnection({
        codecs: {video: [useH264({payloadType: 102})]},
        icePortRange: [15021, 15040]
    })
    const browserCandidates = []
    browser.onIceCandidate.subscribe(candidate => browserCandidates.push(candidate || null))

    try {
        browser.addTransceiver('video', {direction: 'recvonly'})
        const offer = await browser.createOffer()
        await browser.setLocalDescription(offer)

        await transport.handleMessage('peer-1', ws, JSON.stringify({
            type: 'webrtc_offer',
            sdp: browser.localDescription
        }))
        for (const candidate of browserCandidates) {
            await transport.handleMessage('peer-1', ws, JSON.stringify({type: 'webrtc_ice', candidate}))
        }

        const answer = sent.find(message => message.type === 'webrtc_answer')
        assert.ok(answer)
        assert.equal(answer.sdp.type, 'answer')
        assert.match(answer.sdp.sdp, /H264\/90000/i)
        await browser.setRemoteDescription(answer.sdp)
        for (const message of sent.filter(item => item.type === 'webrtc_ice')) {
            await browser.addIceCandidate(message.candidate)
        }
        assert.equal(transport.peers.size, 1)
    } finally {
        await browser.close()
        await transport.close()
    }
})
