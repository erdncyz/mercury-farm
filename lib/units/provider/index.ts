import logger from '../../util/logger.js'
import wireutil from '../../wire/util.js'
import {WireRouter} from '../../wire/router.js'
import lifecycle from '../../util/lifecycle.js'
import srv from '../../util/srv.js'
import * as zmqutil from '../../util/zmqutil.js'
import {ChildProcess} from 'node:child_process'
import ADBObserver, {ADBDevice} from './ADBObserver.js'
import {
    DeviceRegisteredMessage,
    DeviceAbsentMessage,
    DeviceIntroductionMessage,
    ProviderMessage,
    DeviceStatusMessage
} from '../../wire/wire.js'
import {ProcessManager, ResourcePool} from '../../util/ProcessManager.js'

// Device-specific context for process management
interface DeviceContext {
    device: ADBDevice
    resolveRegister?: () => void
    register: Promise<void>
}

type DeviceHandler = (device: ADBDevice, oldType?: ADBDevice['type']) => any | Promise<any>

export interface Options {
    name: string
    adbHost: string
    adbPort: number
    ports: number[]
    allowRemote: boolean
    killTimeout: number
    deviceType: string
    endpoints: {
        push: string[]
        sub: string[]
    }
    filter: (serial: string) => boolean
    fork: (serial: string, ports: number[]) => ChildProcess
}

export default async (options: Options): Promise<void> => {
    const log = logger.createLogger('provider')

    // Startup timeout for device process
    const STARTUP_TIMEOUT_MS = 10 * 60 * 1000
    const BASE_DELAY = 10_000
    const RESOURCE_ALLOCATION_COUNT = 2

    // Check whether the ipv4 address contains a port indication
    if (options.adbHost.includes(':')) {
        log.error('Please specify adbHost without port')
        lifecycle.fatal()
    }

    const solo = wireutil.makePrivateChannel()

    // To make sure that we always bind the same type of service to the same
    // port, we must ensure that we allocate ports in fixed groups.
    options.ports = options.ports.slice(0, options.ports.length - options.ports.length % RESOURCE_ALLOCATION_COUNT)

    // Output
    const push = zmqutil.socket('push')
    try {
        await Promise.all(options.endpoints.push.map(async(endpoint) => {
            const records = await srv.resolve(endpoint)
            return srv.attempt(records, (record) => {
                log.info('Sending output to "%s"', record.url)
                push.connect(record.url)
            })
        }))
    }
    catch (err) {
        log.fatal('Unable to connect to push endpoint: %s', err)
        lifecycle.fatal()
    }

    // Input
    const sub = zmqutil.socket('sub')
    try {
        await Promise.all(options.endpoints.sub.map(async(endpoint) => {
            const records = await srv.resolve(endpoint)
            return srv.attempt(records, (record) => {
                log.info('Receiving input to "%s"', record.url)
                sub.connect(record.url)
            })
        }))

        log.info('Subscribing to permanent channel "%s"', solo)
        sub.subscribe(solo)
    }
    catch (err) {
        log.fatal('Unable to connect to sub endpoint: %s', err)
        lifecycle.fatal()
    }

    // Resource pool for port allocation
    const portPool = new ResourcePool<number>(options.ports)

    const processManager = new ProcessManager<DeviceContext, number>({
        spawn: (id, context, resources) => {
            log.info('Spawning device process "%s" with ports [%s]', id, resources.join(', '))
            return options.fork(id, resources)
        },
        onReady: (id) => {
            log.info('Device process "%s" is ready', id)
        },
        onError: (id, context, error) => {
            log.error('Device process "%s" error: %s', id, error.message)
        },
        onCleanup: (id, context) => {
            // Resolve register if pending
            context.resolveRegister?.()

            // Tell others the device is gone
            push.send([
                wireutil.global,
                wireutil.pack(DeviceAbsentMessage, { serial: id })
            ])
        }
    }, {
        killTimeout: options.killTimeout,
        healthCheckConfig: {
            startupTimeoutMs: STARTUP_TIMEOUT_MS
        },
        resourcePool: portPool
    })

    // Handle device registration messages
    sub.on('message', new WireRouter()
        .on(DeviceRegisteredMessage, (channel, message: {serial: string}) => {
            const process = processManager.get(message.serial)
            process?.context?.resolveRegister?.()
        })
        .handler()
    )

    let statsTimer: NodeJS.Timeout
    const stats = (twice = true) => {
        const processStats = processManager.getStats()

        log.info(`Providing ${processStats.running.length} of ${processStats.total} device(s); starting: [${
            processStats.starting.join(', ')
        }], waiting: [${
            processStats.waiting.join(', ')
        }]`)
        log.info(`Providing all ${processStats.total} of ${tracker.count} device(s)`)

        if (twice) {
            clearTimeout(statsTimer)
            statsTimer = setTimeout(stats, BASE_DELAY, false)
        }
    }

    // Helper for ignoring unwanted devices
    const filterDevice = (listener: DeviceHandler) => (
        (device: ADBDevice, oldType?: ADBDevice['type']) => {
            if (device.serial === '????????????' || !device.serial?.trim()) {
                log.warn('ADB lists a weird device: "%s"', device.serial)
                return false
            }
            if (!options.allowRemote && device.serial.includes(':')) {
                log.info('Filtered out remote device "%s", use --allow-remote to override', device.serial)
                return false
            }
            if (options.filter && !options.filter(device.serial)) {
                log.info('Filtered out device "%s"', device.serial)
                return false
            }
            return listener(device, oldType)
        }
    )

    const removeDevice = async(device: ADBDevice) => {
        try {
            log.info('Removing device %s', device.serial)
            await processManager.remove(device.serial)
        }
        catch (err) {
            log.error('Error removing device process "%s": %s', device.serial, err)
        }
    }

    // Tell others we found a device
    const register = (device: ADBDevice) => new Promise<void>(
        async(resolve, reject) => {
            push.send([
                wireutil.global,
                wireutil.pack(DeviceIntroductionMessage, {
                    serial: device.serial,
                    status: wireutil.toDeviceStatus(device.type) || 1,
                    provider: ProviderMessage.create({
                        channel: solo,
                        name: options.name
                    }),
                    deviceType: options.deviceType
                })
            ])

            log.info('Registering device "%s"', device.serial)

            process.nextTick(() => { // after creating process context
                const managedProcess = processManager.get(device.serial)
                if (!managedProcess) return

                const timeout = setTimeout(() => reject('Register timeout'), BASE_DELAY)
                managedProcess.context.resolveRegister = () => {
                    clearTimeout(timeout)
                    delete managedProcess?.context?.resolveRegister
                    resolve()
                }
            })
        }
    )

    const startDeviceWork = async(device: ADBDevice, restart = false, reregister = false) => {
        if (!processManager.has(device.serial)) return stats(false)

        const managedProcess = processManager.get(device.serial)
        if (!managedProcess) return

        if (restart || reregister) {
            log.warn('Trying to %s device again, delay 10 sec [%s]', restart ? 'start' : 'register', device.serial)
            await new Promise(r => setTimeout(r, BASE_DELAY))
        }

        log.info('Starting work for device "%s"', device.serial)

        if (reregister) {
            managedProcess.context.register = register(device)
        }

        if (!restart) {
            try {
                // Wait for registration
                await managedProcess.context.register
                log.info('Device "%s" registered successfully', device.serial)
            }
            catch (err: any) {
                log.error('Device "%s" registration failed: %s', device.serial, err?.message || err)
                return startDeviceWork(device, false, true)
            }
        }

        // Start the process (this will spawn and wait for ready)
        const started = await processManager.start(device.serial)

        if (!started) {
            log.error('Failed to start device process [%s]', device.serial)
            return startDeviceWork(device, true, false)
        }

        stats()

        // Tell others the device state changed
        push.send([
            wireutil.global,
            wireutil.pack(DeviceStatusMessage, {
                serial: device.serial,
                status: wireutil.toDeviceStatus(device.type)
            })
        ])
    }

    // Track and manage devices
    const tracker = new ADBObserver({
        intervalMs: 3000,
        port: options.adbPort,
        host: options.adbHost
    })

    // TODO: add ADBObserver.enableHealthCheck(serial) to check only filtered devices
    tracker.on('healthcheck', async(stats) => {
        log.info('Healthcheck [OK: %s, BAD: %s]', stats.ok, stats.bad)

        // Check for stuck workers
        const stuckProcesses = processManager.checkHealth()

        // Stop and restart stuck workers
        for (const serial of stuckProcesses) {
            log.error('Restarting stuck worker "%s"', serial)

            try {
                const device = tracker.getDevice(serial)
                if (device) {
                    await removeDevice(device)
                }
            }
            catch (err) {
                log.error('Error restarting stuck worker "%s": %s', serial, err)
            }
        }
    })

    log.info('Tracking devices')

    tracker.on('connect', filterDevice(async(device) => {
        if (processManager.has(device.serial)) {
            log.warn('Device has been connected twice. Skip.')
            return
        }

        log.info('Connected device "%s" [%s]', device.serial, device.type)

        // Create device context with registration promise
        const deviceContext: DeviceContext = {
            device,
            register: register(device) // Register device immediately, before 'running' state
        }

        // Create managed process
        const created = await processManager.create(device.serial, deviceContext, {
            initialState: 'waiting',
            resourceCount: RESOURCE_ALLOCATION_COUNT // Allocate 2 ports per device
        })

        if (!created) {
            log.error('Failed to create process for device "%s"', device.serial)
            return
        }

        stats()

        if (device.type === 'device') {
            startDeviceWork(device)
            return
        }

        // TODO: add options.unavailableTimeToReconnect (default: 30sec)
        // Try to reconnect device if it is not available for more than 30 seconds
        if (device.serial.includes(':')) {
            const timer = setTimeout(serial => {
                const device = tracker.getDevice(serial)
                if (device && !['device', 'emulator'].includes(device?.type)) {
                    device.reconnect()
                }
            }, 30_000, device.serial)

            processManager.setTimer(device.serial, timer)
        }
    }))

    tracker.on('update', filterDevice(async(device, oldType) => {
        log.info('Device "%s" is now "%s" (was "%s")', device.serial, device.type, oldType)

        if (!['device', 'emulator'].includes(device.type)) {
            // Device went offline - stop worker but keep it in waiting state
            log.info('Device "%s" went offline [%s]', device.serial, device.type)

            const managedProcess = processManager.get(device.serial)
            if (managedProcess && managedProcess.state !== 'waiting') {
                try {
                    await processManager.stop(device.serial)
                }
                catch (err) {
                    log.error('Error stopping device worker "%s": %s', device.serial, err)
                }

                // Set back to waiting state (keep process and ports allocated)
                processManager.setState(device.serial, 'waiting')
            }
            return
        }

        const managedProcess = processManager.get(device.serial)
        if (device.type === 'device' && managedProcess?.state !== 'running') {
            // Immediately cancel device unreachable timeout
            processManager.clearTimer(device.serial)

            startDeviceWork(device)
        }
    }))

    tracker.on('stuck', async(device, health) => {
        log.warn(
            'Device %s is stuck [attempts: %s, first_healthcheck: %s, last_healthcheck: %s]',
            device.serial,
            new Date(health.firstFailureTime).toISOString(),
            new Date(health.lastAttemptTime).toISOString()
        )

        if (!processManager.has(device.serial)) {
            log.warn('Device is stuck, but process is not running')
            return
        }

        removeDevice(device)
    })

    tracker.on('disconnect', filterDevice(async(device) => {
        log.info('Device is disconnected "%s" [%s]', device.serial, device.type)

        if (!processManager.has(device.serial)) {
            log.warn(
                'Device is disconnected, but process is not running %s',
                device.isStuck ? '[Device got stuck earlier]' : ''
            )
            return
        }

        if (!device.isStuck) {
            removeDevice(device)
        }
    }))

    tracker.on('error', err => {
        log.error('ADBObserver error: %s', err?.message)
    })

    tracker.start()

    lifecycle.observe(() => {
        // Clear timers
        clearTimeout(statsTimer)

        stats(false)
        tracker.destroy()

        ;[push, sub].forEach((sock) =>
            sock.close()
        )

        // Clean up all processes
        return processManager.cleanup()
    })
}
