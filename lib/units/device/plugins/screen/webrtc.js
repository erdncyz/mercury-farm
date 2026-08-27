import {MediaStream, MediaStreamTrack, RTCPeerConnection, RtpHeader, RtpPacket, useH264} from 'werift'
import logger from '../../../../util/logger.js'

const MAX_SDP_LENGTH = 256 * 1024
const MAX_RTP_PAYLOAD_SIZE = 1200
const MAX_CACHED_GOP_SIZE = 8 * 1024 * 1024
const ICE_PORT_ROTATION_STEP = 16
const CAPTURE_IDLE_TIMEOUT_MS = 3000

export function splitAnnexB(data) {
    const starts = []
    for (let index = 0; index + 3 < data.length;) {
        if (data[index] === 0 && data[index + 1] === 0 && data[index + 2] === 1) {
            starts.push({offset: index, length: 3})
            index += 3
        }
        else if (data[index] === 0 && data[index + 1] === 0 &&
            data[index + 2] === 0 && data[index + 3] === 1) {
            starts.push({offset: index, length: 4})
            index += 4
        }
        else {
            index += 1
        }
    }
    if (!starts.length) {
        return data.length ? [data] : []
    }
    return starts.map((start, index) => {
        const from = start.offset + start.length
        let to = starts[index + 1]?.offset ?? data.length
        while (to > from && data[to - 1] === 0) {
            to -= 1
        }
        return data.subarray(from, to)
    }).filter(nal => nal.length > 0)
}

export class H264RtpPacketizer {
    constructor(payloadType = 102) {
        this.payloadType = payloadType
        this.sequenceNumber = Math.floor(Math.random() * 0x10000)
        this.ssrc = Math.floor(Math.random() * 0x100000000) >>> 0
    }

    packetize(data, timestamp) {
        const nalUnits = splitAnnexB(data)
        const packets = []
        nalUnits.forEach((nal, nalIndex) => {
            const lastNal = nalIndex === nalUnits.length - 1
            if (nal.length <= MAX_RTP_PAYLOAD_SIZE) {
                packets.push(this.makePacket(nal, timestamp, lastNal))
                return
            }

            const nalHeader = nal[0]
            const fuIndicator = (nalHeader & 0xe0) | 28
            const nalType = nalHeader & 0x1f
            const fragmentSize = MAX_RTP_PAYLOAD_SIZE - 2
            const payload = nal.subarray(1)
            for (let offset = 0; offset < payload.length; offset += fragmentSize) {
                const end = Math.min(payload.length, offset + fragmentSize)
                const fuHeader = (offset === 0 ? 0x80 : 0) |
                    (end === payload.length ? 0x40 : 0) | nalType
                packets.push(this.makePacket(
                    Buffer.concat([Buffer.from([fuIndicator, fuHeader]), payload.subarray(offset, end)]),
                    timestamp,
                    lastNal && end === payload.length
                ))
            }
        })
        return packets
    }

    makePacket(payload, timestamp, marker) {
        const packet = new RtpPacket(new RtpHeader({
            payloadType: this.payloadType,
            sequenceNumber: this.sequenceNumber,
            timestamp,
            ssrc: this.ssrc,
            marker
        }), payload)
        this.sequenceNumber = (this.sequenceNumber + 1) & 0xffff
        return packet
    }
}

function parseIceServers(value) {
    if (!value) {
        return []
    }
    try {
        const servers = typeof value === 'string' ? JSON.parse(value) : value
        if (!Array.isArray(servers) || servers.some(server =>
            !server || (typeof server.urls !== 'string' && !Array.isArray(server.urls)))) {
            throw new Error('expected an array of RTCIceServer objects')
        }
        return servers
    }
    catch (error) {
        throw new Error(`Invalid SCREEN_WEBRTC_ICE_SERVERS: ${error.message}`)
    }
}

function toRtpTimestamp(pts) {
    const microseconds = Number.isFinite(pts) && pts > 0 ? pts : Date.now() * 1000
    return Math.floor(microseconds * 90 / 1000) >>> 0
}

export default class AndroidWebRtcTransport {
    constructor(options, scrcpy, transportOptions = {}) {
        this.options = options
        this.scrcpy = scrcpy
        this.platform = transportOptions.platform || 'Android'
        this.streamIdPrefix = transportOptions.streamIdPrefix || this.platform.toLowerCase()
        this.captureOptions = transportOptions.captureOptions || {}
        this.log = logger.createLogger(`${this.streamIdPrefix}-device:plugins:screen:webrtc`)
        this.peers = new Map()
        this.webSocketClients = new Map()
        this.pendingIceCandidates = new Map()
        this.capture = null
        this.captureStart = null
        this.captureStopTimer = null
        this.lastConfig = null
        this.gopPackets = []
        this.gopBytes = 0
        this.info = null
        this.stopping = false
        this.portRotation = Math.floor(Math.random() * 64)
        this.iceServers = this.enabled ? parseIceServers(this.options.screenWebrtcIceServers) : []
    }

    // Docker/NAT UDP proxies (notably Docker Desktop on macOS) keep stale flow
    // entries for a UDP port that was just closed and rebound, silently
    // dropping the browser's STUN checks on the next session. Rotating the
    // start of the ICE port window makes consecutive sessions bind ports that
    // were not recently released, so negotiation does not hit a dead flow.
    allocateIcePortRange() {
        const min = Number(this.options.screenWebrtcPortMin) || 13000
        const max = Number(this.options.screenWebrtcPortMax) || 13100
        const windows = Math.max(1, Math.floor((max - min + 1) / ICE_PORT_ROTATION_STEP))
        const start = min + (this.portRotation % windows) * ICE_PORT_ROTATION_STEP
        this.portRotation += 1
        return [start, max]
    }

    get enabled() {
        return Boolean(this.options.screenWebrtc)
    }

    get clientConfig() {
        return {
            iceServers: this.iceServers,
            timeoutMs: Number(this.options.screenWebrtcTimeout) || 8000
        }
    }

    async handleMessage(id, ws, message) {
        if (this.enabled && message === 'h264_on') {
            await this.addWebSocketClient(id, ws)
            return true
        }
        if (this.enabled && message === 'h264_off') {
            this.removeWebSocketClient(id)
            return true
        }
        if (!this.enabled || typeof message !== 'string' || message[0] !== '{') {
            return false
        }

        let signal
        try {
            signal = JSON.parse(message)
        }
        catch {
            return false
        }

        if (signal.type === 'webrtc_offer') {
            await this.createPeer(id, ws, signal)
            return true
        }
        if (signal.type === 'webrtc_ice') {
            const peer = this.peers.get(id)
            if (peer) {
                const candidate = signal.candidate || null
                if (!peer.remoteDescriptionSet) {
                    if (peer.pendingIceCandidates.length < 64) {
                        peer.pendingIceCandidates.push(candidate)
                    }
                }
                else {
                    await this.addIceCandidate(peer, candidate)
                }
            }
            else {
                const candidates = this.pendingIceCandidates.get(id) || []
                if (candidates.length < 64) {
                    candidates.push(signal.candidate || null)
                    this.pendingIceCandidates.set(id, candidates)
                }
            }
            return true
        }
        if (signal.type === 'webrtc_stop') {
            this.pendingIceCandidates.delete(id)
            await this.removePeer(id)
            return true
        }
        return false
    }

    async addWebSocketClient(id, ws) {
        this.cancelScheduledCaptureStop()
        this.webSocketClients.set(id, ws)
        const info = await this.ensureCapture()
        if (this.webSocketClients.get(id) !== ws) {
            return
        }
        this.sendJson(ws, {type: 'codec', codec: 'h264', width: info.width, height: info.height})
        if (this.lastConfig) {
            this.sendWebSocketPacket(ws, this.lastConfig)
        }
        for (const packet of this.gopPackets) {
            this.sendWebSocketPacket(ws, packet)
        }
    }

    removeWebSocketClient(id) {
        this.webSocketClients.delete(id)
        if (this.peers.size === 0 && this.webSocketClients.size === 0) {
            this.scheduleCaptureStop()
        }
    }

    cancelScheduledCaptureStop() {
        if (this.captureStopTimer) {
            clearTimeout(this.captureStopTimer)
            this.captureStopTimer = null
        }
    }

    scheduleCaptureStop() {
        this.cancelScheduledCaptureStop()
        this.captureStopTimer = setTimeout(() => {
            this.captureStopTimer = null
            if (this.peers.size === 0 && this.webSocketClients.size === 0) {
                this.stopCapture()
            }
        }, CAPTURE_IDLE_TIMEOUT_MS)
        this.captureStopTimer.unref?.()
    }

    pauseCapture() {
        this.capture?.pause?.()
    }

    resumeCapture() {
        this.capture?.resume?.()
    }

    async createPeer(id, ws, signal) {
        if (!signal.sdp || signal.sdp.type !== 'offer' ||
            typeof signal.sdp.sdp !== 'string' || signal.sdp.sdp.length > MAX_SDP_LENGTH) {
            throw new Error('Invalid WebRTC offer')
        }

        await this.removePeer(id)
        this.cancelScheduledCaptureStop()

        let additionalHostAddresses = []
        if (this.options.screenWebrtcPublicIp) {
            try {
                // Ensure we only pass valid IP addresses to werift, as browsers reject hostnames in ICE candidates.
                const {promises: dns} = await import('dns')
                const hosts = this.options.screenWebrtcPublicIp.split(',').map(h => h.trim()).filter(Boolean)
                for (const host of hosts) {
                    const {address} = await dns.lookup(host, {family: 4})
                    additionalHostAddresses.push(address)
                }
            }
            catch (error) {
                this.log.warn('Could not resolve screenWebrtcPublicIp "%s": %s', this.options.screenWebrtcPublicIp, error.message)
            }
        }

        const codec = useH264({payloadType: 102})
        const pc = new RTCPeerConnection({
            codecs: {video: [codec]},
            iceServers: this.iceServers,
            icePortRange: this.allocateIcePortRange(),
            ...(additionalHostAddresses.length > 0 ?
                {iceAdditionalHostAddresses: additionalHostAddresses} :
                {})
        })
        const track = new MediaStreamTrack({kind: 'video', codec})
        const mediaStream = new MediaStream({id: `${this.streamIdPrefix}-${this.options.serial}`})
        mediaStream.addTrack(track)
        pc.addTrack(track, mediaStream)

        const peer = {
            pc,
            track,
            packetizer: new H264RtpPacketizer(codec.payloadType),
            ws,
            remoteDescriptionSet: false,
            pendingIceCandidates: [],
            connected: false,
            disconnectTimer: null,
            bytes: 0,
            packets: 0,
            startedAt: Date.now()
        }
        this.peers.set(id, peer)
        this.ensureCapture().catch(error => this.onCaptureError(error))

        pc.onIceCandidate.subscribe(candidate => {
            this.sendJson(ws, {
                type: 'webrtc_ice',
                candidate: candidate || null
            })
        })
        pc.connectionStateChange.subscribe(state => {
            if (state === 'connected') {
                peer.connected = true
                if (peer.disconnectTimer) {
                    clearTimeout(peer.disconnectTimer)
                    peer.disconnectTimer = null
                }
                this.sendBootstrap(peer)
            }
            if ((state === 'disconnected' || state === 'failed') && !peer.disconnectTimer) {
                peer.connected = false
                peer.disconnectTimer = setTimeout(() => {
                    this.removePeer(id).catch(error => this.log.warn('Failed to remove peer: %s', error.message))
                }, 5000)
            }
            if (state === 'closed') {
                this.removePeer(id).catch(error => this.log.warn('Failed to remove peer: %s', error.message))
            }
        })

        try {
            await pc.setRemoteDescription(signal.sdp)
            peer.remoteDescriptionSet = true
            const pendingCandidates = [
                ...(this.pendingIceCandidates.get(id) || []),
                ...peer.pendingIceCandidates
            ]
            this.pendingIceCandidates.delete(id)
            peer.pendingIceCandidates = []
            for (const candidate of pendingCandidates) {
                await this.addIceCandidate(peer, candidate)
            }
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            this.sendJson(ws, {type: 'webrtc_answer', sdp: pc.localDescription?.toJSON?.() || answer})
        }
        catch (error) {
            await this.removePeer(id)
            throw error
        }
    }

    async addIceCandidate(peer, candidate) {
        if (candidate?.candidate?.includes('.local ')) {
            this.log.debug('Ignoring browser mDNS ICE candidate for %s', this.options.serial)
            return
        }
        try {
            await peer.pc.addIceCandidate(candidate)
        }
        catch (error) {
            this.log.warn('Unable to add browser ICE candidate for %s: %s', this.options.serial, error.message)
        }
    }

    async ensureCapture() {
        if (this.captureStart) {
            return this.captureStart
        }

        this.stopping = false
        this.capture = new this.scrcpy.H264Capture({
            maxSize: Number(this.options.screenWebrtcMaxSize) || 1280,
            bitrate: Number(this.options.screenWebrtcBitrate) || 1500000,
            ...this.captureOptions
        })
        this.capture.on('packet', packet => this.onPacket(packet))
        this.capture.on('error', error => this.onCaptureError(error))
        this.capture.on?.('warning', error => {
            this.log.warn('%s H.264 capture warning for %s: %s', this.platform, this.options.serial, error.message)
        })
        this.captureStart = this.capture.start().then(info => {
            this.info = info
            this.log.info('%s H.264 capture started for %s at %dx%d',
                this.platform, this.options.serial, info.width, info.height)
            return info
        })
        return this.captureStart
    }

    onPacket(packet) {
        if (packet.config) {
            this.lastConfig = packet
            for (const ws of this.webSocketClients.values()) {
                this.sendWebSocketPacket(ws, packet)
            }
            return
        }
        if (packet.keyframe) {
            this.gopPackets = [packet]
            this.gopBytes = packet.data.length
        }
        else if (this.gopPackets.length) {
            this.gopPackets.push(packet)
            this.gopBytes += packet.data.length
            if (this.gopBytes > MAX_CACHED_GOP_SIZE) {
                // A partial GOP cannot initialize a decoder correctly. Wait
                // for the encoder's next IDR instead of caching invalid state.
                this.gopPackets = []
                this.gopBytes = 0
            }
        }
        for (const peer of this.peers.values()) {
            if (peer.connected) {
                this.sendPacket(peer, packet)
            }
        }
        for (const ws of this.webSocketClients.values()) {
            this.sendWebSocketPacket(ws, packet)
        }
    }

    sendWebSocketPacket(ws, packet) {
        if (ws.readyState !== 1 || ws.bufferedAmount > MAX_CACHED_GOP_SIZE) {
            return
        }
        const header = Buffer.allocUnsafe(9)
        header.writeUInt8((packet.config ? 1 : 0) | (packet.keyframe ? 2 : 0), 0)
        header.writeBigUInt64BE(BigInt(Math.max(0, Math.floor(packet.pts || 0))), 1)
        ws.send(Buffer.concat([header, packet.data]), {binary: true}, () => {})
    }

    sendBootstrap(peer) {
        for (const packet of this.gopPackets) {
            this.sendPacket(peer, packet)
        }
    }

    sendPacket(peer, packet) {
        try {
            const data = packet.keyframe && this.lastConfig ?
                Buffer.concat([this.lastConfig.data, packet.data]) :
                packet.data
            const timestamp = toRtpTimestamp(packet.pts)
            const rtpPackets = peer.packetizer.packetize(data, timestamp)
            for (const rtp of rtpPackets) {
                peer.track.writeRtp(rtp)
                peer.bytes += rtp.payload.length
                peer.packets += 1
            }
        }
        catch (error) {
            this.log.warn('Unable to packetize H.264 frame for %s: %s', this.options.serial, error.message)
        }
    }

    onCaptureError(error) {
        if (this.stopping) {
            return
        }
        this.log.error('%s H.264 capture failed for %s: %s', this.platform, this.options.serial, error.message)
        for (const peer of this.peers.values()) {
            this.sendJson(peer.ws, {type: 'webrtc_error', message: 'H.264 capture failed'})
        }
        this.close().catch(closeError => this.log.warn('Failed to close WebRTC transport: %s', closeError.message))
    }

    sendJson(ws, value) {
        if (ws.readyState === 1) {
            ws.send(JSON.stringify(value), () => {})
        }
    }

    async removePeer(id) {
        const peer = this.peers.get(id)
        if (!peer) {
            return
        }
        this.peers.delete(id)
        if (peer.disconnectTimer) {
            clearTimeout(peer.disconnectTimer)
        }
        peer.track.stop()
        await peer.pc.close().catch(() => {})
        const duration = Math.max(1, (Date.now() - peer.startedAt) / 1000)
        this.log.info(
            'WebRTC peer closed for %s: %d RTP packets, %d bytes, %d kbps average',
            this.options.serial,
            peer.packets,
            peer.bytes,
            Math.round(peer.bytes * 8 / duration / 1000)
        )
        if (this.peers.size === 0 && this.webSocketClients.size === 0) {
            this.scheduleCaptureStop()
        }
    }

    stopCapture() {
        this.cancelScheduledCaptureStop()
        this.stopping = true
        this.capture?.stop()
        this.capture = null
        this.captureStart = null
        this.lastConfig = null
        this.gopPackets = []
        this.gopBytes = 0
        this.info = null
    }

    async close() {
        const ids = [...this.peers.keys()]
        await Promise.all(ids.map(id => this.removePeer(id)))
        this.webSocketClients.clear()
        this.stopCapture()
    }
}
