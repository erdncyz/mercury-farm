import EventEmitter from "eventemitter3";
import logger from "../util/logger.js";
import { Envelope } from "./wire.js";
import { Any } from "./google/protobuf/any.js";
const log = logger.createLogger("wire:router");
export class WireRouter {
    emitter = new EventEmitter();
    registeredTypes = new Map;
    on(messageType, fn, context) {
        if (typeof messageType !== "string" &&
            typeof messageType !== "symbol") {
            // WireMessage
            this.emitter.on(messageType.typeName, fn);
            this.registeredTypes.set(Any.typeNameToUrl(messageType.typeName), messageType);
        }
        else {
            this.emitter.on(messageType, fn, context);
        }
        return this;
    }
    removeAllListeners(messageType) {
        this.emitter.removeAllListeners(messageType.typeName);
    }
    removeListener(messageType, fn, context) {
        if (typeof messageType === "object") {
            this.emitter.removeListener(messageType.typeName, fn);
        }
        else {
            this.emitter.removeListener(messageType, fn, context);
        }
        return this;
    }
    handler() {
        return (channel, data) => {
            const decoded = Envelope.fromBinary(data);
            if (!decoded.message) {
                log.warn(`Message without message %s`, decoded);
                return;
            }
            let target = decoded.message.typeUrl;
            if (!target) {
                log.warn(`Message without typeUrl %s`, decoded);
                return;
            }
            const messageType = this.registeredTypes.get(target);
            if (!messageType) {
                // log.warn(`Unknown message type:`, decoded)
                // Nobody is expecting such message type.. Ignoring..
                return;
            }
            const decodedMessage = Any.unpack(decoded.message, messageType);
            // const wrapper = wire.Envelope.decode(data);
            // const type = wire.ReverseMessageType[wrapper.type];
            // let decodedMessage: any;
            // try {
            //     decodedMessage = wire[type].decode(wrapper.message)
            // }
            // catch (e) {
            //     log.error(
            //         'Received message with type "%s", but cant parse data ' +
            //             wrapper.message
            //     );
            //     throw e;
            // }
            // log.info(
            //     'Received message with type "%s", and data %s',
            //     messageType.typeName,
            //     messageType.toJsonString(decodedMessage)
            // )
            this.emitter.emit(messageType.typeName, decoded.channel || channel, decodedMessage, data);
            this.emitter.emit('message', channel);
        };
    }
}
