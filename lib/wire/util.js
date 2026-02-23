import crypto from 'node:crypto';
import { DeviceRequirement, DeviceStatus, Envelope, RequirementType, TransactionDoneMessage, TransactionProgressMessage } from "./wire.js";
import { Any } from "./google/protobuf/any.js";
import { createLogger } from "../util/logger.js";
const DEVICE_STATUS_MAP = {
    device: 'ONLINE',
    // emulator: 'ONLINE',
    unauthorized: 'UNAUTHORIZED',
    offline: 'OFFLINE',
    // connecting: 'CONNECTING',
    // authorizing: 'AUTHORIZING',
    unknown: 'OFFLINE',
    recovery: 'OFFLINE',
    bootloader: 'OFFLINE',
    sideload: 'OFFLINE'
}; // TODO: replace value type with proper type once it's ready
const log = createLogger('wireutil');
const wireutil = {
    global: '*ALL',
    makePrivateChannel() {
        return crypto.randomBytes(16).toString('base64');
    },
    toDeviceStatus(type) {
        return DeviceStatus[DEVICE_STATUS_MAP[type]];
    },
    toDeviceRequirements(requirements) {
        return Object.keys(requirements).map(function (name) {
            let item = requirements[name];
            return DeviceRequirement.create({
                name,
                value: item.value,
                type: RequirementType[item.match.toUpperCase()]
            });
        });
    },
    /**
     * @deprecated Do not use raw envelope with a message. Use `pack` for type safety
     */
    envelope(message) {
        return this.oldSend(message);
    },
    // envelope(Message.create({...})) // <- forbidden - no way to extract the type
    // envelope(new wire.Message(...))
    pack(messageType, message, channel = undefined) {
        return Envelope.toBinary({ message: Any.pack(message, messageType), channel });
    },
    tr(channel, messageType, message) {
        return Envelope.toBinary({ message: Any.pack(message, messageType), channel });
    },
    /**
     * @deprecated Use `tr` for type safety
     */
    transaction(channel, message) {
        return this.oldSend(message, channel);
    },
    oldSend(message, channel = undefined) {
        // @ts-expect-error
        const messageType = message.__proto__.constructor.type;
        return this.pack(messageType, message, channel);
    },
    reply(source) {
        let seq = 0;
        return {
            okay(data, body) {
                return wireutil.pack(TransactionDoneMessage, {
                    source,
                    seq: seq++,
                    success: true,
                    data: data ?? 'success',
                    body: body ? JSON.stringify(body) : undefined
                });
            },
            fail(data, body) {
                return wireutil.pack(TransactionDoneMessage, {
                    source,
                    seq: seq++,
                    success: false,
                    data: data ?? 'fail',
                    body: body ? JSON.stringify(body) : undefined
                });
            },
            progress(data, progress) {
                if (!Number.isInteger(progress)) {
                    log.warn('Somebody is sending non integer as progress: %s', data);
                    progress = Math.round(progress);
                }
                return wireutil.pack(TransactionProgressMessage, {
                    source,
                    seq: seq++,
                    data: data,
                    progress: progress
                });
            }
        };
    }
};
export default wireutil;
