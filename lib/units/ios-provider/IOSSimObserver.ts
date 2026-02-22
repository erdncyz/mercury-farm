import EventEmitter from 'node:events'
import { Simctl } from 'node-simctl'
import { DeviceInfo } from 'node-simctl/build/lib/subcommands/list.js'

interface IOSSimEvents {
    attached: [string]
    detached: [string]
}

export default class IOSSimObserver extends EventEmitter<IOSSimEvents> {
    simctl = new Simctl()

    /** @description list of UDIDs of booted simulators */
    state: Set<string> = new Set()
    listnerInterval: NodeJS.Timeout | undefined

    constructor() {
        super()
    }

    async getBootedSimulators(): Promise<string[]> {
        const devices = await this.simctl.getDevices() as Record<string, DeviceInfo[]>
        if (!devices) {
            return []
        }

        return Object.entries(devices)
            .flatMap(([, sims]) =>
                sims.flatMap(sim => sim.state === 'Booted' ? [sim.udid] : [])
            )
    }

    async processState(sims: string[]): Promise<void> {
        for (const prevSim of Array.from(this.state)) {
            if (!sims.includes(prevSim)) {
                this.state.delete(prevSim)
                this.emit('detached', prevSim)
            }
        }

        for (const sim of sims) {
            if (!this.state.has(sim)) {
                this.state.add(sim)
                this.emit('attached', sim)
            }
        }
    }

    listen = (): void => {
        new Promise(async () => {
            try {
                const sims = await this.getBootedSimulators()
                await this.processState(sims)
            }
            catch {
                // xcrun/Xcode tools not available (e.g. inside Docker)
                // Silently skip simulator detection
            }
            this.listnerInterval = setTimeout(this.listen, 2_000)
        })
    }

    stop(): void {
        clearTimeout(this.listnerInterval)
    }
}

