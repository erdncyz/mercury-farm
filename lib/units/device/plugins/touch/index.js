import util from 'util';
import syrup from '@devicefarmer/stf-syrup';
import split from 'split';
import EventEmitter from 'events';
import { Parser, Adb } from '@u4/adbkit';
import logger from '../../../../util/logger.js';
import lifecycle from '../../../../util/lifecycle.js';
import SeqQueue from '../../../../wire/seqqueue.js';
import StateQueue from '../../../../util/statequeue.js';
import RiskyStream from '../../../../util/riskystream.js';
import FailCounter from '../../../../util/failcounter.js';
import adb from '../../support/adb.js';
import router from '../../../base-device/support/router.js';
import minitouch from '../../resources/minitouch.js';
import flags from '../util/flags.js';
import { GestureStartMessage, GestureStopMessage, TouchCommitMessage, TouchDownMessage, TouchMoveMessage, TouchResetMessage, TouchUpMessage } from '../../../../wire/wire.js';
const log = logger.createLogger('device:plugins:touch');
const STATE_STOPPED = 1;
const STATE_STARTING = 2;
const STATE_STARTED = 3;
const STATE_STOPPING = 4;
class TouchConsumer extends EventEmitter {
    actionQueue = [];
    runningState = STATE_STOPPED;
    desiredState;
    output = null;
    socket = null;
    banner = null;
    touchConfig;
    starter = Promise.resolve(true);
    failCounter;
    failed = false;
    readableListener;
    writeQueue = [];
    options;
    adb;
    minitouch;
    recoveryTimeoutID = null;
    ensureStateLock = false;
    splitStream = null;
    constructor(config, options, adb, minitouch) {
        super();
        this.options = options;
        this.adb = adb;
        this.minitouch = minitouch;
        this.desiredState = new StateQueue();
        this.touchConfig = config;
        this.failCounter = new FailCounter(3, 10000);
        this.failCounter.on('exceedLimit', this._failLimitExceeded.bind(this));
        this.readableListener = this._readableListener.bind(this);
    }
    _queueWrite(writer) {
        switch (this.runningState) {
            case STATE_STARTED:
                writer.call(this);
                break;
            default:
                this.writeQueue.push(writer);
                break;
        }
    }
    touchDown(point) {
        this._queueWrite(() => {
            const x = Math.ceil(this.touchConfig.origin.x(point) * this.banner.maxX);
            const y = Math.ceil(this.touchConfig.origin.y(point) * this.banner.maxY);
            const p = Math.ceil((point.pressure || 0.5) * this.banner.maxPressure);
            return this._write(`d ${point.contact} ${x} ${y} ${p}\n`);
        });
    }
    touchMove(point) {
        this._queueWrite(() => {
            const x = Math.ceil(this.touchConfig.origin.x(point) * this.banner.maxX);
            const y = Math.ceil(this.touchConfig.origin.y(point) * this.banner.maxY);
            const p = Math.ceil((point.pressure || 0.5) * this.banner.maxPressure);
            return this._write(`m ${point.contact} ${x} ${y} ${p}\n`);
        });
    }
    touchUp(point) {
        this._queueWrite(() => {
            return this._write(`u ${point.contact}\n`);
        });
    }
    touchCommit() {
        this._queueWrite(() => {
            return this._write('c\n');
        });
    }
    touchReset() {
        this._queueWrite(() => {
            return this._write('r\n');
        });
    }
    tap(point) {
        this.touchDown(point);
        this.touchCommit();
        this.touchUp(point);
        this.touchCommit();
    }
    async startState() {
        if (this.desiredState.next() !== STATE_STARTED) {
            this.ensureStateLock = false;
            setImmediate(() => this._ensureState());
            return;
        }
        this.runningState = STATE_STARTING;
        try {
            const out = await this._startService();
            this.output = new RiskyStream(out)
                .on('unexpectedEnd', this._outputEnded.bind(this));
            this._readOutput(this.output.stream);
            const socket = await this._connectService();
            this.socket = new RiskyStream(socket)
                .on('unexpectedEnd', this._socketEnded.bind(this));
            const banner = await this._readBanner(this.socket.stream);
            this.banner = banner;
            this._readUnexpected(this.socket.stream);
            this._processWriteQueue();
            this.runningState = STATE_STARTED;
            this.emit('start');
        }
        catch (err) {
            try {
                await this._stop();
            }
            finally {
                if (err.name !== 'CancellationError') {
                    this.failCounter.inc();
                }
            }
        }
        finally {
            this.ensureStateLock = false;
            this._ensureState();
        }
    }
    async stopState() {
        if (this.desiredState.next() !== STATE_STOPPED) {
            this.ensureStateLock = false;
            setImmediate(() => this._ensureState());
            return;
        }
        this.runningState = STATE_STOPPING;
        await this._stop()
            .finally(() => {
            this.ensureStateLock = false;
            this._ensureState();
        });
    }
    async _ensureState() {
        if (this.desiredState.empty()) {
            return;
        }
        if (this.failed) {
            log.warn('Will not apply desired state due to too many failures');
            return;
        }
        // Prevent concurrent execution
        if (this.ensureStateLock) {
            return;
        }
        this.ensureStateLock = true;
        try {
            switch (this.runningState) {
                case STATE_STARTING:
                case STATE_STOPPING:
                    // Just wait.
                    break;
                case STATE_STOPPED:
                    await this.startState();
                    break;
                case STATE_STARTED:
                    await this.stopState();
                    break;
            }
        }
        catch (err) {
            this.ensureStateLock = false;
            throw err;
        }
    }
    start() {
        this.desiredState.push(STATE_STARTED);
        this._ensureState();
    }
    stop() {
        this.desiredState.push(STATE_STOPPED);
        this._ensureState();
    }
    async restart() {
        switch (this.runningState) {
            case STATE_STARTED:
            case STATE_STARTING:
                await this._stop();
                this.desiredState.push(STATE_STOPPED);
                this.desiredState.push(STATE_STARTED);
                this._ensureState();
                break;
        }
    }
    _configChanged() {
        this.restart();
    }
    _socketEnded() {
        this.failCounter.inc();
        this.restart();
    }
    _outputEnded() {
        this.failCounter.inc();
        this.restart();
    }
    _failLimitExceeded(limit, time) {
        this._stop();
        this.failed = true;
        log.warn(`Touch consumer failed more than ${limit} times in ${time}ms, will attempt recovery in 30s`);
        this.recoveryTimeoutID = setTimeout(() => {
            this.recoveryTimeoutID = null;
            log.info('Attempting touch consumer recovery after cooldown');
            this.failed = false;
            this.failCounter = new FailCounter(3, 10000);
            this.failCounter.on('exceedLimit', this._failLimitExceeded.bind(this));
            this.start();
        }, 30000);
    }
    async _startService() {
        return await this.minitouch.run();
    }
    _readOutput(out) {
        // Clean up previous split stream if exists
        if (this.splitStream) {
            this.splitStream.removeAllListeners('data');
            this.splitStream.destroy();
        }
        this.splitStream = out.pipe(split()).on('data', (line) => {
            const trimmed = line.toString().trim();
            if (trimmed === '') {
                return;
            }
            if (line.includes('ERROR')) {
                log.fatal('minitouch error: "%s"', line);
                return lifecycle.fatal();
            }
            log.info('minitouch says: "%s"', line);
        });
    }
    async _connectService() {
        const tryConnect = async (times, delay) => {
            try {
                const out = await this.adb.getDevice(this.options.serial).openLocal('localabstract:minitouch');
                return out;
            }
            catch (err) {
                if (err.message?.includes('closed') && times > 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return tryConnect(times - 1, delay * 2);
                }
                throw err;
            }
        };
        log.info('Connecting to minitouch service');
        // SH-03G can be very slow to start sometimes. Make sure we try long
        // enough.
        return tryConnect(7, 100);
    }
    async _stop() {
        try {
            await this._disconnectService(this.socket);
            await Promise.race([
                this._stopService(this.output),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
            ]);
            this.runningState = STATE_STOPPED;
            this.emit('stop');
        }
        catch (err) {
            // In practice we _should_ never get here due to _stopService()
            // being quite aggressive. But if we do, well... assume it
            // stopped anyway for now.
            this.runningState = STATE_STOPPED;
            log.warn('Unexpected error during minitouch stop: %s', err?.message);
            this.emit('stop');
        }
        finally {
            // Clean up split stream
            if (this.splitStream) {
                this.splitStream.removeAllListeners('data');
                this.splitStream.destroy();
                this.splitStream = null;
            }
            this.output = null;
            this.socket = null;
            this.banner = null;
        }
    }
    async _disconnectService(socket) {
        log.info('Disconnecting from minitouch service');
        if (!socket || socket.ended) {
            return true;
        }
        socket.stream.removeListener('readable', this.readableListener);
        return new Promise((resolve) => {
            const endListener = () => {
                socket.removeListener('end', endListener);
                resolve(true);
            };
            socket.on('end', endListener);
            socket.stream.resume();
            socket.end();
            // Add timeout
            setTimeout(() => {
                socket.removeListener('end', endListener);
                resolve(true);
            }, 2000);
        });
    }
    async _stopService(output) {
        log.info('Stopping minitouch service');
        if (!output || output.ended) {
            return true;
        }
        const pid = this.banner ? this.banner.pid : -1;
        const kill = async (signal) => {
            if (pid <= 0) {
                throw new Error('Minitouch service pid is unknown');
            }
            const signum = {
                SIGTERM: -15,
                SIGKILL: -9
            }[signal];
            log.info('Sending %s to minitouch', signal);
            await Promise.race([
                Promise.all([
                    output.waitForEnd(),
                    this.adb.getDevice(this.options.serial).shell(['kill', signum.toString(), pid.toString()])
                        .then(Adb.util.readAll)
                ]),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
            ]);
            return true;
        };
        const kindKill = () => kill('SIGTERM');
        const forceKill = () => kill('SIGKILL');
        const forceEnd = () => {
            log.info('Ending minitouch I/O as a last resort');
            output.end();
            return true;
        };
        try {
            return await kindKill();
        }
        catch (err) {
            if (err.message === 'Timeout') {
                try {
                    return await forceKill();
                }
                catch {
                    return forceEnd();
                }
            }
            return forceEnd();
        }
    }
    async _readBanner(socket) {
        log.info('Reading minitouch banner');
        const parser = new Parser(socket);
        const banner = {
            pid: -1,
            version: 0,
            maxContacts: 0,
            maxX: 0,
            maxY: 0,
            maxPressure: 0
        };
        const readVersion = async () => {
            const chunk = await parser.readLine();
            const args = chunk.toString().split(/ /g);
            switch (args[0]) {
                case 'v':
                    banner.version = Number(args[1]);
                    break;
                default:
                    throw new Error(util.format('Unexpected output "%s", expecting version line', chunk));
            }
        };
        const readLimits = async () => {
            const chunk = await parser.readLine();
            const args = chunk.toString().split(/ /g);
            switch (args[0]) {
                case '^':
                    banner.maxContacts = Number(args[1]);
                    banner.maxX = Number(args[2]);
                    banner.maxY = Number(args[3]);
                    banner.maxPressure = Number(args[4]);
                    break;
                default:
                    throw new Error(util.format('Unknown output "%s", expecting limits line', chunk));
            }
        };
        const readPid = async () => {
            const chunk = await parser.readLine();
            const args = chunk.toString().split(/ /g);
            switch (args[0]) {
                case '$':
                    banner.pid = Number(args[1]);
                    break;
                default:
                    throw new Error(util.format('Unexpected output "%s", expecting pid line', chunk));
            }
        };
        await readVersion();
        await readLimits();
        await readPid();
        return banner;
    }
    _readUnexpected(socket) {
        socket.on('readable', this.readableListener);
        // We may already have data pending.
        this.readableListener();
    }
    _readableListener() {
        let chunk;
        while ((chunk = this.socket?.stream.read())) {
            log.warn('Unexpected output from minitouch socket: %s', chunk);
        }
    }
    _processWriteQueue() {
        while (this.writeQueue.length > 0) {
            const writer = this.writeQueue.shift();
            writer?.call(this);
        }
    }
    _write(chunk) {
        if (!this.socket?.stream) {
            return;
        }
        // Handle backpressure
        const canWrite = this.socket.stream.write(chunk);
        if (!canWrite) {
            log.warn('Socket buffer is full, experiencing backpressure');
        }
    }
    destroy() {
        // Clean up recovery timeout
        if (this.recoveryTimeoutID) {
            clearTimeout(this.recoveryTimeoutID);
            this.recoveryTimeoutID = null;
        }
        // Clean up all resources
        if (this.splitStream) {
            this.splitStream.removeAllListeners('data');
            this.splitStream.destroy();
            this.splitStream = null;
        }
        if (this.socket) {
            this.socket.stream.removeListener('readable', this.readableListener);
            this.socket.removeAllListeners();
        }
        if (this.output) {
            this.output.removeAllListeners();
        }
        this.failCounter.removeAllListeners();
        this.removeAllListeners();
        this.writeQueue = [];
    }
}
export default syrup.serial()
    .dependency(adb)
    .dependency(router)
    .dependency(minitouch)
    .dependency(flags)
    .define(async (options, adb, router, minitouch, flags) => {
    const startConsumer = async () => {
        const origin = flags.get('forceTouchOrigin', 'top left');
        log.info('Touch origin is %s', origin);
        const touchOrigins = {
            'top left': {
                x: (point) => point.x,
                y: (point) => point.y
            },
            // So far the only device we've seen exhibiting this behavior
            // is Yoga Tablet 8.
            'bottom left': {
                x: (point) => 1 - point.y,
                y: (point) => point.x
            }
        };
        const touchConsumer = new TouchConsumer({
            // Usually the touch origin is the same as the display's origin,
            // but sometimes it might not be.
            origin: touchOrigins[origin]
        }, options, adb, minitouch);
        // Use Promise.race with once() for cleaner event handling
        touchConsumer.start();
        return Promise.race([
            new Promise((resolve) => {
                touchConsumer.once('start', () => resolve(touchConsumer));
            }),
            new Promise((_, reject) => {
                touchConsumer.once('error', reject);
            }),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Minitouch initial start timed out')), 60000);
            })
        ]);
    };
    const touchConsumer = await startConsumer();
    const queue = new SeqQueue(100, 4);
    touchConsumer.on('error', (err) => {
        log.fatal('Touch consumer had an error %s: %s', err?.message, err?.stack);
        lifecycle.fatal();
    });
    router
        .on(GestureStartMessage, (channel, message) => {
        queue.start(message.seq);
    })
        .on(GestureStopMessage, (channel, message) => {
        queue.push(message.seq, () => {
            queue.stop();
        });
    })
        .on(TouchDownMessage, (channel, message) => {
        queue.push(message.seq, () => {
            touchConsumer.touchDown(message);
        });
    })
        .on(TouchMoveMessage, (channel, message) => {
        queue.push(message.seq, () => {
            touchConsumer.touchMove(message);
        });
    })
        .on(TouchUpMessage, (channel, message) => {
        queue.push(message.seq, () => {
            touchConsumer.touchUp(message);
        });
    })
        .on(TouchCommitMessage, (channel, message) => {
        queue.push(message.seq, () => {
            touchConsumer.touchCommit();
        });
    })
        .on(TouchResetMessage, (channel, message) => {
        queue.push(message.seq, () => {
            touchConsumer.touchReset();
        });
    });
    return touchConsumer;
});
