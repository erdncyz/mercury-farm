import { EventEmitter } from 'events';
class ChannelManager extends EventEmitter {
    channels;
    constructor() {
        super();
        this.channels = Object.create(null);
    }
    register(id, options) {
        const channel = {
            timeout: options.timeout,
            alias: options.alias,
            lastActivity: Date.now(),
            timer: null,
        };
        if (channel.alias) {
            // The alias can only be active for a single channel at a time
            if (this.channels[channel.alias]) {
                throw new Error(`Cannot create alias "${channel.alias}" for "${id}"; the channel already exists`);
            }
            this.channels[channel.alias] = channel;
        }
        this.channels[id] = channel;
        // Set timer with initial check
        this.check(id);
    }
    unregister(id) {
        const channel = this.channels[id];
        if (channel) {
            delete this.channels[id];
            if (channel.timer) {
                clearTimeout(channel.timer);
            }
            if (channel.alias) {
                delete this.channels[channel.alias];
            }
        }
    }
    keepalive(id) {
        const channel = this.channels[id];
        if (channel) {
            channel.lastActivity = Date.now();
        }
    }
    updateTimeout(id, timeout) {
        const channel = this.channels[id];
        if (channel) {
            channel.timeout += timeout;
        }
    }
    getTimeout(id) {
        const channel = this.channels[id];
        return channel ? channel.timeout : null;
    }
    check(id) {
        const channel = this.channels[id];
        if (!channel) {
            return;
        }
        const inactivePeriod = Date.now() - channel.lastActivity;
        if (inactivePeriod >= channel.timeout) {
            this.unregister(id);
            this.emit('timeout', id);
        }
        else if (channel.timeout > 1) {
            // 1 is infinity timeout
            const max32Int = 2147483647; // prevent timeout > Int32
            channel.timer = setTimeout(() => this.check(id), Math.min(channel.timeout - inactivePeriod, max32Int));
        }
    }
}
export default ChannelManager;
