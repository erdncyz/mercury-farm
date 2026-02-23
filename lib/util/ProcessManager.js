import logger from './logger.js';
import * as procutil from './procutil.js';
/**
 * Resource pool for managing reusable resources (e.g., ports)
 */
export class ResourcePool {
    available;
    constructor(resources) {
        this.available = [...resources];
    }
    // Allocate resources from the pool
    allocate(count) {
        if (this.available.length < count) {
            return null;
        }
        return this.available.splice(0, count);
    }
    // Return resources back to the pool
    release(resources) {
        this.available.push(...resources);
    }
    // Get the number of available resources
    get availableCount() {
        return this.available.length;
    }
}
/**
 * Generic process manager that handles process lifecycle, state management, and resource allocation
 */
export class ProcessManager {
    log = logger.createLogger('process-manager');
    processes = new Map();
    callbacks;
    killTimeout;
    healthCheckConfig;
    resourcePool;
    constructor(callbacks, options) {
        this.callbacks = callbacks;
        this.killTimeout = options.killTimeout;
        this.healthCheckConfig = options.healthCheckConfig;
        this.resourcePool = options.resourcePool;
    }
    // Create a new managed process
    async create(id, context, options = {}) {
        if (this.processes.has(id)) {
            this.log.warn('Process "%s" already exists', id);
            return false;
        }
        // Allocate resources if pool is available
        let resources = [];
        if (this.resourcePool && options.resourceCount) {
            const allocated = this.resourcePool.allocate(options.resourceCount);
            if (!allocated) {
                // TODO: emit resource allocation error event
                this.log.error(`Failed to allocate ${options.resourceCount} resources for process "${id}"`);
                return false;
            }
            resources = allocated;
        }
        const process = {
            id,
            state: options.initialState || 'waiting',
            startTime: Date.now(),
            context,
            resources
        };
        this.processes.set(id, process);
        this.log.info('Created process "%s" with state "%s"', id, process.state);
        return true;
    }
    // Start a process (spawn child process)
    async start(id, force = false) {
        const process = this.processes.get(id);
        if (!process) {
            this.log.error('Process "%s" not found', id);
            return false;
        }
        if (!force && process.state === 'running') {
            this.log.warn('Process "%s" is already running', id);
            return true;
        }
        if (process.timer) {
            clearTimeout(process.timer);
            process.timer = undefined;
        }
        process.expectedStop = false;
        this.log.info('Starting process "%s"', id);
        process.state = 'starting';
        process.startTime = Date.now();
        return new Promise(async (resolve) => {
            let childProcess = null;
            let isResolved = false;
            const resolveOnce = (value) => {
                if (!isResolved) {
                    isResolved = true;
                    resolve(value);
                }
            };
            const cleanup = () => {
                if (childProcess) {
                    childProcess.removeAllListeners('exit');
                    childProcess.removeAllListeners('error');
                    childProcess.removeAllListeners('message');
                }
            };
            const handleError = async (err) => {
                this.log.error('Process "%s" error: %s', id, err.message);
                cleanup();
                if (this.callbacks.onError) {
                    await this.callbacks.onError(id, process.context, err);
                }
                // Check if process still exists (might have been removed)
                if (!this.processes.has(id)) {
                    resolveOnce(false);
                    return;
                }
                // Handle exit errors with restart logic
                if (err instanceof procutil.ExitError) {
                    this.log.error('Process "%s" died with code %s', id, err.code);
                    this.log.info('Restarting process "%s" in 2 seconds', id);
                    await new Promise(r => setTimeout(r, 2000));
                    if (!this.processes.has(id)) {
                        this.log.info('Restart of process "%s" cancelled (process removed)', id);
                        resolveOnce(false);
                        return;
                    }
                    // Restart the process
                    this.start(id, true).then(resolveOnce);
                    return;
                }
                resolveOnce(false);
            };
            const handleReady = async () => {
                const currentProcess = this.processes.get(id);
                if (!currentProcess) {
                    resolveOnce(false);
                    return;
                }
                if (currentProcess.timer) {
                    clearTimeout(currentProcess.timer);
                    currentProcess.timer = undefined;
                }
                currentProcess.state = 'running';
                currentProcess.expectedStop = false;
                this.log.info('Process "%s" is now running', id);
                if (this.callbacks.onReady) {
                    await this.callbacks.onReady(id, currentProcess.context);
                }
                resolveOnce(true);
            };
            try {
                // Spawn the child process
                childProcess = await this.callbacks.spawn(id, process.context, [...process.resources]);
                this.log.info('Spawned process "%s"', id);
                // Set up event listeners
                childProcess.on('exit', (code, signal) => {
                    cleanup();
                    // TODO: if (isResolved) then emit error
                    if (signal) {
                        this.log.warn('Process "%s" was killed with signal %s', id, signal);
                        resolveOnce(false);
                        return;
                    }
                    if (code === 0) {
                        const currentProcess = this.processes.get(id);
                        if (currentProcess?.expectedStop) {
                            this.log.info('Process "%s" stopped cleanly', id);
                            resolveOnce(true);
                            return;
                        }
                        this.log.warn('Process "%s" exited cleanly without stop request, restarting', id);
                        handleError(new procutil.ExitError(code));
                    }
                    else {
                        handleError(new procutil.ExitError(code));
                    }
                });
                childProcess.on('error', (err) => {
                    handleError(err);
                });
                const messageHandler = (message) => {
                    if (message === 'ready') {
                        handleReady();
                        childProcess?.removeListener('message', messageHandler);
                    }
                    else {
                        this.log.warn('Unknown message from process "%s": "%s"', id, message);
                    }
                };
                childProcess.on('message', messageHandler);
                // Store kill function for later
                const originalChildProcess = childProcess;
                this.updateTerminateHandler(id, async () => {
                    cleanup();
                    this.log.info('Gracefully killing process "%s"', id);
                    await procutil.gracefullyKill(originalChildProcess, this.killTimeout);
                });
            }
            catch (err) {
                this.log.error('Failed to spawn process "%s": %s', id, err.message);
                resolveOnce(false);
            }
        });
    }
    /**
     * Update the terminate handler for a process.
     * We don't expose the property via TypeScript API,
     * so we access a "non-existent" property.
     */
    updateTerminateHandler(id, handler) {
        const process = this.processes.get(id);
        if (process) {
            process.terminateHandler = handler;
        }
    }
    // Stop a process
    async stop(id) {
        const process = this.processes.get(id);
        if (!process) {
            this.log.warn('Process "%s" not found, cannot stop', id);
            return;
        }
        this.log.info('Stopping process "%s"', id);
        process.expectedStop = true;
        await this.callbacks.onCleanup?.(id, process.context);
        process.terminateHandler?.();
    }
    // Remove a process and release its resources
    async remove(id) {
        const process = this.processes.get(id);
        if (!process) {
            this.log.warn('Process "%s" not found, cannot remove', id);
            return;
        }
        // Stop the process first
        await this.stop(id);
        // Clear any timers
        if (process.timer) {
            clearTimeout(process.timer);
            process.timer = undefined;
        }
        // Release resources
        if (this.resourcePool && process.resources.length > 0) {
            this.resourcePool.release(process.resources);
            this.log.info(`Released ${process.resources.length} resources from process "${id}"`);
        }
        // Remove from map
        this.processes.delete(id);
        this.log.info('Removed process "%s"', id);
    }
    // Get a process by ID
    get(id) {
        return this.processes.get(id);
    }
    // Check if a process exists
    has(id) {
        return this.processes.has(id);
    }
    // Update process state
    setState(id, state) {
        const process = this.processes.get(id);
        if (process) {
            if (process.timer) {
                clearTimeout(process.timer);
                process.timer = undefined;
            }
            process.state = state;
            if (state === 'starting' || state === 'waiting') {
                process.startTime = Date.now();
            }
        }
    }
    // Set a safe timer for a process
    setTimer(id, timer) {
        const process = this.processes.get(id);
        if (process) {
            if (process.timer) {
                clearTimeout(process.timer);
            }
            process.timer = timer;
        }
    }
    // Clear a safe timer for a process
    clearTimer(id) {
        const process = this.processes.get(id);
        if (process?.timer) {
            clearTimeout(process.timer);
            process.timer = undefined;
        }
    }
    // Get statistics about all processes
    getStats() {
        const stats = {
            total: this.processes.size,
            waiting: [],
            starting: [],
            running: []
        };
        for (const [id, process] of this.processes.entries()) {
            if (process.state === 'running') {
                stats.running.push(id);
            }
            else if (process.state === 'starting') {
                stats.starting.push(id);
            }
            else {
                stats.waiting.push(id);
            }
        }
        return stats;
    }
    // Check health of all processes and return stuck process IDs
    checkHealth() {
        if (!this.healthCheckConfig) {
            return [];
        }
        const now = Date.now();
        const stuckProcesses = [];
        for (const [id, process] of this.processes.entries()) {
            if (process.state === 'starting' &&
                (now - process.startTime) > this.healthCheckConfig.startupTimeoutMs) {
                this.log.warn('Process "%s" has been stuck in starting state for %s ms', id, now - process.startTime);
                stuckProcesses.push(id);
            }
        }
        return stuckProcesses;
    }
    // Stop and remove all processes
    async cleanup() {
        this.log.info('Cleaning up all processes');
        const ids = Array.from(this.processes.keys());
        await Promise.all(ids.map(id => this.remove(id)));
        this.log.info('All processes cleaned up');
    }
    get count() {
        return this.processes.size;
    }
    get ids() {
        return Array.from(this.processes.keys());
    }
}
