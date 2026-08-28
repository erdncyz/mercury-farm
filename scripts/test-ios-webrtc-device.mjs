#!/usr/bin/env node

import WebSocket from 'ws'
import {RTCPeerConnection, useH264} from 'werift'
import * as jwtutil from '../lib/util/jwtutil.js'

const screenUrl = process.env.IOS_WEBRTC_TEST_URL || 'ws://127.0.0.1:28500/'
const email = process.env.IOS_WEBRTC_TEST_EMAIL || 'mercury@test.com'
const name = process.env.IOS_WEBRTC_TEST_NAME || 'Mercury'
const secret = process.env.MERCURY_SECRET || 'nosecret'
const timeoutMs = Number(process.env.IOS_WEBRTC_TEST_TIMEOUT_MS || 30000)
const minDurationMs = Number(process.env.IOS_WEBRTC_TEST_MIN_DURATION_MS || 0)
const verbose = process.env.IOS_WEBRTC_TEST_VERBOSE === '1'
const token = jwtutil.encode({payload: {email, name}, secret})
const launchedAt = Date.now()

const ws = new WebSocket(screenUrl, `access_token.${token}`, {
    rejectUnauthorized: false
})
const pc = new RTCPeerConnection({
    codecs: {video: [useH264({payloadType: 102})]},
    icePortRange: [13201, 13300]
})

let answerApplied = false
let startedAt = 0
let authenticatedAt = 0
let firstPacketAt = 0
let packetCount = 0
let byteCount = 0
let sawSps = false
let sawIdr = false
let finished = false
const pendingRemoteCandidates = []

const finish = async(error) => {
    if (finished) {
        return
    }
    finished = true
    clearTimeout(timer)
    try {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({type: 'webrtc_stop'}))
        }
        ws.close()
        await Promise.race([
            pc.close(),
            new Promise(resolve => setTimeout(resolve, 2000))
        ])
    }
    catch {
        // Best-effort cleanup for a diagnostic command.
    }

    if (error) {
        console.error(error.message)
        process.exitCode = 1
        return
    }

    console.log(JSON.stringify({
        success: true,
        transport: 'webrtc',
        codec: 'H264',
        packets: packetCount,
        bytes: byteCount,
        sawSps,
        sawIdr,
        authenticationMs: authenticatedAt ? authenticatedAt - launchedAt : null,
        firstPacketMs: firstPacketAt ? firstPacketAt - launchedAt : null,
        negotiationToFirstPacketMs: firstPacketAt && startedAt ? firstPacketAt - startedAt : null,
        durationMs: Date.now() - startedAt
    }, null, 2))
}

const timer = setTimeout(() => {
    void finish(new Error(`Timed out after ${timeoutMs} ms (packets=${packetCount}, bytes=${byteCount})`))
}, timeoutMs)

pc.onIceCandidate.subscribe(candidate => {
    if (verbose) {
        console.error(`local ICE: ${JSON.stringify(candidate || null)}`)
    }
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({type: 'webrtc_ice', candidate: candidate || null}))
    }
})

pc.connectionStateChange.subscribe(state => {
    if (verbose) {
        console.error(`peer state: ${state}`)
    }
})

pc.onTrack.subscribe(track => {
    track.onReceiveRtp.subscribe(packet => {
        const payload = packet.payload
        if (!payload?.length) {
            return
        }

        packetCount += 1
        firstPacketAt ||= Date.now()
        byteCount += payload.length
        const nalType = payload[0] & 0x1f
        sawSps ||= nalType === 7
        sawIdr ||= nalType === 5 || (nalType === 28 && payload.length > 1 && (payload[1] & 0x1f) === 5)

        if (packetCount >= 12 && byteCount >= 4096 && sawSps && sawIdr &&
            Date.now() - startedAt >= minDurationMs) {
            void finish()
        }
    })
})

ws.on('message', async(data, isBinary) => {
    if (isBinary) {
        return
    }

    const message = JSON.parse(String(data))
    if (verbose && message.type.startsWith('webrtc_')) {
        console.error(`signal: ${message.type} ${JSON.stringify(message.candidate || '')}`)
    }
    if (message.type === 'auth_error' || message.type === 'webrtc_error') {
        await finish(new Error(`${message.type}: ${message.message || 'unknown error'}`))
        return
    }

    if (message.type === 'auth_success') {
        authenticatedAt = Date.now()
        if (!message.webrtc) {
            await finish(new Error('Server authenticated the client but did not advertise WebRTC'))
            return
        }

        ws.send('off')
        pc.addTransceiver('video', {direction: 'recvonly'})
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        startedAt = Date.now()
        ws.send(JSON.stringify({type: 'webrtc_offer', sdp: pc.localDescription}))
        return
    }

    if (message.type === 'webrtc_answer') {
        await pc.setRemoteDescription(message.sdp)
        answerApplied = true
        for (const candidate of pendingRemoteCandidates.splice(0)) {
            await pc.addIceCandidate(candidate)
        }
        return
    }

    if (message.type === 'webrtc_ice') {
        if (answerApplied) {
            await pc.addIceCandidate(message.candidate)
        }
        else {
            pendingRemoteCandidates.push(message.candidate)
        }
    }
})

ws.on('error', error => void finish(error))
