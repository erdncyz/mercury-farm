import { createLogger } from "../util/logger.js";
const allClasses = await import("./wire.js");
const log = createLogger('wire:legacy');
const alerted = new Set();
/**
 * @deprecated Do not use the proxy for the constructor. Import the model directly from wire.ts
 */
export default new Proxy({}, {
    get(target, prop, receiver) {
        const messageType = allClasses[prop];
        if (!messageType) {
            throw new Error(`Unknown message type tried constructing: ${prop.toString()}`);
        }
        if (!alerted.has(messageType.typeName)) {
            alerted.add(messageType.typeName);
            log.warn('Legacy contstructor lookup for %s', messageType.typeName);
        }
        const construct = function constructor(...args) {
            const message = messageType.create(Object.fromEntries(messageType.fields.map((name, index) => ([name.localName, args[index]]))));
            Object.assign(this, message);
        };
        construct.type = messageType;
        return construct;
    }
});
