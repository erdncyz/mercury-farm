import Promise from 'bluebird'
import EventEmitter from 'events'
import path from 'path'
import net from 'net'
import {PromiseSocket} from 'promise-socket'
import syrup from '@devicefarmer/stf-syrup'
import logger from '../../../util/logger.js'
import adb from '../support/adb.js'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCRCPY_HEADER_LENGTH = 69
const SCRCPY_CODEC_HEADER_LENGTH = 4
const SCRCPY_SESSION_META_LENGTH = 12
const SCRCPY_FRAME_META_LENGTH = 12
const SCRCPY_H264_CODEC_ID = 0x68323634
const SCRCPY_SESSION_FLAG = 0x80000000
const SCRCPY_CONFIG_FLAG = 1n << 63n
const SCRCPY_KEY_FRAME_FLAG = 1n << 62n
const MAX_VIDEO_PACKET_SIZE = 16 * 1024 * 1024

/**
 * Incrementally parses scrcpy's frame-metadata protocol. TCP chunk boundaries
 * are unrelated to video packet boundaries, so keeping this parser stateful is
 * required for reliable streams on real networks.
 */
export class ScrcpyVideoStreamParser extends EventEmitter {
    constructor({protocol = 'legacy', name = ''} = {}) {
        super()
        this.protocol = protocol
        this.name = name
        this.buffer = Buffer.alloc(0)
        this.info = null
        this.nextPacket = null
        this.codecRead = false
    }

    push(chunk) {
        if (!chunk?.length) {
            return
        }

        this.buffer = this.buffer.length ? Buffer.concat([this.buffer, chunk]) : Buffer.from(chunk)

        if (this.protocol === 'modern' && !this.codecRead) {
            if (this.buffer.length < SCRCPY_CODEC_HEADER_LENGTH) {
                return
            }
            const codecId = this.buffer.readUInt32BE(0)
            if (codecId !== SCRCPY_H264_CODEC_ID) {
                this.emit('error', new Error(`Unexpected scrcpy video codec: 0x${codecId.toString(16)}`))
                this.buffer = Buffer.alloc(0)
                return
            }
            this.buffer = this.buffer.subarray(SCRCPY_CODEC_HEADER_LENGTH)
            this.codecRead = true
        }
        else if (this.protocol !== 'modern' && !this.info && this.buffer.length >= SCRCPY_HEADER_LENGTH) {
            const header = this.buffer.subarray(0, SCRCPY_HEADER_LENGTH)
            this.buffer = this.buffer.subarray(SCRCPY_HEADER_LENGTH)
            this.info = {
                name: header.subarray(1, 65).toString('utf8').replace(/\0+$/, ''),
                width: header.readUInt16BE(65),
                height: header.readUInt16BE(67)
            }
            this.emit('info', this.info)
        }

        while (this.protocol === 'modern' ? this.codecRead : this.info) {
            if (!this.nextPacket) {
                if (this.buffer.length < SCRCPY_FRAME_META_LENGTH) {
                    return
                }

                if (this.protocol === 'modern' && this.isSessionPacket()) {
                    const width = this.buffer.readUInt32BE(4)
                    const height = this.buffer.readUInt32BE(8)
                    this.buffer = this.buffer.subarray(SCRCPY_SESSION_META_LENGTH)
                    this.info = {name: this.name, width, height}
                    this.emit('info', this.info)
                    continue
                }

                if (!this.info) {
                    return
                }

                const ptsAndFlags = this.buffer.readBigUInt64BE(0)
                const size = this.buffer.readUInt32BE(8)
                this.buffer = this.buffer.subarray(SCRCPY_FRAME_META_LENGTH)
                const configFlag = this.protocol === 'modern' ? 1n << 62n : SCRCPY_CONFIG_FLAG
                const keyFrameFlag = this.protocol === 'modern' ? 1n << 61n : SCRCPY_KEY_FRAME_FLAG
                const ptsMask = keyFrameFlag - 1n

                if (size <= 0 || size > MAX_VIDEO_PACKET_SIZE) {
                    const error = new Error(`Invalid scrcpy video packet size: ${size}`)
                    this.emit('error', error)
                    this.buffer = Buffer.alloc(0)
                    return
                }

                this.nextPacket = {
                    size,
                    config: (ptsAndFlags & configFlag) !== 0n,
                    keyframe: (ptsAndFlags & keyFrameFlag) !== 0n,
                    pts: Number(ptsAndFlags & ptsMask)
                }
            }

            if (this.buffer.length < this.nextPacket.size) {
                return
            }

            const packet = this.nextPacket
            const data = Buffer.from(this.buffer.subarray(0, packet.size))
            this.buffer = this.buffer.subarray(packet.size)
            this.nextPacket = null
            this.emit('packet', {...packet, data})
        }
    }

    isSessionPacket() {
        const flags = this.buffer.readUInt32BE(0)
        const width = this.buffer.readUInt32BE(4)
        const height = this.buffer.readUInt32BE(8)
        return (flags === SCRCPY_SESSION_FLAG || flags === SCRCPY_SESSION_FLAG + 1) &&
            width >= 16 && width <= 16384 && height >= 16 && height <= 16384
    }

}

export default syrup.serial()
    .dependency(adb)
    .define(function(options, adb) {
        let log = logger.createLogger('device:resources:scrcpy')
        class Scrcpy extends EventEmitter {
            constructor(config) {
                super()
                this._config = Object.assign({
                    deviceId: options.serial,
                    port: 8099,
                    maxSize: 600,
                    bitrate: 999999999,
                    tunnelForward: true,
                    tunnelDelay: 3000,
                    crop: '9999:9999:0:0',
                    sendFrameMeta: false
                }, config)
                this.adbClient = adb
            }

            /**
         * Will connect to the android device, send & run the server and return deviceName, width and height.
         * After that data will be offered as a 'data' event.
         */
            async start() {
                // Transfer server...
                await this.adbClient.getDevice(options.serial).push(
                    path.join(__dirname, 'scrcpy-server.jar'),
                    '/data/local/tmp/scrcpy-server.jar'
                )
                    .then(transfer => transfer.waitForEnd())
                    .catch(e => {
                        console.log('Impossible to transfer server file:', e)
                        throw e
                    })
                // Run server
                this.output = await this.adbClient.getDevice(options.serial).shell(
                    'CLASSPATH=/data/local/tmp/scrcpy-server.jar app_process / ' +
                    'com.genymobile.scrcpy.Server 4.1 ' +
                    `tunnel_forward=${this._config.tunnelForward} audio=false control=false cleanup=false ` +
                    `raw_stream=true max_size=${this._config.maxSize} video_bit_rate=${this._config.bitrate}`
                )
                    .catch(e => {
                        console.log('Impossible to run server:', e)
                        throw e
                    })
                console.log('Started server')
                await this.adbClient.getDevice(options.serial).forward(`tcp:${this._config.port}`, 'localabstract:scrcpy')
                    .catch(e => {
                        console.log(`Impossible to forward port ${this._config.port}:`, e)
                        throw e
                    })
                console.log('Forwarded port')
                this.socket = new PromiseSocket(new net.Socket())
                // Wait 1 sec to forward to work
                await Promise.delay(this._config.tunnelDelay)
                console.log('Started working, subscribing to data')
                console.log('raw')
                this._startStreamRaw()
                // Connect
                await this.socket.connect(this._config.port, '127.0.0.1')
                    .catch(e => {
                        console.log(`Impossible to connect "127.0.0.1:${this._config.port}":`, e)
                        throw e
                    })
                console.log('Connected')
                return {name: options.serial, width: 0, height: 0}
            }
            stop() {
                if (this.socket) {
                    this.socket.destroy()
                }
                this.output?.destroy()
            }
            _startStreamRaw() {
                // console.log(this.socket.stream.)
                this.socket.stream.on('data', d => {
                    this.emit('rawData', d)
                })
            }
        }

        class H264Capture extends EventEmitter {
            constructor(config = {}) {
                super()
                this._config = Object.assign({
                    maxSize: 1280,
                    bitrate: 1500000,
                    tunnelForward: true,
                    tunnelDelay: 100,
                    crop: '9999:9999:0:0'
                }, config)
                this.adbClient = adb
                this.socket = null
                this.output = null
                this.parser = null
                this.startPromise = null
                this.stopped = true
            }

            start() {
                if (this.startPromise) {
                    return this.startPromise
                }

                this.stopped = false
                this.startPromise = this._start().catch(error => {
                    this.stop()
                    throw error
                })
                return this.startPromise
            }

            async _start() {
                const device = this.adbClient.getDevice(options.serial)
                if (!options.needScrcpy) {
                    await this._killStaleServers(device)
                }
                const transfer = await device.push(
                    path.join(__dirname, 'scrcpy-server.jar'),
                    '/data/local/tmp/scrcpy-server.jar'
                )
                await transfer.waitForEnd()

                if (this.stopped) {
                    throw new Error('scrcpy capture stopped during startup')
                }

                const command = 'CLASSPATH=/data/local/tmp/scrcpy-server.jar app_process / ' +
                    'com.genymobile.scrcpy.Server 4.1 ' +
                    `tunnel_forward=${this._config.tunnelForward} audio=false control=false cleanup=false ` +
                    'send_device_meta=false send_dummy_byte=false send_stream_meta=true send_frame_meta=true ' +
                    `max_size=${this._config.maxSize} video_bit_rate=${this._config.bitrate}`
                this.output = await device.shell(command)
                if (this.stopped) {
                    this.output.destroy()
                    throw new Error('scrcpy capture stopped during startup')
                }
                this.output.on('data', data => {
                    const message = data.toString().trim()
                    if (message) {
                        log.debug('scrcpy server: %s', message)
                    }
                })
                this.output.on('error', error => this.emit('error', error))
                this.output.on('close', () => {
                    if (!this.stopped) {
                        this.emit('error', new Error('scrcpy server exited during video capture'))
                    }
                })

                this.socket = await this._connect(device, 30)
                if (this.stopped) {
                    this.socket.destroy()
                    throw new Error('scrcpy capture stopped during startup')
                }
                this.parser = new ScrcpyVideoStreamParser({protocol: 'modern', name: options.serial})
                this.parser.on('packet', packet => this.emit('packet', packet))
                this.parser.on('error', error => this.emit('error', error))
                const infoPromise = new Promise((resolve, reject) => {
                    const onInfo = info => {
                        cleanup()
                        resolve(info)
                    }
                    const onError = error => {
                        cleanup()
                        reject(error)
                    }
                    const cleanup = () => {
                        this.parser?.removeListener('info', onInfo)
                        this.removeListener('error', onError)
                    }
                    this.parser.on('info', onInfo)
                    this.once('error', onError)
                })
                this.socket.on('data', data => this.parser.push(data))
                this.socket.on('error', error => this.emit('error', error))
                this.socket.on('close', () => {
                    if (!this.stopped) {
                        this.emit('error', new Error('scrcpy video socket closed unexpectedly'))
                    }
                })

                return infoPromise.timeout(5000, 'Timed out waiting for scrcpy video metadata')
            }

            // A previous scrcpy server only exits when a socket write fails, so on a
            // static screen it can outlive its session and keep the abstract socket
            // and/or a hardware encoder instance, breaking the next capture.
            async _killStaleServers(device) {
                try {
                    const output = await device.shell('pkill -f com.genymobile.scrcpy.Server 2>/dev/null || true')
                    await new Promise(resolve => {
                        output.on('end', resolve)
                        output.on('close', resolve)
                        output.on('error', resolve)
                        output.resume()
                    })
                }
                catch (error) {
                    log.debug('Unable to kill stale scrcpy servers: %s', error.message)
                }
            }

            async _connect(device, attempts) {
                let lastError
                for (let attempt = 0; attempt < attempts; attempt += 1) {
                    if (this.stopped) {
                        throw new Error('scrcpy capture stopped during connection')
                    }
                    try {
                        return await device.openLocal('localabstract:scrcpy')
                    }
                    catch (error) {
                        lastError = error
                        await Promise.delay(this._config.tunnelDelay)
                    }
                }
                throw lastError || new Error('Unable to connect to scrcpy video socket')
            }

            stop() {
                this.stopped = true
                this.socket?.destroy()
                this.output?.destroy()
                this.socket = null
                this.output = null
                this.parser = null
                this.startPromise = null
            }
        }
        return {
            Scrcpy,
            H264Capture
        }
    })
