import EventEmitter from 'node:events';
import { Simctl } from 'node-simctl';
export default class IOSSimObserver extends EventEmitter {
    simctl = new Simctl();
    /** @description list of UDIDs of booted simulators */
    state = new Set();
    listnerInterval;
    constructor() {
        super();
    }
    async getBootedSimulators() {
        const devices = await this.simctl.getDevices();
        if (!devices) {
            return [];
        }
        return Object.entries(devices)
            .flatMap(([, sims]) => sims.flatMap(sim => sim.state === 'Booted' ? [sim.udid] : []));
    }
    async processState(sims) {
        for (const prevSim of Array.from(this.state)) {
            if (!sims.includes(prevSim)) {
                this.state.delete(prevSim);
                this.emit('detached', prevSim);
            }
        }
        for (const sim of sims) {
            if (!this.state.has(sim)) {
                this.state.add(sim);
                this.emit('attached', sim);
            }
        }
    }
    listen = () => {
        new Promise(async () => {
            try {
                const sims = await this.getBootedSimulators();
                await this.processState(sims);
            }
            catch {
                // xcrun/Xcode tools not available (e.g. inside Docker)
                // Silently skip simulator detection
            }
            this.listnerInterval = setTimeout(this.listen, 2_000);
        });
    };
    stop() {
        clearTimeout(this.listnerInterval);
    }
}
