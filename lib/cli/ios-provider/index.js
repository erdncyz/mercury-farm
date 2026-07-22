import path from 'path'
import fs from 'fs'
import os from 'os'
import provider from '../../units/ios-provider/index.js'
import { fork } from 'child_process'
import _ from 'lodash'

function isProcessRunning(pid) {
    if (!Number.isInteger(pid) || pid <= 0) {
        return false
    }

    try {
        process.kill(pid, 0)
        return true
    } catch (err) {
        return err && err.code === 'EPERM'
    }
}

function acquireProviderLock(providerName) {
    const lockPath = path.join(os.tmpdir(), `mercury-ios-provider-${providerName}.lock`)
    const lockContent = JSON.stringify({
        pid: process.pid,
        provider: providerName,
        createdAt: new Date().toISOString()
    })

    const tryAcquire = () => {
        try {
            const fd = fs.openSync(lockPath, 'wx')
            fs.writeFileSync(fd, lockContent)
            fs.closeSync(fd)
            return
        } catch (err) {
            if (!err || err.code !== 'EEXIST') {
                throw err
            }

            let existingPid = null
            try {
                const raw = fs.readFileSync(lockPath, 'utf8')
                existingPid = JSON.parse(raw).pid
            } catch (readErr) {
                // If lock is corrupted, remove and retry once.
                fs.unlinkSync(lockPath)
                tryAcquire()
                return
            }

            if (isProcessRunning(existingPid)) {
                throw new Error(
                    `ios-provider "${providerName}" is already running with pid ${existingPid}. ` +
                    `Stop existing provider before starting a new one.`
                )
            }

            fs.unlinkSync(lockPath)
            tryAcquire()
        }
    }

    tryAcquire()

    const release = () => {
        try {
            const raw = fs.readFileSync(lockPath, 'utf8')
            const data = JSON.parse(raw)
            if (data.pid === process.pid) {
                fs.unlinkSync(lockPath)
            }
        } catch (err) {
            // Ignore cleanup errors.
        }
    }

    process.once('exit', release)
    process.once('SIGINT', () => {
        release()
        process.exit(130)
    })
    process.once('SIGTERM', () => {
        release()
        process.exit(143)
    })

    return release
}

function validateRange(name, min, max) {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new Error(`${name} range values must be integers. Got min=${min}, max=${max}`)
    }
    if (min >= max) {
        throw new Error(`${name} range is invalid: min (${min}) must be less than max (${max})`)
    }
}
export const command = 'ios-provider [serial..]'
export const describe = 'Start an ios-provider unit.'
export const builder = function (yargs) {
    return yargs
        .strict()
        .env('MERCURY_PROVIDER')
        .option('usbmux-path', {
            describe: 'Path to usbmux sock file. (note: doesnt do anything at the moment)',
            type: 'string',
            default: '/var/run/usbmuxd'
        })
        .option('wda-path', {
            describe: 'Full path for WebDriverAgent repository to build upon',
            type: 'string',
            default: null
        })
        // copied from cli/ios-device.js
        .option('boot-complete-timeout', {
            describe: 'How long to wait for boot to complete during device setup.',
            type: 'number',
            default: 60000
        })
        .option('cleanup', {
            describe: 'Attempt to reset the device between uses by uninstalling' +
                'apps, resetting accounts and clearing caches. Does not do a perfect ' +
                'job currently. Negate with --no-cleanup.',
            type: 'boolean',
            default: true
        })
        .option('port-range-min', {
            describe: 'Min port for forwarding to the ios device',
            type: 'number',
            default: 8100
        })
        .option('port-range-max', {
            describe: 'Max port for forwarding to the ios device',
            type: 'number',
            default: 8200
        })
        .option('screen-ws-range-min', {
            describe: 'Min port for screen websocket.',
            type: 'number',
            default: 18000
        })
        .option('screen-ws-range-max', {
            describe: 'Max port for screen websocket',
            type: 'number',
            default: 18100
        })
        .option('wda-range-min', {
            describe: 'Min wda public port.',
            type: 'number',
            default: 18200
        })
        .option('wda-range-max', {
            describe: 'Max wda public port',
            type: 'number',
            default: 18300
        })
        .option('connect-push', {
            alias: 'p',
            describe: 'Device-side ZeroMQ PULL endpoint to connect to.',
            array: true,
            demand: true
        })
        .option('connect-sub', {
            alias: 's',
            describe: 'Device-side ZeroMQ PUB endpoint to connect to.',
            array: true,
            demand: true
        })
        .option('connect-url-pattern', {
            describe: 'The URL pattern to use for `adb connect`.',
            type: 'string',
            default: '${publicIp}:${publicPort}'
        })
        .option('group-timeout', {
            alias: 't',
            describe: 'Timeout in seconds for automatic release of inactive devices.',
            type: 'number',
            default: 300
        })
        .option('heartbeat-interval', {
            describe: 'Send interval in milliseconds for heartbeat messages.',
            type: 'number',
            default: 10000
        })
        .option('lock-rotation', {
            describe: 'Whether to lock rotation when devices are being used. ' +
                'Otherwise changing device orientation may not always work due to ' +
                'sensitive sensors quickly or immediately reverting it back to the ' +
                'physical orientation.',
            type: 'boolean'
        })
        .option('provider', {
            alias: 'n',
            describe: 'Name of the provider.',
            type: 'string',
            demand: true
        })
        .option('public-ip', {
            describe: 'The IP or hostname to use in URLs.',
            type: 'string',
            demand: true
        })
        .option('screen-jpeg-quality', {
            describe: 'The JPG quality to use for the screen.',
            type: 'number',
            default: process.env.SCREEN_JPEG_QUALITY || 15
        })
        .option('screen-frame-rate', {
            describe: 'Target iOS screen frame rate (frames/s) for websocket streaming.',
            type: 'number',
            default: process.env.SCREEN_FRAME_RATE || 15
        })
        .option('screen-ping-interval', {
            describe: 'The interval at which to send ping messages to keep the ' +
                'screen WebSocket alive.',
            type: 'number',
            default: 30000
        })
        .option('screen-reset', {
            describe: 'Go back to home screen and reset screen rotation ' +
                'when user releases device. Negate with --no-screen-reset.',
            type: 'boolean',
            default: true
        })
        .option('screen-ws-url-pattern', {
            describe: 'The URL pattern to use for the screen WebSocket.',
            type: 'string',
            default: 'ws://${publicIp}:${publicPort}'
        })
        .option('storage-url', {
            alias: 'r',
            describe: 'The URL to the storage unit.',
            type: 'string',
            demand: true
        })
        .option('host', {
            describe: 'Provider hostname.',
            type: 'string',
            demand: true,
            default: '127.0.0.1'
        })
        .option('allow-simulators', {
            describe: 'Allow iOS Simulator devices to be managed by ios-provider.',
            type: 'boolean',
            default: false
        })
        .option('secret', {
            describe: 'The secret to use for auth JSON Web Tokens. Anyone who ' +
                'knows this token can freely enter the system if they want, so keep ' +
                'it safe.',
            type: 'string',
            default: process.env.SECRET || 'kute kittykat',
            demand: true
        })
}

/**
 * test
 * @param {any} argv arguments
 * @returns {Promise<void>} void
 */
export const handler = function (argv) {
    const providerName = argv.name || argv.provider
    const releaseLock = acquireProviderLock(providerName)

    if (Array.isArray(argv.serial)) {
        argv.serial = argv.serial.filter(s => !!s.trim().length)
    }

    const cli = path.resolve(import.meta.dirname, '..')
    validateRange('port-range', argv.portRangeMin, argv.portRangeMax)
    validateRange('wda-range', argv.wdaRangeMin, argv.wdaRangeMax)
    validateRange('screen-ws-range', argv.screenWsRangeMin, argv.screenWsRangeMax)

    const allPorts = _.range(argv.portRangeMin, argv.portRangeMax)
    const [wdaPorts, screenWsPorts] = _.chunk(allPorts, Math.ceil(allPorts.length / 2))
    const connectPorts = _.range(argv.wdaRangeMin, argv.wdaRangeMax)
    const screenListenPorts = _.range(argv.screenWsRangeMin, argv.screenWsRangeMax)

    if (!wdaPorts.length || !screenWsPorts.length) {
        throw new Error(
            `Insufficient iOS worker ports. port-range must provide at least 2 ports, got ${allPorts.length}.`
        )
    }

    if (connectPorts.length < wdaPorts.length) {
        throw new Error(
            `wda-range capacity (${connectPorts.length}) is smaller than iOS worker capacity (${wdaPorts.length}).`
        )
    }

    if (screenListenPorts.length < wdaPorts.length) {
        throw new Error(
            `screen-ws-range capacity (${screenListenPorts.length}) is smaller than iOS worker capacity (${wdaPorts.length}).`
        )
    }
    return provider({
        name: providerName,
        wdaPorts: wdaPorts,
        screenWsPorts: screenWsPorts,
        screenListenPorts: screenListenPorts,
        connectPorts: connectPorts,
        usbmuxPath: argv.usbmuxPath,
        filter: !argv.serial?.length ? null : (serial => argv.serial.includes(serial)),
        screenWsUrlPattern: argv.screenWsUrlPattern,
        allowSimulators: argv.allowSimulators,
        killTimeout: 30000,
        endpoints: {
            push: argv.connectPush.filter(s => !!s.trim().length),
            sub: argv.connectSub.filter(s => !!s.trim().length)
        },
        fork: (serial, opts) => {
            const args = [
                'ios-device',
                '--serial', serial,
                '--host', argv.host,
                '--screen-port', opts.screenListenPort,
                '--mjpeg-port', opts.screenPort,
                '--provider', argv.provider,
                '--public-ip', argv.publicIp,
                '--screen-jpeg-quality', argv.screenJpegQuality,
                '--screen-frame-rate', argv.screenFrameRate,
                '--screen-ping-interval', argv.screenPingInterval,
                '--screen-ws-url-pattern', argv.screenWsUrlPattern,
                '--storage-url', argv.storageUrl,
                '--connect-port', opts.connectPort,
                '--wda-host', '127.0.0.1',
                '--wda-port', opts.wdaPort,
                '--secret', argv.secret
            ]
                .concat(argv.connectSub.reduce(function (all, val) {
                    return all.concat(['--connect-sub', val])
                }, []))
                .concat(argv.connectPush.reduce(function (all, val) {
                    return all.concat(['--connect-push', val])
                }, []))
                .concat(opts.esp32Path ? ['--esp-32-path', opts.esp32Path] : [])
                .concat(argv.wdaPath ? ['--wda-path', argv.wdaPath] : [])
                .concat(opts.isSimulator ? ['--is-simulator'] : [])
            // .concat(argv.lockRotation ? ['--lock-rotation'] : [])
            // .concat(!argv.cleanup ? ['--no-cleanup'] : [])
            // .concat(!argv.screenReset ? ['--no-screen-reset'] : [])
            return fork(cli, args, {
                env: {
                    ...process.env,
                    MONGODB_PORT_27017_TCP: process.env.MONGODB_PORT_27017_TCP || 'mongodb://127.0.0.1:27017'
                }
            })
        }
    }).finally(() => {
        releaseLock()
    })
}
