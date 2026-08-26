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
