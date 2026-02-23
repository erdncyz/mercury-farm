import EventEmitter from 'events';
import net from 'net';
const isOnline = (type) => ['device', 'emulator'].includes(type);
class ADBObserver extends EventEmitter {
    static instance = null;
    intervalMs = 1000; // Default 1 second polling
    healthCheckIntervalMs = 30000; // Default 30 sec health check
    maxHealthCheckAttempts = 3;
    host = 'localhost';
    port = 5037;
    devices = new Map();
    deviceHealthAttempts = new Map();
    pollTimeout = null;
    healthCheckTimeout = null;
    requestTimeoutMs = 5000; // 5 second timeout per request
    initialReconnectDelayMs = 100;
    maxReconnectAttempts = 8;
    connection = null;
    requestQueue = [];
    shouldContinuePolling = false;
    isPolling = false;
    isDestroyed = false;
    isConnecting = false;
    isReconnecting = false;
    constructor(options) {
        if (ADBObserver.instance) {
            return ADBObserver.instance;
        }
        super();
        this.intervalMs = options?.intervalMs || this.intervalMs;
        this.healthCheckIntervalMs = options?.healthCheckIntervalMs || this.healthCheckIntervalMs;
        this.host = options?.host || this.host;
        this.port = options?.port || this.port;
        ADBObserver.instance = this;
    }
    get count() {
        return this.devices.size;
    }
    /**
     * Start monitoring ADB devices
     */
    start() {
        if (this.shouldContinuePolling || this.isDestroyed) {
            return;
        }
        this.shouldContinuePolling = true;
        // Initial poll
        this.pollDevices();
        this.scheduleNextPoll();
        this.scheduleNextHealthCheck();
    }
    /**
     * Stop monitoring ADB devices
     */
    stop() {
        this.shouldContinuePolling = false;
        if (this.pollTimeout) {
            clearTimeout(this.pollTimeout);
            this.pollTimeout = null;
        }
        if (this.healthCheckTimeout) {
            clearTimeout(this.healthCheckTimeout);
            this.healthCheckTimeout = null;
        }
        this.closeConnection();
        ADBObserver.instance = null;
    }
    destroy() {
        this.isDestroyed = true;
        this.stop();
        this.devices.clear();
        this.deviceHealthAttempts.clear();
        this.removeAllListeners();
    }
    getDevices() {
        return Array.from(this.devices.values());
    }
    getDevice(serial) {
        return this.devices.get(serial);
    }
    /**
     * Poll ADB devices and emit events for changes
     */
    async pollDevices() {
        if (this.isPolling || this.isDestroyed) {
            return;
        }
        this.isPolling = true;
        try {
            const currentDevices = await this.getADBDevices();
            const currentSerials = new Set(currentDevices.map(d => d.serial));
            const previousSerials = new Set(this.devices.keys());
            for (const deviceEntry of currentDevices) {
                const existingDevice = this.devices.get(deviceEntry.serial);
                if (!existingDevice) {
                    // New device connected
                    const device = this.createDevice(deviceEntry);
                    this.devices.set(deviceEntry.serial, device);
                    this.emit('connect', device);
                }
                else if (existingDevice.type !== deviceEntry.state) {
                    // Device state changed (update event)
                    const oldType = existingDevice.type;
                    existingDevice.type = deviceEntry.state;
                    if (isOnline(existingDevice.type)) {
                        existingDevice.isStuck = false;
                    }
                    this.emit('update', existingDevice, oldType);
                }
            }
            // Find disconnected devices (disconnect events)
            for (const serial of previousSerials) {
                if (!currentSerials.has(serial)) {
                    const device = this.devices.get(serial);
                    this.devices.delete(serial);
                    this.deviceHealthAttempts.delete(serial); // Clean up health check tracking
                    this.emit('disconnect', device);
                }
            }
        }
        catch (error) {
            this.emit('error', error);
        }
        finally {
            this.isPolling = false;
        }
    }
    /**
     * Schedule the next polling cycle
     */
    scheduleNextPoll() {
        if (!this.shouldContinuePolling || this.isDestroyed) {
            return;
        }
        this.pollTimeout = setTimeout(async () => {
            await this.pollDevices();
            if (this.shouldContinuePolling && !this.isDestroyed) {
                this.scheduleNextPoll();
            }
        }, this.intervalMs);
    }
    /**
     * Schedule the next health check cycle
     */
    scheduleNextHealthCheck() {
        if (this.isDestroyed) {
            return;
        }
        this.healthCheckTimeout = setTimeout(async () => {
            await this.performHealthChecks();
            if (!this.isDestroyed) {
                this.scheduleNextHealthCheck();
            }
        }, this.healthCheckIntervalMs);
    }
    /**
     * Perform health checks on all tracked devices using getprop command
     */
    async performHealthChecks() {
        if (this.isDestroyed || this.devices.size === 0) {
            return;
        }
        try {
            let now = 0, ok = 0, bad = 0;
            // Check each tracked device
            for (const [serial, device] of this.devices.entries()) {
                if (this.isDestroyed || !this.shouldContinuePolling) {
                    break;
                }
                if (device.isStuck || !isOnline(device.type)) {
                    continue;
                }
                now = Date.now();
                try {
                    // Use shell command to check if device is responsive
                    // This is more reliable than get-state
                    // sendADBCommand already has a timeout (requestTimeoutMs)
                    await this.sendADBCommand('shell:getprop ro.build.version.sdk', serial);
                    // Device responded successfully - reset failure tracking
                    if (this.deviceHealthAttempts.has(serial)) {
                        this.deviceHealthAttempts.delete(serial);
                    }
                    ok++;
                }
                catch (error) {
                    console.log(`ADBObserver Healthcheck error: ${error?.message || error}`);
                    // Device didn't respond - track failure and potentially reconnect
                    this.handleDeviceHealthCheckFailure(serial, device, now);
                    bad++;
                }
            }
            this.emit('healthcheck', { ok, bad });
        }
        catch (error) {
            this.emit('error', new Error(`Health check failed: ${error.message}`));
        }
    }
    /**
     * Handle health check failure with backoff and reconnection attempts
     */
    async handleDeviceHealthCheckFailure(serial, device, now) {
        const attemptInfo = this.deviceHealthAttempts.get(serial);
        if (!attemptInfo) {
            // First failure - initialize tracking
            this.deviceHealthAttempts.set(serial, {
                attempts: 1,
                timeout: this.requestTimeoutMs,
                firstFailureTime: now,
                lastAttemptTime: now
            });
            return;
        }
        attemptInfo.attempts++;
        attemptInfo.lastAttemptTime = now;
        if (attemptInfo.attempts >= this.maxHealthCheckAttempts) {
            device.isStuck = true;
            this.devices.set(device.serial, device);
            this.emit('stuck', device, attemptInfo);
            // Reset tracking for potential future recovery
            this.deviceHealthAttempts.delete(serial);
            // Attempt reconnection (for network devices)
            await device.reconnect();
            return;
        }
    }
    async getADBDevices() {
        try {
            const response = await this.sendADBCommand('host:devices');
            return this.parseADBDevicesOutput(response);
        }
        catch (error) {
            throw new Error(`Failed to get ADB devices from ${this.host}:${this.port}: ${error}`);
        }
    }
    /**
     * Establish or reuse persistent connection to ADB server
     */
    async ensureConnection() {
        if (this.connection && !this.connection.destroyed) {
            return this.connection;
        }
        if (this.isConnecting || this.isReconnecting) {
            // Wait for ongoing connection or reconnection attempt
            return new Promise((resolve, reject) => {
                const checkConnection = () => {
                    if (this.connection && !this.connection.destroyed) {
                        resolve(this.connection);
                    }
                    else if (!this.isConnecting && !this.isReconnecting) {
                        reject(new Error('Connection failed'));
                    }
                    else {
                        setTimeout(checkConnection, 10);
                    }
                };
                checkConnection();
            });
        }
        return this.createConnection();
    }
    /**
     * Create new connection to ADB server
     */
    async createConnection() {
        this.isConnecting = true;
        return new Promise((resolve, reject) => {
            const client = net.createConnection({
                port: this.port,
                host: this.host,
                noDelay: true,
                keepAlive: true,
                keepAliveInitialDelay: 30000
            }, () => {
                this.connection = client;
                this.isConnecting = false;
                this.setupConnectionHandlers(client);
                resolve(client);
            });
            client.on('error', (err) => {
                this.isConnecting = false;
                this.connection = null;
                reject(err);
            });
        });
    }
    /**
     * Setup event handlers for persistent connection
     */
    setupConnectionHandlers(client) {
        let responseBuffer = Buffer.alloc(0);
        client.on('data', (data) => {
            responseBuffer = Buffer.concat([responseBuffer, data]);
            responseBuffer = this.processADBResponses(responseBuffer);
        });
        client.on('close', () => {
            this.connection = null;
            // Special handling for raw stream in progress - connection close means command completed
            if (this.requestQueue.length > 0 && this.requestQueue[0].rawStreamStarted) {
                const request = this.requestQueue.shift();
                if (request.timer) {
                    clearTimeout(request.timer);
                }
                const responseData = request.rawStreamBuffer.toString('utf-8').trim();
                request.resolve(responseData);
                // Process next request in queue (will reconnect if needed)
                if (this.shouldContinuePolling && !this.isDestroyed) {
                    this.processNextRequest();
                }
                return;
            }
            // Clear the timeout of in-flight request but keep it for potential retry
            if (this.requestQueue.length > 0 && this.requestQueue[0].timer) {
                clearTimeout(this.requestQueue[0].timer);
                delete this.requestQueue[0].timer;
            }
            // Attempt to reconnect if we should continue polling
            if (this.shouldContinuePolling && !this.isDestroyed) {
                this.attemptReconnect();
            }
            else {
                // Reject all queued requests (including in-flight one)
                for (const request of this.requestQueue) {
                    request.reject(new Error('Connection closed'));
                }
                this.requestQueue = [];
            }
        });
        client.on('error', (err) => {
            this.connection = null;
            this.emit('error', err);
        });
    }
    /**
     * Process ADB protocol responses and return remaining buffer
     */
    processADBResponses(buffer) {
        if (!this.requestQueue.length) {
            return buffer;
        }
        const request = this.requestQueue[0];
        let offset = 0;
        // Special handling for raw stream that's already started
        // Once OKAY is received for raw stream, we only accumulate data (no more status codes)
        if (request.rawStreamStarted) {
            // Accumulate all data
            if (buffer.length > 0) {
                request.rawStreamBuffer = Buffer.concat([request.rawStreamBuffer || Buffer.alloc(0), buffer]);
                // Check if we have a complete line (newline detected)
                // For commands like getprop that return single-line output, complete immediately
                const bufferString = request.rawStreamBuffer.toString('utf-8');
                if (bufferString.includes('\n')) {
                    if (this.requestQueue.length > 0 && this.requestQueue[0] === request) {
                        this.requestQueue.shift();
                        if (request.timer) {
                            clearTimeout(request.timer);
                        }
                        const responseData = bufferString.trim();
                        request.resolve(responseData);
                        // After transport session, close connection for next device/command
                        this.closeConnectionAfterTransport();
                        // Process next request in queue (will reconnect)
                        this.processNextRequest();
                    }
                }
            }
            return Buffer.alloc(0); // All data consumed
        }
        // Check if we have at least status bytes
        if (buffer.length < 4) {
            return buffer;
        }
        const status = buffer.subarray(offset, offset + 4).toString('ascii');
        if (status === 'FAIL') {
            // For FAIL responses, we always have length-prefixed error message
            if (buffer.length < 8) {
                return buffer; // Need more data for length
            }
            const lengthHex = buffer.subarray(offset + 4, offset + 8).toString('ascii');
            const dataLength = parseInt(lengthHex, 16);
            if (buffer.length < 8 + dataLength) {
                return buffer; // Need more data for complete error message
            }
            const errorMessage = buffer.subarray(offset + 8, offset + 8 + dataLength).toString('utf-8');
            if (this.requestQueue.length > 0) {
                const request = this.requestQueue.shift();
                if (request.timer) {
                    clearTimeout(request.timer);
                }
                request.reject(new Error(errorMessage || 'ADB command failed'));
                // Process next request in queue
                this.processNextRequest();
            }
            return buffer.subarray(offset + 8 + dataLength);
        }
        if (status === 'OKAY') {
            offset += 4; // Consume OKAY status
            // Handle different response types based on request
            if (request.isRawStream) {
                // For device commands after transport (shell:, logcat:, etc.)
                // Response is: OKAY + raw unstructured stream (no length prefix)
                // Mark that we've started raw stream mode
                // This prevents processing any further status codes for this request
                request.rawStreamStarted = true;
                request.rawStreamBuffer = Buffer.alloc(0);
                // Accumulate any data that came with OKAY in this packet
                if (buffer.length > offset) {
                    request.rawStreamBuffer = Buffer.concat([request.rawStreamBuffer, buffer.subarray(offset)]);
                }
                // Check if we already have a complete line (newline detected)
                const bufferString = request.rawStreamBuffer.toString('utf-8');
                if (bufferString.includes('\n')) {
                    if (this.requestQueue.length > 0) {
                        this.requestQueue.shift();
                        if (request.timer) {
                            clearTimeout(request.timer);
                        }
                        const responseData = bufferString.trim();
                        request.resolve(responseData);
                        // After transport session, close connection for next device/command
                        this.closeConnectionAfterTransport();
                        // Process next request in queue (will reconnect if needed)
                        this.processNextRequest();
                    }
                }
                // If no newline yet, wait for more data (will be handled by rawStreamStarted check above)
                return Buffer.alloc(0); // All data consumed
            }
            else if (request.needData) {
                // For host commands with length-prefixed data
                if (buffer.length - offset < 4) {
                    return buffer.subarray(offset - 4); // Need more data for length, return including OKAY
                }
                const lengthHex = buffer.subarray(offset, offset + 4).toString('ascii');
                const dataLength = parseInt(lengthHex, 16);
                if (buffer.length - offset < 4 + dataLength) {
                    return buffer.subarray(offset - 4); // Need more data, return including OKAY
                }
                const responseData = buffer.subarray(offset + 4, offset + 4 + dataLength).toString('utf-8');
                if (this.requestQueue.length > 0) {
                    this.requestQueue.shift();
                    if (request.timer) {
                        clearTimeout(request.timer);
                    }
                    request.resolve(responseData);
                    // Process next request in queue
                    this.processNextRequest();
                }
                return buffer.subarray(offset + 4 + dataLength);
            }
            else {
                // For commands that only expect OKAY (like host:transport:<serial>)
                if (this.requestQueue.length > 0) {
                    this.requestQueue.shift();
                    if (request.timer) {
                        clearTimeout(request.timer);
                    }
                    request.resolve('');
                    // Process next request in queue
                    this.processNextRequest();
                }
                return buffer.subarray(offset);
            }
        }
        // Unknown status or need more data
        return buffer;
    }
    /**
     * Send command to ADB server using persistent connection
     * Requests are queued and processed sequentially
     */
    async sendADBCommand(command, host) {
        await this.ensureConnection();
        return new Promise((resolve, reject) => {
            if (host) {
                // First, switch to device transport mode
                this.requestQueue.push({
                    command: `host:transport:${host}`,
                    needData: false,
                    resolve: () => {
                        // After transport succeeds, socket is now a tunnel to device's adbd
                        // Device commands (shell:, logcat:, etc.) return raw streams, not length-prefixed data
                        this.requestQueue.push({
                            command,
                            resolve,
                            reject,
                            needData: false,
                            isRawStream: true // Mark as raw stream response
                        });
                        this.processNextRequest();
                    },
                    reject
                });
            }
            else {
                // Host commands have length-prefixed responses
                this.requestQueue.push({ command, resolve, reject, needData: true });
            }
            // Try to process the queue if no request is currently in-flight
            this.processNextRequest();
        });
    }
    /**
     * Process the next request in the queue if no request is currently in-flight
     */
    processNextRequest() {
        // Don't process if queue is empty or first request already in-flight
        if (this.requestQueue.length === 0 || this.requestQueue[0].timer) {
            return;
        }
        // Don't process if connection is not available
        if (!this.connection || this.connection.destroyed) {
            return;
        }
        // Get the first request in queue (don't shift yet - only shift on response)
        const request = this.requestQueue[0];
        const { command, reject } = request;
        // Set up timeout for this request
        const timer = setTimeout(() => {
            if (this.requestQueue.length > 0 && this.requestQueue[0] === request) {
                this.requestQueue.shift(); // Remove the timed-out request
                reject(new Error(`Request timeout after ${this.requestTimeoutMs}ms: ${command}`));
                // Process next request in queue
                this.processNextRequest();
            }
        }, this.requestTimeoutMs);
        // Mark request as in-flight by setting its timer
        request.timer = timer;
        // Send the command
        const commandBuffer = Buffer.from(command, 'utf-8');
        const lengthHex = commandBuffer.length.toString(16).padStart(4, '0');
        const message = Buffer.concat([
            Buffer.from(lengthHex, 'ascii'),
            commandBuffer
        ]);
        this.connection.write(message, (err) => {
            if (err && this.requestQueue.length > 0 && this.requestQueue[0] === request) {
                clearTimeout(request.timer);
                this.requestQueue.shift(); // Remove the failed request
                reject(err);
                // Process next request in queue
                this.processNextRequest();
            }
        });
    }
    /**
     * Attempt to reconnect with exponential backoff
     */
    async attemptReconnect() {
        if (this.isReconnecting || this.isDestroyed) {
            return;
        }
        this.isReconnecting = true;
        for (let attempt = 0; attempt < this.maxReconnectAttempts; attempt++) {
            // Calculate exponential backoff delay
            const delay = this.initialReconnectDelayMs * Math.pow(2, attempt);
            // Wait before attempting reconnection
            await new Promise(resolve => setTimeout(resolve, delay));
            if (!this.shouldContinuePolling || this.isDestroyed) {
                this.isReconnecting = false;
                return;
            }
            try {
                // Attempt to create a new connection
                await this.createConnection();
                this.isReconnecting = false;
                // Resend the in-flight request if it exists
                if (this.requestQueue.length > 0 && !this.requestQueue[0].timer) {
                    // The first request was in-flight but timer was cleared on disconnect
                    // Resend it by calling processNextRequest
                    this.processNextRequest();
                }
                return; // Successfully reconnected
            }
            catch {
                // Continue to next attempt
                continue;
            }
        }
        // All reconnection attempts failed
        this.isReconnecting = false;
        const error = new Error(`Failed to reconnect to ADB server after ${this.maxReconnectAttempts} attempts`);
        this.emit('error', error);
        // Reject all queued requests (including in-flight one)
        for (const request of this.requestQueue) {
            if (request.timer) {
                clearTimeout(request.timer);
            }
            request.reject(error);
        }
        this.requestQueue = [];
    }
    /**
     * Close connection after transport session (device-specific command)
     * This is necessary because after host:transport:<serial>, the socket becomes
     * a dedicated tunnel to that device and cannot be reused for other commands
     */
    closeConnectionAfterTransport() {
        if (this.connection && !this.connection.destroyed) {
            this.connection.destroy();
            this.connection = null;
        }
        // Don't reject queued requests - they will be processed with a new connection
        // Don't reset reconnection state - let it continue if needed
    }
    /**
     * Close the persistent connection
     */
    closeConnection() {
        if (this.connection && !this.connection.destroyed) {
            this.connection.destroy();
            this.connection = null;
        }
        this.isReconnecting = false;
        // Reject all queued requests (including in-flight one)
        for (const request of this.requestQueue) {
            if (request.timer) {
                clearTimeout(request.timer);
            }
            request.reject(new Error('Connection closed'));
        }
        this.requestQueue = [];
    }
    /**
     * Parse the output of 'adb devices' command from ADB protocol response
     */
    parseADBDevicesOutput(output) {
        const lines = output.trim().split('\n');
        const devices = [];
        // Parse each line directly (no header line in protocol response)
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) {
                continue;
            }
            const parts = trimmedLine.split(/\s+/);
            if (parts.length >= 2) {
                const serial = parts[0];
                const state = parts[1];
                devices.push({ serial, state });
            }
        }
        return devices;
    }
    /**
     * Create a device object from ADB device entry
     */
    createDevice(deviceEntry) {
        const device = {
            serial: deviceEntry.serial,
            type: deviceEntry.state,
            isStuck: false,
            reconnect: async () => {
                try {
                    // Try to reconnect the device using ADB protocol (for network devices)
                    // For USB devices, this might not be applicable
                    if (device.serial.includes(':') && !this.isDestroyed) {
                        if (this.devices.has(device.serial)) {
                            try {
                                await this.sendADBCommand(`host:disconnect:${device.serial}`);
                            }
                            catch {
                                // Ignore disconnect errors
                            }
                        }
                        await this.sendADBCommand(`host:connect:${device.serial}`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        const devices = await this.getADBDevices();
                        const reconnectedDevice = devices.find(d => d.serial === device.serial);
                        if (reconnectedDevice && isOnline(reconnectedDevice.state)) {
                            device.type = 'device';
                            device.isStuck = false;
                            return true;
                        }
                    }
                    return false;
                }
                catch {
                    return false;
                }
            }
        };
        return device;
    }
}
export default ADBObserver;
export { ADBObserver };
