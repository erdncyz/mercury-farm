import { printf } from 'fast-printf';
import { EventEmitter } from 'events';
import chalk from 'chalk';
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 1] = "DEBUG";
    LogLevel[LogLevel["VERBOSE"] = 2] = "VERBOSE";
    LogLevel[LogLevel["INFO"] = 3] = "INFO";
    LogLevel[LogLevel["IMPORTANT"] = 4] = "IMPORTANT";
    LogLevel[LogLevel["WARNING"] = 5] = "WARNING";
    LogLevel[LogLevel["ERROR"] = 6] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 7] = "FATAL";
})(LogLevel || (LogLevel = {}));
const innerLogger = new EventEmitter();
export class Log extends EventEmitter {
    tag;
    localIdentifier = null;
    // Track stdout backpressure state
    static stdoutBlocked = false;
    static pendingWrites = [];
    static drainListenerAttached = false;
    static unitColors = {
        websocket: [chalk.gray, chalk.bgBlack],
        'groups-engine': [chalk.gray, chalk.bgBlack],
        poorxy: [chalk.gray, chalk.bgBlack],
        api: [chalk.green, chalk.bgGreen],
        triproxy: [chalk.magenta, chalk.bgMagenta],
        processor: [chalk.red, chalk.bgRed],
        provider: [chalk.blue, chalk.bgBlue],
        device: [chalk.cyan, chalk.bgCyan],
    };
    static names = {
        [LogLevel.DEBUG]: 'DBG',
        [LogLevel.VERBOSE]: 'VRB',
        [LogLevel.INFO]: 'INF',
        [LogLevel.IMPORTANT]: 'IMP',
        [LogLevel.WARNING]: 'WRN',
        [LogLevel.ERROR]: 'ERR',
        [LogLevel.FATAL]: 'FTL',
    };
    static styles = {
        [LogLevel.DEBUG]: 'grey',
        [LogLevel.VERBOSE]: 'cyan',
        [LogLevel.INFO]: 'green',
        [LogLevel.IMPORTANT]: 'magenta',
        [LogLevel.WARNING]: 'yellow',
        [LogLevel.ERROR]: 'red',
        [LogLevel.FATAL]: 'red',
    };
    constructor(tag) {
        super();
        this.tag = tag;
    }
    setLocalIdentifier(identifier) {
        this.localIdentifier = identifier;
    }
    debug(...args) {
        this._write(this._entry(LogLevel.DEBUG, args));
    }
    verbose(...args) {
        this._write(this._entry(LogLevel.VERBOSE, args));
    }
    info(...args) {
        this._write(this._entry(LogLevel.INFO, args));
    }
    important(...args) {
        this._write(this._entry(LogLevel.IMPORTANT, args));
    }
    warn(...args) {
        this._write(this._entry(LogLevel.WARNING, args));
    }
    error(...args) {
        this._write(this._entry(LogLevel.ERROR, args));
    }
    fatal(...args) {
        this._write(this._entry(LogLevel.FATAL, args));
    }
    _entry(priority, args) {
        return {
            unit: globalLogger.unit,
            timestamp: new Date(),
            priority,
            tag: this.tag,
            pid: process.pid,
            identifier: this.localIdentifier || '*',
            args
        };
    }
    _format(entry) {
        const args = entry.args;
        entry.message = printf(...args);
        const [fg, bg] = Log.unitColors[entry.unit] ?? [chalk.yellow, chalk.bgYellow];
        return (`${chalk.grey(entry.timestamp.toJSON())} ${fg(bg(entry.unit))} ${this._name(entry.priority)}/${chalk.bold(entry.tag)} ${entry.pid} [${entry.identifier}] ${entry.message}\n`);
    }
    _name(priority) {
        const name = Log.names[priority];
        const color = Log.styles[priority];
        return chalk[color](name);
    }
    _write(entry) {
        if (!entry.args[0]) {
            return;
        }
        const output = this._format(entry);
        // Emit events immediately
        this.emit('entry', entry);
        innerLogger.emit('entry', entry);
        // Handle stdout backpressure
        if (Log.stdoutBlocked) {
            // If stdout is blocked, queue the output
            Log.pendingWrites.push(output);
            return;
        }
        // Try to write directly to stdout
        const success = process.stdout.write(output);
        if (!success) {
            // stdout buffer is full, set up drain listener if not already done
            Log.stdoutBlocked = true;
            Log.setupDrainListener();
        }
    }
    static setupDrainListener() {
        if (Log.drainListenerAttached) {
            return;
        }
        Log.drainListenerAttached = true;
        process.stdout.once('drain', () => {
            Log.drainListenerAttached = false;
            Log.stdoutBlocked = false;
            // Flush any pending writes
            while (Log.pendingWrites.length > 0) {
                const output = Log.pendingWrites.shift();
                const success = process.stdout.write(output);
                if (!success) {
                    // stdout is blocked again
                    Log.stdoutBlocked = true;
                    Log.setupDrainListener();
                    break;
                }
            }
        });
    }
}
export const createLogger = (tag) => {
    return new Log(tag);
};
class Logger {
    Level = LogLevel;
    unit = 'unknown';
    globalIdentifier = '*';
    createLogger = createLogger;
    setGlobalIdentifier(identifier) {
        this.globalIdentifier = identifier;
        return this;
    }
    on = innerLogger.on.bind(innerLogger);
}
const globalLogger = new Logger();
const consoleLogger = createLogger('console');
console.log = consoleLogger.info.bind(consoleLogger);
console.error = consoleLogger.error.bind(consoleLogger);
export default globalLogger;
