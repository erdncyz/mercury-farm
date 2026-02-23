import { WireType } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
import { Any } from "./google/protobuf/any";
/**
 * @generated from protobuf enum DeviceStatus
 */
export var DeviceStatus;
(function (DeviceStatus) {
    /**
     * @generated synthetic value - protobuf-ts requires all enums to have a 0 value
     */
    DeviceStatus[DeviceStatus["UNSPECIFIED$"] = 0] = "UNSPECIFIED$";
    /**
     * @generated from protobuf enum value: OFFLINE = 1;
     */
    DeviceStatus[DeviceStatus["OFFLINE"] = 1] = "OFFLINE";
    /**
     * @generated from protobuf enum value: UNAUTHORIZED = 2;
     */
    DeviceStatus[DeviceStatus["UNAUTHORIZED"] = 2] = "UNAUTHORIZED";
    /**
     * @generated from protobuf enum value: ONLINE = 3;
     */
    DeviceStatus[DeviceStatus["ONLINE"] = 3] = "ONLINE";
    /**
     * @generated from protobuf enum value: CONNECTING = 4;
     */
    DeviceStatus[DeviceStatus["CONNECTING"] = 4] = "CONNECTING";
    /**
     * @generated from protobuf enum value: AUTHORIZING = 5;
     */
    DeviceStatus[DeviceStatus["AUTHORIZING"] = 5] = "AUTHORIZING";
    /**
     * @generated from protobuf enum value: PREPARING = 6;
     */
    DeviceStatus[DeviceStatus["PREPARING"] = 6] = "PREPARING";
    /**
     * @generated from protobuf enum value: UNHEALTHY = 7;
     */
    DeviceStatus[DeviceStatus["UNHEALTHY"] = 7] = "UNHEALTHY";
})(DeviceStatus || (DeviceStatus = {}));
// Grouping
/**
 * @generated from protobuf enum RequirementType
 */
export var RequirementType;
(function (RequirementType) {
    /**
     * @generated synthetic value - protobuf-ts requires all enums to have a 0 value
     */
    RequirementType[RequirementType["UNSPECIFIED$"] = 0] = "UNSPECIFIED$";
    /**
     * @generated from protobuf enum value: SEMVER = 1;
     */
    RequirementType[RequirementType["SEMVER"] = 1] = "SEMVER";
    /**
     * @generated from protobuf enum value: GLOB = 2;
     */
    RequirementType[RequirementType["GLOB"] = 2] = "GLOB";
    /**
     * @generated from protobuf enum value: EXACT = 3;
     */
    RequirementType[RequirementType["EXACT"] = 3] = "EXACT";
})(RequirementType || (RequirementType = {}));
/**
 * @generated from protobuf enum RingerMode
 */
export var RingerMode;
(function (RingerMode) {
    /**
     * @generated from protobuf enum value: SILENT = 0;
     */
    RingerMode[RingerMode["SILENT"] = 0] = "SILENT";
    /**
     * @generated from protobuf enum value: VIBRATE = 1;
     */
    RingerMode[RingerMode["VIBRATE"] = 1] = "VIBRATE";
    /**
     * @generated from protobuf enum value: NORMAL = 2;
     */
    RingerMode[RingerMode["NORMAL"] = 2] = "NORMAL";
})(RingerMode || (RingerMode = {}));
// @generated message type with reflection information, may provide speed optimized methods
class Envelope$Type extends MessageType {
    constructor() {
        super("Envelope", [
            { no: 2, name: "message", kind: "message", T: () => Any },
            { no: 3, name: "channel", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required google.protobuf.Any message */ 2:
                    message.message = Any.internalBinaryRead(reader, reader.uint32(), options, message.message);
                    break;
                case /* optional string channel */ 3:
                    message.channel = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required google.protobuf.Any message = 2; */
        if (message.message)
            Any.internalBinaryWrite(message.message, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        /* optional string channel = 3; */
        if (message.channel !== undefined)
            writer.tag(3, WireType.LengthDelimited).string(message.channel);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message Envelope
 */
export const Envelope = new Envelope$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UpdateAccessTokenMessage$Type extends MessageType {
    constructor() {
        super("UpdateAccessTokenMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UpdateAccessTokenMessage
 */
export const UpdateAccessTokenMessage = new UpdateAccessTokenMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UnlockDeviceMessage$Type extends MessageType {
    constructor() {
        super("UnlockDeviceMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UnlockDeviceMessage
 */
export const UnlockDeviceMessage = new UnlockDeviceMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeleteUserMessage$Type extends MessageType {
    constructor() {
        super("DeleteUserMessage", [
            { no: 1, name: "email", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.email = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string email */ 1:
                    message.email = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string email = 1; */
        if (message.email !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.email);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeleteUserMessage
 */
export const DeleteUserMessage = new DeleteUserMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceOriginGroupMessage$Type extends MessageType {
    constructor() {
        super("DeviceOriginGroupMessage", [
            { no: 1, name: "signature", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.signature = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string signature */ 1:
                    message.signature = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string signature = 1; */
        if (message.signature !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.signature);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceOriginGroupMessage
 */
export const DeviceOriginGroupMessage = new DeviceOriginGroupMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UserQuotasDetailField$Type extends MessageType {
    constructor() {
        super("UserQuotasDetailField", [
            { no: 1, name: "duration", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 2, name: "number", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.duration = 0;
        message.number = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required double duration */ 1:
                    message.duration = reader.double();
                    break;
                case /* required uint32 number */ 2:
                    message.number = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required double duration = 1; */
        if (message.duration !== 0)
            writer.tag(1, WireType.Bit64).double(message.duration);
        /* required uint32 number = 2; */
        if (message.number !== 0)
            writer.tag(2, WireType.Varint).uint32(message.number);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UserQuotasDetailField
 */
export const UserQuotasDetailField = new UserQuotasDetailField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UserQuotasField$Type extends MessageType {
    constructor() {
        super("UserQuotasField", [
            { no: 1, name: "allocated", kind: "message", T: () => UserQuotasDetailField },
            { no: 2, name: "consumed", kind: "message", T: () => UserQuotasDetailField },
            { no: 3, name: "defaultGroupsDuration", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 4, name: "defaultGroupsNumber", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 5, name: "defaultGroupsRepetitions", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 6, name: "repetitions", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.defaultGroupsDuration = 0;
        message.defaultGroupsNumber = 0;
        message.defaultGroupsRepetitions = 0;
        message.repetitions = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required UserQuotasDetailField allocated */ 1:
                    message.allocated = UserQuotasDetailField.internalBinaryRead(reader, reader.uint32(), options, message.allocated);
                    break;
                case /* required UserQuotasDetailField consumed */ 2:
                    message.consumed = UserQuotasDetailField.internalBinaryRead(reader, reader.uint32(), options, message.consumed);
                    break;
                case /* required uint32 defaultGroupsDuration */ 3:
                    message.defaultGroupsDuration = reader.uint32();
                    break;
                case /* required uint32 defaultGroupsNumber */ 4:
                    message.defaultGroupsNumber = reader.uint32();
                    break;
                case /* required uint32 defaultGroupsRepetitions */ 5:
                    message.defaultGroupsRepetitions = reader.uint32();
                    break;
                case /* required uint32 repetitions */ 6:
                    message.repetitions = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required UserQuotasDetailField allocated = 1; */
        if (message.allocated)
            UserQuotasDetailField.internalBinaryWrite(message.allocated, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        /* required UserQuotasDetailField consumed = 2; */
        if (message.consumed)
            UserQuotasDetailField.internalBinaryWrite(message.consumed, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        /* required uint32 defaultGroupsDuration = 3; */
        if (message.defaultGroupsDuration !== 0)
            writer.tag(3, WireType.Varint).uint32(message.defaultGroupsDuration);
        /* required uint32 defaultGroupsNumber = 4; */
        if (message.defaultGroupsNumber !== 0)
            writer.tag(4, WireType.Varint).uint32(message.defaultGroupsNumber);
        /* required uint32 defaultGroupsRepetitions = 5; */
        if (message.defaultGroupsRepetitions !== 0)
            writer.tag(5, WireType.Varint).uint32(message.defaultGroupsRepetitions);
        /* required uint32 repetitions = 6; */
        if (message.repetitions !== 0)
            writer.tag(6, WireType.Varint).uint32(message.repetitions);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UserQuotasField
 */
export const UserQuotasField = new UserQuotasField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UserGroupsField$Type extends MessageType {
    constructor() {
        super("UserGroupsField", [
            { no: 1, name: "quotas", kind: "message", T: () => UserQuotasField },
            { no: 2, name: "subscribed", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.subscribed = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required UserQuotasField quotas */ 1:
                    message.quotas = UserQuotasField.internalBinaryRead(reader, reader.uint32(), options, message.quotas);
                    break;
                case /* repeated string subscribed */ 2:
                    message.subscribed.push(reader.string());
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required UserQuotasField quotas = 1; */
        if (message.quotas)
            UserQuotasField.internalBinaryWrite(message.quotas, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        /* repeated string subscribed = 2; */
        for (let i = 0; i < message.subscribed.length; i++)
            writer.tag(2, WireType.LengthDelimited).string(message.subscribed[i]);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UserGroupsField
 */
export const UserGroupsField = new UserGroupsField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AlertMessageField$Type extends MessageType {
    constructor() {
        super("AlertMessageField", [
            { no: 1, name: "activation", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "data", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "level", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.activation = "";
        message.data = "";
        message.level = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string activation */ 1:
                    message.activation = reader.string();
                    break;
                case /* required string data */ 2:
                    message.data = reader.string();
                    break;
                case /* required string level */ 3:
                    message.level = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string activation = 1; */
        if (message.activation !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.activation);
        /* required string data = 2; */
        if (message.data !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.data);
        /* required string level = 3; */
        if (message.level !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.level);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message AlertMessageField
 */
export const AlertMessageField = new AlertMessageField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UserSettingsField$Type extends MessageType {
    constructor() {
        super("UserSettingsField", [
            { no: 1, name: "alertMessage", kind: "message", T: () => AlertMessageField }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* optional AlertMessageField alertMessage */ 1:
                    message.alertMessage = AlertMessageField.internalBinaryRead(reader, reader.uint32(), options, message.alertMessage);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* optional AlertMessageField alertMessage = 1; */
        if (message.alertMessage)
            AlertMessageField.internalBinaryWrite(message.alertMessage, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UserSettingsField
 */
export const UserSettingsField = new UserSettingsField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UserField$Type extends MessageType {
    constructor() {
        super("UserField", [
            { no: 1, name: "email", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "privilege", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "groups", kind: "message", T: () => UserGroupsField },
            { no: 5, name: "settings", kind: "message", T: () => UserSettingsField }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.email = "";
        message.name = "";
        message.privilege = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string email */ 1:
                    message.email = reader.string();
                    break;
                case /* required string name */ 2:
                    message.name = reader.string();
                    break;
                case /* required string privilege */ 3:
                    message.privilege = reader.string();
                    break;
                case /* required UserGroupsField groups */ 4:
                    message.groups = UserGroupsField.internalBinaryRead(reader, reader.uint32(), options, message.groups);
                    break;
                case /* optional UserSettingsField settings */ 5:
                    message.settings = UserSettingsField.internalBinaryRead(reader, reader.uint32(), options, message.settings);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string email = 1; */
        if (message.email !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.email);
        /* required string name = 2; */
        if (message.name !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.name);
        /* required string privilege = 3; */
        if (message.privilege !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.privilege);
        /* required UserGroupsField groups = 4; */
        if (message.groups)
            UserGroupsField.internalBinaryWrite(message.groups, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
        /* optional UserSettingsField settings = 5; */
        if (message.settings)
            UserSettingsField.internalBinaryWrite(message.settings, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UserField
 */
export const UserField = new UserField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UserChangeMessage$Type extends MessageType {
    constructor() {
        super("UserChangeMessage", [
            { no: 1, name: "user", kind: "message", T: () => UserField },
            { no: 2, name: "isAddedGroup", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 3, name: "groups", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "action", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "targets", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 6, name: "timeStamp", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.isAddedGroup = false;
        message.groups = [];
        message.action = "";
        message.targets = [];
        message.timeStamp = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required UserField user */ 1:
                    message.user = UserField.internalBinaryRead(reader, reader.uint32(), options, message.user);
                    break;
                case /* required bool isAddedGroup */ 2:
                    message.isAddedGroup = reader.bool();
                    break;
                case /* repeated string groups */ 3:
                    message.groups.push(reader.string());
                    break;
                case /* required string action */ 4:
                    message.action = reader.string();
                    break;
                case /* repeated string targets */ 5:
                    message.targets.push(reader.string());
                    break;
                case /* required double timeStamp */ 6:
                    message.timeStamp = reader.double();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required UserField user = 1; */
        if (message.user)
            UserField.internalBinaryWrite(message.user, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        /* required bool isAddedGroup = 2; */
        if (message.isAddedGroup !== false)
            writer.tag(2, WireType.Varint).bool(message.isAddedGroup);
        /* repeated string groups = 3; */
        for (let i = 0; i < message.groups.length; i++)
            writer.tag(3, WireType.LengthDelimited).string(message.groups[i]);
        /* required string action = 4; */
        if (message.action !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.action);
        /* repeated string targets = 5; */
        for (let i = 0; i < message.targets.length; i++)
            writer.tag(5, WireType.LengthDelimited).string(message.targets[i]);
        /* required double timeStamp = 6; */
        if (message.timeStamp !== 0)
            writer.tag(6, WireType.Bit64).double(message.timeStamp);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UserChangeMessage
 */
export const UserChangeMessage = new UserChangeMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceNetworkField$Type extends MessageType {
    constructor() {
        super("DeviceNetworkField", [
            { no: 1, name: "type", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "subtype", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* optional string type */ 1:
                    message.type = reader.string();
                    break;
                case /* optional string subtype */ 2:
                    message.subtype = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* optional string type = 1; */
        if (message.type !== undefined)
            writer.tag(1, WireType.LengthDelimited).string(message.type);
        /* optional string subtype = 2; */
        if (message.subtype !== undefined)
            writer.tag(2, WireType.LengthDelimited).string(message.subtype);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceNetworkField
 */
export const DeviceNetworkField = new DeviceNetworkField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceDisplayField$Type extends MessageType {
    constructor() {
        super("DeviceDisplayField", [
            { no: 1, name: "height", kind: "scalar", opt: true, T: 13 /*ScalarType.UINT32*/ },
            { no: 2, name: "width", kind: "scalar", opt: true, T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* optional uint32 height */ 1:
                    message.height = reader.uint32();
                    break;
                case /* optional uint32 width */ 2:
                    message.width = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* optional uint32 height = 1; */
        if (message.height !== undefined)
            writer.tag(1, WireType.Varint).uint32(message.height);
        /* optional uint32 width = 2; */
        if (message.width !== undefined)
            writer.tag(2, WireType.Varint).uint32(message.width);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceDisplayField
 */
export const DeviceDisplayField = new DeviceDisplayField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DevicePhoneField$Type extends MessageType {
    constructor() {
        super("DevicePhoneField", [
            { no: 1, name: "imei", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* optional string imei */ 1:
                    message.imei = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* optional string imei = 1; */
        if (message.imei !== undefined)
            writer.tag(1, WireType.LengthDelimited).string(message.imei);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DevicePhoneField
 */
export const DevicePhoneField = new DevicePhoneField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceProviderField$Type extends MessageType {
    constructor() {
        super("DeviceProviderField", [
            { no: 1, name: "name", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* optional string name */ 1:
                    message.name = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* optional string name = 1; */
        if (message.name !== undefined)
            writer.tag(1, WireType.LengthDelimited).string(message.name);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceProviderField
 */
export const DeviceProviderField = new DeviceProviderField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceGroupField$Type extends MessageType {
    constructor() {
        super("DeviceGroupField", [
            { no: 1, name: "id", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "name", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "origin", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "originName", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "owner", kind: "message", T: () => GroupOwnerField }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* optional string id */ 1:
                    message.id = reader.string();
                    break;
                case /* optional string name */ 2:
                    message.name = reader.string();
                    break;
                case /* optional string origin */ 3:
                    message.origin = reader.string();
                    break;
                case /* optional string originName */ 4:
                    message.originName = reader.string();
                    break;
                case /* optional GroupOwnerField owner */ 5:
                    message.owner = GroupOwnerField.internalBinaryRead(reader, reader.uint32(), options, message.owner);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* optional string id = 1; */
        if (message.id !== undefined)
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* optional string name = 2; */
        if (message.name !== undefined)
            writer.tag(2, WireType.LengthDelimited).string(message.name);
        /* optional string origin = 3; */
        if (message.origin !== undefined)
            writer.tag(3, WireType.LengthDelimited).string(message.origin);
        /* optional string originName = 4; */
        if (message.originName !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.originName);
        /* optional GroupOwnerField owner = 5; */
        if (message.owner)
            GroupOwnerField.internalBinaryWrite(message.owner, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceGroupField
 */
export const DeviceGroupField = new DeviceGroupField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceField$Type extends MessageType {
    constructor() {
        super("DeviceField", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "model", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "version", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "operator", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "network", kind: "message", T: () => DeviceNetworkField },
            { no: 6, name: "display", kind: "message", T: () => DeviceDisplayField },
            { no: 7, name: "manufacturer", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 8, name: "sdk", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 9, name: "abi", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 10, name: "cpuPlatform", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 11, name: "openGLESVersion", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 12, name: "phone", kind: "message", T: () => DevicePhoneField },
            { no: 13, name: "provider", kind: "message", T: () => DeviceProviderField },
            { no: 14, name: "group", kind: "message", T: () => DeviceGroupField },
            { no: 15, name: "marketName", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* optional string model */ 2:
                    message.model = reader.string();
                    break;
                case /* optional string version */ 3:
                    message.version = reader.string();
                    break;
                case /* optional string operator */ 4:
                    message.operator = reader.string();
                    break;
                case /* optional DeviceNetworkField network */ 5:
                    message.network = DeviceNetworkField.internalBinaryRead(reader, reader.uint32(), options, message.network);
                    break;
                case /* optional DeviceDisplayField display */ 6:
                    message.display = DeviceDisplayField.internalBinaryRead(reader, reader.uint32(), options, message.display);
                    break;
                case /* optional string manufacturer */ 7:
                    message.manufacturer = reader.string();
                    break;
                case /* optional string sdk */ 8:
                    message.sdk = reader.string();
                    break;
                case /* optional string abi */ 9:
                    message.abi = reader.string();
                    break;
                case /* optional string cpuPlatform */ 10:
                    message.cpuPlatform = reader.string();
                    break;
                case /* optional string openGLESVersion */ 11:
                    message.openGLESVersion = reader.string();
                    break;
                case /* optional DevicePhoneField phone */ 12:
                    message.phone = DevicePhoneField.internalBinaryRead(reader, reader.uint32(), options, message.phone);
                    break;
                case /* optional DeviceProviderField provider */ 13:
                    message.provider = DeviceProviderField.internalBinaryRead(reader, reader.uint32(), options, message.provider);
                    break;
                case /* optional DeviceGroupField group */ 14:
                    message.group = DeviceGroupField.internalBinaryRead(reader, reader.uint32(), options, message.group);
                    break;
                case /* optional string marketName */ 15:
                    message.marketName = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* optional string model = 2; */
        if (message.model !== undefined)
            writer.tag(2, WireType.LengthDelimited).string(message.model);
        /* optional string version = 3; */
        if (message.version !== undefined)
            writer.tag(3, WireType.LengthDelimited).string(message.version);
        /* optional string operator = 4; */
        if (message.operator !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.operator);
        /* optional DeviceNetworkField network = 5; */
        if (message.network)
            DeviceNetworkField.internalBinaryWrite(message.network, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
        /* optional DeviceDisplayField display = 6; */
        if (message.display)
            DeviceDisplayField.internalBinaryWrite(message.display, writer.tag(6, WireType.LengthDelimited).fork(), options).join();
        /* optional string manufacturer = 7; */
        if (message.manufacturer !== undefined)
            writer.tag(7, WireType.LengthDelimited).string(message.manufacturer);
        /* optional string sdk = 8; */
        if (message.sdk !== undefined)
            writer.tag(8, WireType.LengthDelimited).string(message.sdk);
        /* optional string abi = 9; */
        if (message.abi !== undefined)
            writer.tag(9, WireType.LengthDelimited).string(message.abi);
        /* optional string cpuPlatform = 10; */
        if (message.cpuPlatform !== undefined)
            writer.tag(10, WireType.LengthDelimited).string(message.cpuPlatform);
        /* optional string openGLESVersion = 11; */
        if (message.openGLESVersion !== undefined)
            writer.tag(11, WireType.LengthDelimited).string(message.openGLESVersion);
        /* optional DevicePhoneField phone = 12; */
        if (message.phone)
            DevicePhoneField.internalBinaryWrite(message.phone, writer.tag(12, WireType.LengthDelimited).fork(), options).join();
        /* optional DeviceProviderField provider = 13; */
        if (message.provider)
            DeviceProviderField.internalBinaryWrite(message.provider, writer.tag(13, WireType.LengthDelimited).fork(), options).join();
        /* optional DeviceGroupField group = 14; */
        if (message.group)
            DeviceGroupField.internalBinaryWrite(message.group, writer.tag(14, WireType.LengthDelimited).fork(), options).join();
        /* optional string marketName = 15; */
        if (message.marketName !== undefined)
            writer.tag(15, WireType.LengthDelimited).string(message.marketName);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceField
 */
export const DeviceField = new DeviceField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceChangeMessage$Type extends MessageType {
    constructor() {
        super("DeviceChangeMessage", [
            { no: 1, name: "device", kind: "message", T: () => DeviceField },
            { no: 2, name: "action", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "oldOriginGroupId", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "timeStamp", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.action = "";
        message.oldOriginGroupId = "";
        message.timeStamp = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required DeviceField device */ 1:
                    message.device = DeviceField.internalBinaryRead(reader, reader.uint32(), options, message.device);
                    break;
                case /* required string action */ 2:
                    message.action = reader.string();
                    break;
                case /* required string oldOriginGroupId */ 3:
                    message.oldOriginGroupId = reader.string();
                    break;
                case /* required double timeStamp */ 4:
                    message.timeStamp = reader.double();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required DeviceField device = 1; */
        if (message.device)
            DeviceField.internalBinaryWrite(message.device, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        /* required string action = 2; */
        if (message.action !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.action);
        /* required string oldOriginGroupId = 3; */
        if (message.oldOriginGroupId !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.oldOriginGroupId);
        /* required double timeStamp = 4; */
        if (message.timeStamp !== 0)
            writer.tag(4, WireType.Bit64).double(message.timeStamp);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceChangeMessage
 */
export const DeviceChangeMessage = new DeviceChangeMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GroupDateField$Type extends MessageType {
    constructor() {
        super("GroupDateField", [
            { no: 1, name: "start", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "stop", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.start = "";
        message.stop = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string start */ 1:
                    message.start = reader.string();
                    break;
                case /* required string stop */ 2:
                    message.stop = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string start = 1; */
        if (message.start !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.start);
        /* required string stop = 2; */
        if (message.stop !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.stop);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GroupDateField
 */
export const GroupDateField = new GroupDateField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GroupOwnerField$Type extends MessageType {
    constructor() {
        super("GroupOwnerField", [
            { no: 1, name: "email", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.email = "";
        message.name = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string email */ 1:
                    message.email = reader.string();
                    break;
                case /* required string name */ 2:
                    message.name = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string email = 1; */
        if (message.email !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.email);
        /* required string name = 2; */
        if (message.name !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.name);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GroupOwnerField
 */
export const GroupOwnerField = new GroupOwnerField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GroupField$Type extends MessageType {
    constructor() {
        super("GroupField", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "class", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "privilege", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "owner", kind: "message", T: () => GroupOwnerField },
            { no: 6, name: "dates", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => GroupDateField },
            { no: 7, name: "duration", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 8, name: "repetitions", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 9, name: "devices", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 10, name: "users", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 11, name: "state", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 12, name: "isActive", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 13, name: "moderators", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = "";
        message.name = "";
        message.class = "";
        message.privilege = "";
        message.dates = [];
        message.duration = 0;
        message.repetitions = 0;
        message.devices = [];
        message.users = [];
        message.state = "";
        message.isActive = false;
        message.moderators = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string id */ 1:
                    message.id = reader.string();
                    break;
                case /* required string name */ 2:
                    message.name = reader.string();
                    break;
                case /* required string class */ 3:
                    message.class = reader.string();
                    break;
                case /* required string privilege */ 4:
                    message.privilege = reader.string();
                    break;
                case /* required GroupOwnerField owner */ 5:
                    message.owner = GroupOwnerField.internalBinaryRead(reader, reader.uint32(), options, message.owner);
                    break;
                case /* repeated GroupDateField dates */ 6:
                    message.dates.push(GroupDateField.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                case /* required uint32 duration */ 7:
                    message.duration = reader.uint32();
                    break;
                case /* required uint32 repetitions */ 8:
                    message.repetitions = reader.uint32();
                    break;
                case /* repeated string devices */ 9:
                    message.devices.push(reader.string());
                    break;
                case /* repeated string users */ 10:
                    message.users.push(reader.string());
                    break;
                case /* required string state */ 11:
                    message.state = reader.string();
                    break;
                case /* required bool isActive */ 12:
                    message.isActive = reader.bool();
                    break;
                case /* repeated string moderators */ 13:
                    message.moderators.push(reader.string());
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* required string name = 2; */
        if (message.name !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.name);
        /* required string class = 3; */
        if (message.class !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.class);
        /* required string privilege = 4; */
        if (message.privilege !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.privilege);
        /* required GroupOwnerField owner = 5; */
        if (message.owner)
            GroupOwnerField.internalBinaryWrite(message.owner, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
        /* repeated GroupDateField dates = 6; */
        for (let i = 0; i < message.dates.length; i++)
            GroupDateField.internalBinaryWrite(message.dates[i], writer.tag(6, WireType.LengthDelimited).fork(), options).join();
        /* required uint32 duration = 7; */
        if (message.duration !== 0)
            writer.tag(7, WireType.Varint).uint32(message.duration);
        /* required uint32 repetitions = 8; */
        if (message.repetitions !== 0)
            writer.tag(8, WireType.Varint).uint32(message.repetitions);
        /* repeated string devices = 9; */
        for (let i = 0; i < message.devices.length; i++)
            writer.tag(9, WireType.LengthDelimited).string(message.devices[i]);
        /* repeated string users = 10; */
        for (let i = 0; i < message.users.length; i++)
            writer.tag(10, WireType.LengthDelimited).string(message.users[i]);
        /* required string state = 11; */
        if (message.state !== "")
            writer.tag(11, WireType.LengthDelimited).string(message.state);
        /* required bool isActive = 12; */
        if (message.isActive !== false)
            writer.tag(12, WireType.Varint).bool(message.isActive);
        /* repeated string moderators = 13; */
        for (let i = 0; i < message.moderators.length; i++)
            writer.tag(13, WireType.LengthDelimited).string(message.moderators[i]);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GroupField
 */
export const GroupField = new GroupField$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GroupChangeMessage$Type extends MessageType {
    constructor() {
        super("GroupChangeMessage", [
            { no: 1, name: "group", kind: "message", T: () => GroupField },
            { no: 2, name: "action", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "subscribers", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "isChangedDates", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 5, name: "isChangedClass", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 6, name: "isAddedUser", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 7, name: "users", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 8, name: "isAddedDevice", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 9, name: "devices", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 10, name: "timeStamp", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.action = "";
        message.subscribers = [];
        message.isChangedDates = false;
        message.isChangedClass = false;
        message.isAddedUser = false;
        message.users = [];
        message.isAddedDevice = false;
        message.devices = [];
        message.timeStamp = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required GroupField group */ 1:
                    message.group = GroupField.internalBinaryRead(reader, reader.uint32(), options, message.group);
                    break;
                case /* required string action */ 2:
                    message.action = reader.string();
                    break;
                case /* repeated string subscribers */ 3:
                    message.subscribers.push(reader.string());
                    break;
                case /* required bool isChangedDates */ 4:
                    message.isChangedDates = reader.bool();
                    break;
                case /* required bool isChangedClass */ 5:
                    message.isChangedClass = reader.bool();
                    break;
                case /* required bool isAddedUser */ 6:
                    message.isAddedUser = reader.bool();
                    break;
                case /* repeated string users */ 7:
                    message.users.push(reader.string());
                    break;
                case /* required bool isAddedDevice */ 8:
                    message.isAddedDevice = reader.bool();
                    break;
                case /* repeated string devices */ 9:
                    message.devices.push(reader.string());
                    break;
                case /* required double timeStamp */ 10:
                    message.timeStamp = reader.double();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required GroupField group = 1; */
        if (message.group)
            GroupField.internalBinaryWrite(message.group, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        /* required string action = 2; */
        if (message.action !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.action);
        /* repeated string subscribers = 3; */
        for (let i = 0; i < message.subscribers.length; i++)
            writer.tag(3, WireType.LengthDelimited).string(message.subscribers[i]);
        /* required bool isChangedDates = 4; */
        if (message.isChangedDates !== false)
            writer.tag(4, WireType.Varint).bool(message.isChangedDates);
        /* required bool isChangedClass = 5; */
        if (message.isChangedClass !== false)
            writer.tag(5, WireType.Varint).bool(message.isChangedClass);
        /* required bool isAddedUser = 6; */
        if (message.isAddedUser !== false)
            writer.tag(6, WireType.Varint).bool(message.isAddedUser);
        /* repeated string users = 7; */
        for (let i = 0; i < message.users.length; i++)
            writer.tag(7, WireType.LengthDelimited).string(message.users[i]);
        /* required bool isAddedDevice = 8; */
        if (message.isAddedDevice !== false)
            writer.tag(8, WireType.Varint).bool(message.isAddedDevice);
        /* repeated string devices = 9; */
        for (let i = 0; i < message.devices.length; i++)
            writer.tag(9, WireType.LengthDelimited).string(message.devices[i]);
        /* required double timeStamp = 10; */
        if (message.timeStamp !== 0)
            writer.tag(10, WireType.Bit64).double(message.timeStamp);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GroupChangeMessage
 */
export const GroupChangeMessage = new GroupChangeMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceGroupChangeMessage$Type extends MessageType {
    constructor() {
        super("DeviceGroupChangeMessage", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "group", kind: "message", T: () => DeviceGroupMessage },
            { no: 3, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = "";
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string id */ 1:
                    message.id = reader.string();
                    break;
                case /* required DeviceGroupMessage group */ 2:
                    message.group = DeviceGroupMessage.internalBinaryRead(reader, reader.uint32(), options, message.group);
                    break;
                case /* required string serial */ 3:
                    message.serial = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* required DeviceGroupMessage group = 2; */
        if (message.group)
            DeviceGroupMessage.internalBinaryWrite(message.group, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        /* required string serial = 3; */
        if (message.serial !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.serial);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceGroupChangeMessage
 */
export const DeviceGroupChangeMessage = new DeviceGroupChangeMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GroupUserChangeMessage$Type extends MessageType {
    constructor() {
        super("GroupUserChangeMessage", [
            { no: 1, name: "users", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "isAdded", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 3, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "isDeletedLater", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 5, name: "devices", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.users = [];
        message.isAdded = false;
        message.id = "";
        message.isDeletedLater = false;
        message.devices = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated string users */ 1:
                    message.users.push(reader.string());
                    break;
                case /* required bool isAdded */ 2:
                    message.isAdded = reader.bool();
                    break;
                case /* required string id */ 3:
                    message.id = reader.string();
                    break;
                case /* required bool isDeletedLater */ 4:
                    message.isDeletedLater = reader.bool();
                    break;
                case /* repeated string devices */ 5:
                    message.devices.push(reader.string());
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* repeated string users = 1; */
        for (let i = 0; i < message.users.length; i++)
            writer.tag(1, WireType.LengthDelimited).string(message.users[i]);
        /* required bool isAdded = 2; */
        if (message.isAdded !== false)
            writer.tag(2, WireType.Varint).bool(message.isAdded);
        /* required string id = 3; */
        if (message.id !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.id);
        /* required bool isDeletedLater = 4; */
        if (message.isDeletedLater !== false)
            writer.tag(4, WireType.Varint).bool(message.isDeletedLater);
        /* repeated string devices = 5; */
        for (let i = 0; i < message.devices.length; i++)
            writer.tag(5, WireType.LengthDelimited).string(message.devices[i]);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GroupUserChangeMessage
 */
export const GroupUserChangeMessage = new GroupUserChangeMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ConnectStartedMessage$Type extends MessageType {
    constructor() {
        super("ConnectStartedMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "url", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.url = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required string url */ 2:
                    message.url = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required string url = 2; */
        if (message.url !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.url);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ConnectStartedMessage
 */
export const ConnectStartedMessage = new ConnectStartedMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class InstallResultMessage$Type extends MessageType {
    constructor() {
        super("InstallResultMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "result", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.result = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required string result */ 2:
                    message.result = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required string result = 2; */
        if (message.result !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.result);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message InstallResultMessage
 */
export const InstallResultMessage = new InstallResultMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ConnectStoppedMessage$Type extends MessageType {
    constructor() {
        super("ConnectStoppedMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ConnectStoppedMessage
 */
export const ConnectStoppedMessage = new ConnectStoppedMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class FileSystemListMessage$Type extends MessageType {
    constructor() {
        super("FileSystemListMessage", [
            { no: 1, name: "dir", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.dir = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string dir */ 1:
                    message.dir = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string dir = 1; */
        if (message.dir !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.dir);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message FileSystemListMessage
 */
export const FileSystemListMessage = new FileSystemListMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class FileSystemGetMessage$Type extends MessageType {
    constructor() {
        super("FileSystemGetMessage", [
            { no: 1, name: "file", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "jwt", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.file = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string file */ 1:
                    message.file = reader.string();
                    break;
                case /* optional string jwt */ 2:
                    message.jwt = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string file = 1; */
        if (message.file !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.file);
        /* optional string jwt = 2; */
        if (message.jwt !== undefined)
            writer.tag(2, WireType.LengthDelimited).string(message.jwt);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message FileSystemGetMessage
 */
export const FileSystemGetMessage = new FileSystemGetMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TransactionProgressMessage$Type extends MessageType {
    constructor() {
        super("TransactionProgressMessage", [
            { no: 1, name: "source", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "seq", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 3, name: "data", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "progress", kind: "scalar", opt: true, T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.source = "";
        message.seq = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string source */ 1:
                    message.source = reader.string();
                    break;
                case /* required uint32 seq */ 2:
                    message.seq = reader.uint32();
                    break;
                case /* optional string data */ 3:
                    message.data = reader.string();
                    break;
                case /* optional uint32 progress = 4 [default = 0] */ 4:
                    message.progress = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string source = 1; */
        if (message.source !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.source);
        /* required uint32 seq = 2; */
        if (message.seq !== 0)
            writer.tag(2, WireType.Varint).uint32(message.seq);
        /* optional string data = 3; */
        if (message.data !== undefined)
            writer.tag(3, WireType.LengthDelimited).string(message.data);
        /* optional uint32 progress = 4 [default = 0]; */
        if (message.progress !== undefined)
            writer.tag(4, WireType.Varint).uint32(message.progress);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TransactionProgressMessage
 */
export const TransactionProgressMessage = new TransactionProgressMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TransactionDoneMessage$Type extends MessageType {
    constructor() {
        super("TransactionDoneMessage", [
            { no: 1, name: "source", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "seq", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 3, name: "success", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 4, name: "data", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "body", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.source = "";
        message.seq = 0;
        message.success = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string source */ 1:
                    message.source = reader.string();
                    break;
                case /* required uint32 seq */ 2:
                    message.seq = reader.uint32();
                    break;
                case /* required bool success */ 3:
                    message.success = reader.bool();
                    break;
                case /* optional string data */ 4:
                    message.data = reader.string();
                    break;
                case /* optional string body */ 5:
                    message.body = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string source = 1; */
        if (message.source !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.source);
        /* required uint32 seq = 2; */
        if (message.seq !== 0)
            writer.tag(2, WireType.Varint).uint32(message.seq);
        /* required bool success = 3; */
        if (message.success !== false)
            writer.tag(3, WireType.Varint).bool(message.success);
        /* optional string data = 4; */
        if (message.data !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.data);
        /* optional string body = 5; */
        if (message.body !== undefined)
            writer.tag(5, WireType.LengthDelimited).string(message.body);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TransactionDoneMessage
 */
export const TransactionDoneMessage = new TransactionDoneMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TransactionTreeMessage$Type extends MessageType {
    constructor() {
        super("TransactionTreeMessage", [
            { no: 1, name: "source", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "seq", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 3, name: "success", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 4, name: "data", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "body", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.source = "";
        message.seq = 0;
        message.success = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string source */ 1:
                    message.source = reader.string();
                    break;
                case /* required uint32 seq */ 2:
                    message.seq = reader.uint32();
                    break;
                case /* required bool success */ 3:
                    message.success = reader.bool();
                    break;
                case /* optional string data */ 4:
                    message.data = reader.string();
                    break;
                case /* optional string body */ 5:
                    message.body = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string source = 1; */
        if (message.source !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.source);
        /* required uint32 seq = 2; */
        if (message.seq !== 0)
            writer.tag(2, WireType.Varint).uint32(message.seq);
        /* required bool success = 3; */
        if (message.success !== false)
            writer.tag(3, WireType.Varint).bool(message.success);
        /* optional string data = 4; */
        if (message.data !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.data);
        /* optional string body = 5; */
        if (message.body !== undefined)
            writer.tag(5, WireType.LengthDelimited).string(message.body);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TransactionTreeMessage
 */
export const TransactionTreeMessage = new TransactionTreeMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceLogMessage$Type extends MessageType {
    constructor() {
        super("DeviceLogMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "timestamp", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 3, name: "priority", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 4, name: "tag", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "pid", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 6, name: "message", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 7, name: "identifier", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.timestamp = 0;
        message.priority = 0;
        message.tag = "";
        message.pid = 0;
        message.message = "";
        message.identifier = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required double timestamp */ 2:
                    message.timestamp = reader.double();
                    break;
                case /* required uint32 priority */ 3:
                    message.priority = reader.uint32();
                    break;
                case /* required string tag */ 4:
                    message.tag = reader.string();
                    break;
                case /* required uint32 pid */ 5:
                    message.pid = reader.uint32();
                    break;
                case /* required string message */ 6:
                    message.message = reader.string();
                    break;
                case /* required string identifier */ 7:
                    message.identifier = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required double timestamp = 2; */
        if (message.timestamp !== 0)
            writer.tag(2, WireType.Bit64).double(message.timestamp);
        /* required uint32 priority = 3; */
        if (message.priority !== 0)
            writer.tag(3, WireType.Varint).uint32(message.priority);
        /* required string tag = 4; */
        if (message.tag !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.tag);
        /* required uint32 pid = 5; */
        if (message.pid !== 0)
            writer.tag(5, WireType.Varint).uint32(message.pid);
        /* required string message = 6; */
        if (message.message !== "")
            writer.tag(6, WireType.LengthDelimited).string(message.message);
        /* required string identifier = 7; */
        if (message.identifier !== "")
            writer.tag(7, WireType.LengthDelimited).string(message.identifier);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceLogMessage
 */
export const DeviceLogMessage = new DeviceLogMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceGroupOwnerMessage$Type extends MessageType {
    constructor() {
        super("DeviceGroupOwnerMessage", [
            { no: 1, name: "email", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.email = "";
        message.name = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string email */ 1:
                    message.email = reader.string();
                    break;
                case /* required string name */ 2:
                    message.name = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string email = 1; */
        if (message.email !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.email);
        /* required string name = 2; */
        if (message.name !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.name);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceGroupOwnerMessage
 */
export const DeviceGroupOwnerMessage = new DeviceGroupOwnerMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceGroupLifetimeMessage$Type extends MessageType {
    constructor() {
        super("DeviceGroupLifetimeMessage", [
            { no: 1, name: "start", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 2, name: "stop", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.start = 0;
        message.stop = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required double start */ 1:
                    message.start = reader.double();
                    break;
                case /* required double stop */ 2:
                    message.stop = reader.double();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required double start = 1; */
        if (message.start !== 0)
            writer.tag(1, WireType.Bit64).double(message.start);
        /* required double stop = 2; */
        if (message.stop !== 0)
            writer.tag(2, WireType.Bit64).double(message.stop);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceGroupLifetimeMessage
 */
export const DeviceGroupLifetimeMessage = new DeviceGroupLifetimeMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceGroupMessage$Type extends MessageType {
    constructor() {
        super("DeviceGroupMessage", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "owner", kind: "message", T: () => DeviceGroupOwnerMessage },
            { no: 4, name: "lifeTime", kind: "message", T: () => DeviceGroupLifetimeMessage },
            { no: 5, name: "class", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 6, name: "repetitions", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 7, name: "originName", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = "";
        message.name = "";
        message.class = "";
        message.repetitions = 0;
        message.originName = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string id */ 1:
                    message.id = reader.string();
                    break;
                case /* required string name */ 2:
                    message.name = reader.string();
                    break;
                case /* required DeviceGroupOwnerMessage owner */ 3:
                    message.owner = DeviceGroupOwnerMessage.internalBinaryRead(reader, reader.uint32(), options, message.owner);
                    break;
                case /* required DeviceGroupLifetimeMessage lifeTime */ 4:
                    message.lifeTime = DeviceGroupLifetimeMessage.internalBinaryRead(reader, reader.uint32(), options, message.lifeTime);
                    break;
                case /* required string class */ 5:
                    message.class = reader.string();
                    break;
                case /* required uint32 repetitions */ 6:
                    message.repetitions = reader.uint32();
                    break;
                case /* required string originName */ 7:
                    message.originName = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* required string name = 2; */
        if (message.name !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.name);
        /* required DeviceGroupOwnerMessage owner = 3; */
        if (message.owner)
            DeviceGroupOwnerMessage.internalBinaryWrite(message.owner, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        /* required DeviceGroupLifetimeMessage lifeTime = 4; */
        if (message.lifeTime)
            DeviceGroupLifetimeMessage.internalBinaryWrite(message.lifeTime, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
        /* required string class = 5; */
        if (message.class !== "")
            writer.tag(5, WireType.LengthDelimited).string(message.class);
        /* required uint32 repetitions = 6; */
        if (message.repetitions !== 0)
            writer.tag(6, WireType.Varint).uint32(message.repetitions);
        /* required string originName = 7; */
        if (message.originName !== "")
            writer.tag(7, WireType.LengthDelimited).string(message.originName);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceGroupMessage
 */
export const DeviceGroupMessage = new DeviceGroupMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ProviderMessage$Type extends MessageType {
    constructor() {
        super("ProviderMessage", [
            { no: 1, name: "channel", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.channel = "";
        message.name = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string channel */ 1:
                    message.channel = reader.string();
                    break;
                case /* required string name */ 2:
                    message.name = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string channel = 1; */
        if (message.channel !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.channel);
        /* required string name = 2; */
        if (message.name !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.name);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ProviderMessage
 */
export const ProviderMessage = new ProviderMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ProviderIosMessage$Type extends MessageType {
    constructor() {
        super("ProviderIosMessage", [
            { no: 1, name: "channel", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "screenWsUrlPattern", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.channel = "";
        message.name = "";
        message.screenWsUrlPattern = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string channel */ 1:
                    message.channel = reader.string();
                    break;
                case /* required string name */ 2:
                    message.name = reader.string();
                    break;
                case /* required string screenWsUrlPattern */ 3:
                    message.screenWsUrlPattern = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string channel = 1; */
        if (message.channel !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.channel);
        /* required string name = 2; */
        if (message.name !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.name);
        /* required string screenWsUrlPattern = 3; */
        if (message.screenWsUrlPattern !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.screenWsUrlPattern);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ProviderIosMessage
 */
export const ProviderIosMessage = new ProviderIosMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceHeartbeatMessage$Type extends MessageType {
    constructor() {
        super("DeviceHeartbeatMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceHeartbeatMessage
 */
export const DeviceHeartbeatMessage = new DeviceHeartbeatMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceIntroductionMessage$Type extends MessageType {
    constructor() {
        super("DeviceIntroductionMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "status", kind: "enum", T: () => ["DeviceStatus", DeviceStatus] },
            { no: 3, name: "provider", kind: "message", T: () => ProviderMessage },
            { no: 4, name: "deviceType", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.status = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required DeviceStatus status */ 2:
                    message.status = reader.int32();
                    break;
                case /* required ProviderMessage provider */ 3:
                    message.provider = ProviderMessage.internalBinaryRead(reader, reader.uint32(), options, message.provider);
                    break;
                case /* optional string deviceType */ 4:
                    message.deviceType = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required DeviceStatus status = 2; */
        if (message.status !== 0)
            writer.tag(2, WireType.Varint).int32(message.status);
        /* required ProviderMessage provider = 3; */
        if (message.provider)
            ProviderMessage.internalBinaryWrite(message.provider, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        /* optional string deviceType = 4; */
        if (message.deviceType !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.deviceType);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceIntroductionMessage
 */
export const DeviceIntroductionMessage = new DeviceIntroductionMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceIosIntroductionMessage$Type extends MessageType {
    constructor() {
        super("DeviceIosIntroductionMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "status", kind: "enum", T: () => ["DeviceStatus", DeviceStatus] },
            { no: 3, name: "provider", kind: "message", T: () => ProviderMessage }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.status = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required DeviceStatus status */ 2:
                    message.status = reader.int32();
                    break;
                case /* required ProviderMessage provider */ 3:
                    message.provider = ProviderMessage.internalBinaryRead(reader, reader.uint32(), options, message.provider);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required DeviceStatus status = 2; */
        if (message.status !== 0)
            writer.tag(2, WireType.Varint).int32(message.status);
        /* required ProviderMessage provider = 3; */
        if (message.provider)
            ProviderMessage.internalBinaryWrite(message.provider, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceIosIntroductionMessage
 */
export const DeviceIosIntroductionMessage = new DeviceIosIntroductionMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class InitializeIosDeviceState$Type extends MessageType {
    constructor() {
        super("InitializeIosDeviceState", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "status", kind: "enum", T: () => ["DeviceStatus", DeviceStatus] },
            { no: 3, name: "provider", kind: "message", T: () => ProviderIosMessage },
            { no: 4, name: "ports", kind: "message", T: () => IosDevicePorts },
            { no: 5, name: "options", kind: "message", T: () => UpdateIosDevice }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.status = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required DeviceStatus status */ 2:
                    message.status = reader.int32();
                    break;
                case /* required ProviderIosMessage provider */ 3:
                    message.provider = ProviderIosMessage.internalBinaryRead(reader, reader.uint32(), options, message.provider);
                    break;
                case /* required IosDevicePorts ports */ 4:
                    message.ports = IosDevicePorts.internalBinaryRead(reader, reader.uint32(), options, message.ports);
                    break;
                case /* required UpdateIosDevice options */ 5:
                    message.options = UpdateIosDevice.internalBinaryRead(reader, reader.uint32(), options, message.options);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required DeviceStatus status = 2; */
        if (message.status !== 0)
            writer.tag(2, WireType.Varint).int32(message.status);
        /* required ProviderIosMessage provider = 3; */
        if (message.provider)
            ProviderIosMessage.internalBinaryWrite(message.provider, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        /* required IosDevicePorts ports = 4; */
        if (message.ports)
            IosDevicePorts.internalBinaryWrite(message.ports, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
        /* required UpdateIosDevice options = 5; */
        if (message.options)
            UpdateIosDevice.internalBinaryWrite(message.options, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message InitializeIosDeviceState
 */
export const InitializeIosDeviceState = new InitializeIosDeviceState$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceRegisteredMessage$Type extends MessageType {
    constructor() {
        super("DeviceRegisteredMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceRegisteredMessage
 */
export const DeviceRegisteredMessage = new DeviceRegisteredMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DevicePresentMessage$Type extends MessageType {
    constructor() {
        super("DevicePresentMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DevicePresentMessage
 */
export const DevicePresentMessage = new DevicePresentMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceAbsentMessage$Type extends MessageType {
    constructor() {
        super("DeviceAbsentMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceAbsentMessage
 */
export const DeviceAbsentMessage = new DeviceAbsentMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceReadyMessage$Type extends MessageType {
    constructor() {
        super("DeviceReadyMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "channel", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.channel = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required string channel */ 2:
                    message.channel = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required string channel = 2; */
        if (message.channel !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.channel);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceReadyMessage
 */
export const DeviceReadyMessage = new DeviceReadyMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ProbeMessage$Type extends MessageType {
    constructor() {
        super("ProbeMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ProbeMessage
 */
export const ProbeMessage = new ProbeMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceStatusMessage$Type extends MessageType {
    constructor() {
        super("DeviceStatusMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "status", kind: "enum", T: () => ["DeviceStatus", DeviceStatus] }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.status = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required DeviceStatus status */ 2:
                    message.status = reader.int32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required DeviceStatus status = 2; */
        if (message.status !== 0)
            writer.tag(2, WireType.Varint).int32(message.status);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceStatusMessage
 */
export const DeviceStatusMessage = new DeviceStatusMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceTypeMessage$Type extends MessageType {
    constructor() {
        super("DeviceTypeMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "type", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.type = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required string type */ 2:
                    message.type = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required string type = 2; */
        if (message.type !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.type);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceTypeMessage
 */
export const DeviceTypeMessage = new DeviceTypeMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceDisplayMessage$Type extends MessageType {
    constructor() {
        super("DeviceDisplayMessage", [
            { no: 1, name: "id", kind: "scalar", T: 5 /*ScalarType.INT32*/ },
            { no: 2, name: "width", kind: "scalar", T: 5 /*ScalarType.INT32*/ },
            { no: 3, name: "height", kind: "scalar", T: 5 /*ScalarType.INT32*/ },
            { no: 4, name: "rotation", kind: "scalar", T: 5 /*ScalarType.INT32*/ },
            { no: 5, name: "xdpi", kind: "scalar", T: 2 /*ScalarType.FLOAT*/ },
            { no: 6, name: "ydpi", kind: "scalar", T: 2 /*ScalarType.FLOAT*/ },
            { no: 7, name: "fps", kind: "scalar", T: 2 /*ScalarType.FLOAT*/ },
            { no: 8, name: "density", kind: "scalar", T: 2 /*ScalarType.FLOAT*/ },
            { no: 9, name: "secure", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 10, name: "url", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 11, name: "size", kind: "scalar", opt: true, T: 2 /*ScalarType.FLOAT*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = 0;
        message.width = 0;
        message.height = 0;
        message.rotation = 0;
        message.xdpi = 0;
        message.ydpi = 0;
        message.fps = 0;
        message.density = 0;
        message.secure = false;
        message.url = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required int32 id */ 1:
                    message.id = reader.int32();
                    break;
                case /* required int32 width */ 2:
                    message.width = reader.int32();
                    break;
                case /* required int32 height */ 3:
                    message.height = reader.int32();
                    break;
                case /* required int32 rotation */ 4:
                    message.rotation = reader.int32();
                    break;
                case /* required float xdpi */ 5:
                    message.xdpi = reader.float();
                    break;
                case /* required float ydpi */ 6:
                    message.ydpi = reader.float();
                    break;
                case /* required float fps */ 7:
                    message.fps = reader.float();
                    break;
                case /* required float density */ 8:
                    message.density = reader.float();
                    break;
                case /* required bool secure */ 9:
                    message.secure = reader.bool();
                    break;
                case /* required string url */ 10:
                    message.url = reader.string();
                    break;
                case /* optional float size */ 11:
                    message.size = reader.float();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required int32 id = 1; */
        if (message.id !== 0)
            writer.tag(1, WireType.Varint).int32(message.id);
        /* required int32 width = 2; */
        if (message.width !== 0)
            writer.tag(2, WireType.Varint).int32(message.width);
        /* required int32 height = 3; */
        if (message.height !== 0)
            writer.tag(3, WireType.Varint).int32(message.height);
        /* required int32 rotation = 4; */
        if (message.rotation !== 0)
            writer.tag(4, WireType.Varint).int32(message.rotation);
        /* required float xdpi = 5; */
        if (message.xdpi !== 0)
            writer.tag(5, WireType.Bit32).float(message.xdpi);
        /* required float ydpi = 6; */
        if (message.ydpi !== 0)
            writer.tag(6, WireType.Bit32).float(message.ydpi);
        /* required float fps = 7; */
        if (message.fps !== 0)
            writer.tag(7, WireType.Bit32).float(message.fps);
        /* required float density = 8; */
        if (message.density !== 0)
            writer.tag(8, WireType.Bit32).float(message.density);
        /* required bool secure = 9; */
        if (message.secure !== false)
            writer.tag(9, WireType.Varint).bool(message.secure);
        /* required string url = 10; */
        if (message.url !== "")
            writer.tag(10, WireType.LengthDelimited).string(message.url);
        /* optional float size = 11; */
        if (message.size !== undefined)
            writer.tag(11, WireType.Bit32).float(message.size);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceDisplayMessage
 */
export const DeviceDisplayMessage = new DeviceDisplayMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceBrowserAppMessage$Type extends MessageType {
    constructor() {
        super("DeviceBrowserAppMessage", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "type", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "selected", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 5, name: "system", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = "";
        message.type = "";
        message.name = "";
        message.selected = false;
        message.system = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string id */ 1:
                    message.id = reader.string();
                    break;
                case /* required string type */ 2:
                    message.type = reader.string();
                    break;
                case /* required string name */ 3:
                    message.name = reader.string();
                    break;
                case /* required bool selected */ 4:
                    message.selected = reader.bool();
                    break;
                case /* required bool system */ 5:
                    message.system = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* required string type = 2; */
        if (message.type !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.type);
        /* required string name = 3; */
        if (message.name !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.name);
        /* required bool selected = 4; */
        if (message.selected !== false)
            writer.tag(4, WireType.Varint).bool(message.selected);
        /* required bool system = 5; */
        if (message.system !== false)
            writer.tag(5, WireType.Varint).bool(message.system);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceBrowserAppMessage
 */
export const DeviceBrowserAppMessage = new DeviceBrowserAppMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceBrowserMessage$Type extends MessageType {
    constructor() {
        super("DeviceBrowserMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "selected", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 3, name: "apps", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => DeviceBrowserAppMessage }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.selected = false;
        message.apps = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required bool selected */ 2:
                    message.selected = reader.bool();
                    break;
                case /* repeated DeviceBrowserAppMessage apps */ 3:
                    message.apps.push(DeviceBrowserAppMessage.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required bool selected = 2; */
        if (message.selected !== false)
            writer.tag(2, WireType.Varint).bool(message.selected);
        /* repeated DeviceBrowserAppMessage apps = 3; */
        for (let i = 0; i < message.apps.length; i++)
            DeviceBrowserAppMessage.internalBinaryWrite(message.apps[i], writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceBrowserMessage
 */
export const DeviceBrowserMessage = new DeviceBrowserMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetServicesAvailabilityMessage$Type extends MessageType {
    constructor() {
        super("GetServicesAvailabilityMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "hasGMS", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 3, name: "hasHMS", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.hasGMS = false;
        message.hasHMS = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required bool hasGMS */ 2:
                    message.hasGMS = reader.bool();
                    break;
                case /* required bool hasHMS */ 3:
                    message.hasHMS = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required bool hasGMS = 2; */
        if (message.hasGMS !== false)
            writer.tag(2, WireType.Varint).bool(message.hasGMS);
        /* required bool hasHMS = 3; */
        if (message.hasHMS !== false)
            writer.tag(3, WireType.Varint).bool(message.hasHMS);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetServicesAvailabilityMessage
 */
export const GetServicesAvailabilityMessage = new GetServicesAvailabilityMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DevicePhoneMessage$Type extends MessageType {
    constructor() {
        super("DevicePhoneMessage", [
            { no: 1, name: "imei", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "imsi", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "phoneNumber", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "iccid", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "network", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* optional string imei */ 1:
                    message.imei = reader.string();
                    break;
                case /* optional string imsi */ 5:
                    message.imsi = reader.string();
                    break;
                case /* optional string phoneNumber */ 2:
                    message.phoneNumber = reader.string();
                    break;
                case /* optional string iccid */ 3:
                    message.iccid = reader.string();
                    break;
                case /* optional string network */ 4:
                    message.network = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* optional string imei = 1; */
        if (message.imei !== undefined)
            writer.tag(1, WireType.LengthDelimited).string(message.imei);
        /* optional string phoneNumber = 2; */
        if (message.phoneNumber !== undefined)
            writer.tag(2, WireType.LengthDelimited).string(message.phoneNumber);
        /* optional string iccid = 3; */
        if (message.iccid !== undefined)
            writer.tag(3, WireType.LengthDelimited).string(message.iccid);
        /* optional string network = 4; */
        if (message.network !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.network);
        /* optional string imsi = 5; */
        if (message.imsi !== undefined)
            writer.tag(5, WireType.LengthDelimited).string(message.imsi);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DevicePhoneMessage
 */
export const DevicePhoneMessage = new DevicePhoneMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceIdentityMessage$Type extends MessageType {
    constructor() {
        super("DeviceIdentityMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "platform", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "manufacturer", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "operator", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "model", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 6, name: "version", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 7, name: "abi", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 8, name: "sdk", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 9, name: "display", kind: "message", T: () => DeviceDisplayMessage },
            { no: 11, name: "phone", kind: "message", T: () => DevicePhoneMessage },
            { no: 12, name: "product", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 13, name: "cpuPlatform", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 14, name: "openGLESVersion", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 15, name: "marketName", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 16, name: "macAddress", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 17, name: "ram", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.platform = "";
        message.manufacturer = "";
        message.model = "";
        message.version = "";
        message.abi = "";
        message.sdk = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required string platform */ 2:
                    message.platform = reader.string();
                    break;
                case /* required string manufacturer */ 3:
                    message.manufacturer = reader.string();
                    break;
                case /* optional string operator */ 4:
                    message.operator = reader.string();
                    break;
                case /* required string model */ 5:
                    message.model = reader.string();
                    break;
                case /* required string version */ 6:
                    message.version = reader.string();
                    break;
                case /* required string abi */ 7:
                    message.abi = reader.string();
                    break;
                case /* required string sdk */ 8:
                    message.sdk = reader.string();
                    break;
                case /* required DeviceDisplayMessage display */ 9:
                    message.display = DeviceDisplayMessage.internalBinaryRead(reader, reader.uint32(), options, message.display);
                    break;
                case /* required DevicePhoneMessage phone */ 11:
                    message.phone = DevicePhoneMessage.internalBinaryRead(reader, reader.uint32(), options, message.phone);
                    break;
                case /* optional string product */ 12:
                    message.product = reader.string();
                    break;
                case /* optional string cpuPlatform */ 13:
                    message.cpuPlatform = reader.string();
                    break;
                case /* optional string openGLESVersion */ 14:
                    message.openGLESVersion = reader.string();
                    break;
                case /* optional string marketName */ 15:
                    message.marketName = reader.string();
                    break;
                case /* optional string macAddress */ 16:
                    message.macAddress = reader.string();
                    break;
                case /* optional string ram */ 17:
                    message.ram = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required string platform = 2; */
        if (message.platform !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.platform);
        /* required string manufacturer = 3; */
        if (message.manufacturer !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.manufacturer);
        /* optional string operator = 4; */
        if (message.operator !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.operator);
        /* required string model = 5; */
        if (message.model !== "")
            writer.tag(5, WireType.LengthDelimited).string(message.model);
        /* required string version = 6; */
        if (message.version !== "")
            writer.tag(6, WireType.LengthDelimited).string(message.version);
        /* required string abi = 7; */
        if (message.abi !== "")
            writer.tag(7, WireType.LengthDelimited).string(message.abi);
        /* required string sdk = 8; */
        if (message.sdk !== "")
            writer.tag(8, WireType.LengthDelimited).string(message.sdk);
        /* required DeviceDisplayMessage display = 9; */
        if (message.display)
            DeviceDisplayMessage.internalBinaryWrite(message.display, writer.tag(9, WireType.LengthDelimited).fork(), options).join();
        /* required DevicePhoneMessage phone = 11; */
        if (message.phone)
            DevicePhoneMessage.internalBinaryWrite(message.phone, writer.tag(11, WireType.LengthDelimited).fork(), options).join();
        /* optional string product = 12; */
        if (message.product !== undefined)
            writer.tag(12, WireType.LengthDelimited).string(message.product);
        /* optional string cpuPlatform = 13; */
        if (message.cpuPlatform !== undefined)
            writer.tag(13, WireType.LengthDelimited).string(message.cpuPlatform);
        /* optional string openGLESVersion = 14; */
        if (message.openGLESVersion !== undefined)
            writer.tag(14, WireType.LengthDelimited).string(message.openGLESVersion);
        /* optional string marketName = 15; */
        if (message.marketName !== undefined)
            writer.tag(15, WireType.LengthDelimited).string(message.marketName);
        /* optional string macAddress = 16; */
        if (message.macAddress !== undefined)
            writer.tag(16, WireType.LengthDelimited).string(message.macAddress);
        /* optional string ram = 17; */
        if (message.ram !== undefined)
            writer.tag(17, WireType.LengthDelimited).string(message.ram);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceIdentityMessage
 */
export const DeviceIdentityMessage = new DeviceIdentityMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceProperty$Type extends MessageType {
    constructor() {
        super("DeviceProperty", [
            { no: 1, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "value", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.name = "";
        message.value = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string name */ 1:
                    message.name = reader.string();
                    break;
                case /* required string value */ 2:
                    message.value = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string name = 1; */
        if (message.name !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.name);
        /* required string value = 2; */
        if (message.value !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.value);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceProperty
 */
export const DeviceProperty = new DeviceProperty$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DevicePropertiesMessage$Type extends MessageType {
    constructor() {
        super("DevicePropertiesMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "properties", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => DeviceProperty }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.properties = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* repeated DeviceProperty properties */ 2:
                    message.properties.push(DeviceProperty.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* repeated DeviceProperty properties = 2; */
        for (let i = 0; i < message.properties.length; i++)
            DeviceProperty.internalBinaryWrite(message.properties[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DevicePropertiesMessage
 */
export const DevicePropertiesMessage = new DevicePropertiesMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceRequirement$Type extends MessageType {
    constructor() {
        super("DeviceRequirement", [
            { no: 1, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "value", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "type", kind: "enum", T: () => ["RequirementType", RequirementType] }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.name = "";
        message.value = "";
        message.type = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string name */ 1:
                    message.name = reader.string();
                    break;
                case /* required string value */ 2:
                    message.value = reader.string();
                    break;
                case /* required RequirementType type */ 3:
                    message.type = reader.int32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string name = 1; */
        if (message.name !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.name);
        /* required string value = 2; */
        if (message.value !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.value);
        /* required RequirementType type = 3; */
        if (message.type !== 0)
            writer.tag(3, WireType.Varint).int32(message.type);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceRequirement
 */
export const DeviceRequirement = new DeviceRequirement$Type();
// @generated message type with reflection information, may provide speed optimized methods
class OwnerMessage$Type extends MessageType {
    constructor() {
        super("OwnerMessage", [
            { no: 1, name: "email", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "group", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.email = "";
        message.name = "";
        message.group = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string email */ 1:
                    message.email = reader.string();
                    break;
                case /* required string name */ 2:
                    message.name = reader.string();
                    break;
                case /* required string group */ 3:
                    message.group = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string email = 1; */
        if (message.email !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.email);
        /* required string name = 2; */
        if (message.name !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.name);
        /* required string group = 3; */
        if (message.group !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.group);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message OwnerMessage
 */
export const OwnerMessage = new OwnerMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GroupMessage$Type extends MessageType {
    constructor() {
        super("GroupMessage", [
            { no: 1, name: "owner", kind: "message", T: () => OwnerMessage },
            { no: 2, name: "timeout", kind: "scalar", opt: true, T: 13 /*ScalarType.UINT32*/ },
            { no: 3, name: "requirements", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => DeviceRequirement },
            { no: 4, name: "usage", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "keys", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.requirements = [];
        message.keys = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required OwnerMessage owner */ 1:
                    message.owner = OwnerMessage.internalBinaryRead(reader, reader.uint32(), options, message.owner);
                    break;
                case /* optional uint32 timeout */ 2:
                    message.timeout = reader.uint32();
                    break;
                case /* repeated DeviceRequirement requirements */ 3:
                    message.requirements.push(DeviceRequirement.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                case /* optional string usage */ 4:
                    message.usage = reader.string();
                    break;
                case /* repeated string keys */ 5:
                    message.keys.push(reader.string());
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required OwnerMessage owner = 1; */
        if (message.owner)
            OwnerMessage.internalBinaryWrite(message.owner, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        /* optional uint32 timeout = 2; */
        if (message.timeout !== undefined)
            writer.tag(2, WireType.Varint).uint32(message.timeout);
        /* repeated DeviceRequirement requirements = 3; */
        for (let i = 0; i < message.requirements.length; i++)
            DeviceRequirement.internalBinaryWrite(message.requirements[i], writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        /* optional string usage = 4; */
        if (message.usage !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.usage);
        /* repeated string keys = 5; */
        for (let i = 0; i < message.keys.length; i++)
            writer.tag(5, WireType.LengthDelimited).string(message.keys[i]);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GroupMessage
 */
export const GroupMessage = new GroupMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AutoGroupMessage$Type extends MessageType {
    constructor() {
        super("AutoGroupMessage", [
            { no: 1, name: "owner", kind: "message", T: () => OwnerMessage },
            { no: 2, name: "identifier", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.identifier = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required OwnerMessage owner */ 1:
                    message.owner = OwnerMessage.internalBinaryRead(reader, reader.uint32(), options, message.owner);
                    break;
                case /* required string identifier */ 2:
                    message.identifier = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required OwnerMessage owner = 1; */
        if (message.owner)
            OwnerMessage.internalBinaryWrite(message.owner, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        /* required string identifier = 2; */
        if (message.identifier !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.identifier);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message AutoGroupMessage
 */
export const AutoGroupMessage = new AutoGroupMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UngroupMessage$Type extends MessageType {
    constructor() {
        super("UngroupMessage", [
            { no: 2, name: "requirements", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => DeviceRequirement }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.requirements = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated DeviceRequirement requirements */ 2:
                    message.requirements.push(DeviceRequirement.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* repeated DeviceRequirement requirements = 2; */
        for (let i = 0; i < message.requirements.length; i++)
            DeviceRequirement.internalBinaryWrite(message.requirements[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UngroupMessage
 */
export const UngroupMessage = new UngroupMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class JoinGroupMessage$Type extends MessageType {
    constructor() {
        super("JoinGroupMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "owner", kind: "message", T: () => OwnerMessage },
            { no: 3, name: "usage", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "timeout", kind: "scalar", opt: true, T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required OwnerMessage owner */ 2:
                    message.owner = OwnerMessage.internalBinaryRead(reader, reader.uint32(), options, message.owner);
                    break;
                case /* optional string usage */ 3:
                    message.usage = reader.string();
                    break;
                case /* optional uint32 timeout */ 4:
                    message.timeout = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required OwnerMessage owner = 2; */
        if (message.owner)
            OwnerMessage.internalBinaryWrite(message.owner, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        /* optional string usage = 3; */
        if (message.usage !== undefined)
            writer.tag(3, WireType.LengthDelimited).string(message.usage);
        /* optional uint32 timeout = 4; */
        if (message.timeout !== undefined)
            writer.tag(4, WireType.Varint).uint32(message.timeout);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message JoinGroupMessage
 */
export const JoinGroupMessage = new JoinGroupMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class JoinGroupByAdbFingerprintMessage$Type extends MessageType {
    constructor() {
        super("JoinGroupByAdbFingerprintMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "fingerprint", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "comment", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "currentGroup", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.fingerprint = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required string fingerprint */ 2:
                    message.fingerprint = reader.string();
                    break;
                case /* optional string comment */ 3:
                    message.comment = reader.string();
                    break;
                case /* optional string currentGroup */ 4:
                    message.currentGroup = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required string fingerprint = 2; */
        if (message.fingerprint !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.fingerprint);
        /* optional string comment = 3; */
        if (message.comment !== undefined)
            writer.tag(3, WireType.LengthDelimited).string(message.comment);
        /* optional string currentGroup = 4; */
        if (message.currentGroup !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.currentGroup);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message JoinGroupByAdbFingerprintMessage
 */
export const JoinGroupByAdbFingerprintMessage = new JoinGroupByAdbFingerprintMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class JoinGroupByVncAuthResponseMessage$Type extends MessageType {
    constructor() {
        super("JoinGroupByVncAuthResponseMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "response", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "currentGroup", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.response = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required string response */ 2:
                    message.response = reader.string();
                    break;
                case /* optional string currentGroup */ 4:
                    message.currentGroup = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required string response = 2; */
        if (message.response !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.response);
        /* optional string currentGroup = 4; */
        if (message.currentGroup !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.currentGroup);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message JoinGroupByVncAuthResponseMessage
 */
export const JoinGroupByVncAuthResponseMessage = new JoinGroupByVncAuthResponseMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AdbKeysUpdatedMessage$Type extends MessageType {
    constructor() {
        super("AdbKeysUpdatedMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message AdbKeysUpdatedMessage
 */
export const AdbKeysUpdatedMessage = new AdbKeysUpdatedMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class VncAuthResponsesUpdatedMessage$Type extends MessageType {
    constructor() {
        super("VncAuthResponsesUpdatedMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message VncAuthResponsesUpdatedMessage
 */
export const VncAuthResponsesUpdatedMessage = new VncAuthResponsesUpdatedMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class LeaveGroupMessage$Type extends MessageType {
    constructor() {
        super("LeaveGroupMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "owner", kind: "message", T: () => OwnerMessage },
            { no: 3, name: "reason", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.reason = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required OwnerMessage owner */ 2:
                    message.owner = OwnerMessage.internalBinaryRead(reader, reader.uint32(), options, message.owner);
                    break;
                case /* required string reason */ 3:
                    message.reason = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required OwnerMessage owner = 2; */
        if (message.owner)
            OwnerMessage.internalBinaryWrite(message.owner, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        /* required string reason = 3; */
        if (message.reason !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.reason);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message LeaveGroupMessage
 */
export const LeaveGroupMessage = new LeaveGroupMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class PhysicalIdentifyMessage$Type extends MessageType {
    constructor() {
        super("PhysicalIdentifyMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message PhysicalIdentifyMessage
 */
export const PhysicalIdentifyMessage = new PhysicalIdentifyMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TouchDownMessage$Type extends MessageType {
    constructor() {
        super("TouchDownMessage", [
            { no: 1, name: "seq", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 2, name: "contact", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 3, name: "x", kind: "scalar", T: 2 /*ScalarType.FLOAT*/ },
            { no: 4, name: "y", kind: "scalar", T: 2 /*ScalarType.FLOAT*/ },
            { no: 5, name: "pressure", kind: "scalar", opt: true, T: 2 /*ScalarType.FLOAT*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.seq = 0;
        message.contact = 0;
        message.x = 0;
        message.y = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required uint32 seq */ 1:
                    message.seq = reader.uint32();
                    break;
                case /* required uint32 contact */ 2:
                    message.contact = reader.uint32();
                    break;
                case /* required float x */ 3:
                    message.x = reader.float();
                    break;
                case /* required float y */ 4:
                    message.y = reader.float();
                    break;
                case /* optional float pressure */ 5:
                    message.pressure = reader.float();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required uint32 seq = 1; */
        if (message.seq !== 0)
            writer.tag(1, WireType.Varint).uint32(message.seq);
        /* required uint32 contact = 2; */
        if (message.contact !== 0)
            writer.tag(2, WireType.Varint).uint32(message.contact);
        /* required float x = 3; */
        if (message.x !== 0)
            writer.tag(3, WireType.Bit32).float(message.x);
        /* required float y = 4; */
        if (message.y !== 0)
            writer.tag(4, WireType.Bit32).float(message.y);
        /* optional float pressure = 5; */
        if (message.pressure !== undefined)
            writer.tag(5, WireType.Bit32).float(message.pressure);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TouchDownMessage
 */
export const TouchDownMessage = new TouchDownMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TouchMoveMessage$Type extends MessageType {
    constructor() {
        super("TouchMoveMessage", [
            { no: 1, name: "seq", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 2, name: "contact", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 3, name: "x", kind: "scalar", T: 2 /*ScalarType.FLOAT*/ },
            { no: 4, name: "y", kind: "scalar", T: 2 /*ScalarType.FLOAT*/ },
            { no: 5, name: "pressure", kind: "scalar", opt: true, T: 2 /*ScalarType.FLOAT*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.seq = 0;
        message.contact = 0;
        message.x = 0;
        message.y = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required uint32 seq */ 1:
                    message.seq = reader.uint32();
                    break;
                case /* required uint32 contact */ 2:
                    message.contact = reader.uint32();
                    break;
                case /* required float x */ 3:
                    message.x = reader.float();
                    break;
                case /* required float y */ 4:
                    message.y = reader.float();
                    break;
                case /* optional float pressure */ 5:
                    message.pressure = reader.float();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required uint32 seq = 1; */
        if (message.seq !== 0)
            writer.tag(1, WireType.Varint).uint32(message.seq);
        /* required uint32 contact = 2; */
        if (message.contact !== 0)
            writer.tag(2, WireType.Varint).uint32(message.contact);
        /* required float x = 3; */
        if (message.x !== 0)
            writer.tag(3, WireType.Bit32).float(message.x);
        /* required float y = 4; */
        if (message.y !== 0)
            writer.tag(4, WireType.Bit32).float(message.y);
        /* optional float pressure = 5; */
        if (message.pressure !== undefined)
            writer.tag(5, WireType.Bit32).float(message.pressure);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TouchMoveMessage
 */
export const TouchMoveMessage = new TouchMoveMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TouchMoveIosMessage$Type extends MessageType {
    constructor() {
        super("TouchMoveIosMessage", [
            { no: 1, name: "toX", kind: "scalar", T: 2 /*ScalarType.FLOAT*/ },
            { no: 2, name: "toY", kind: "scalar", T: 2 /*ScalarType.FLOAT*/ },
            { no: 3, name: "fromX", kind: "scalar", T: 2 /*ScalarType.FLOAT*/ },
            { no: 4, name: "fromY", kind: "scalar", T: 2 /*ScalarType.FLOAT*/ },
            { no: 5, name: "duration", kind: "scalar", opt: true, T: 2 /*ScalarType.FLOAT*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.toX = 0;
        message.toY = 0;
        message.fromX = 0;
        message.fromY = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required float toX */ 1:
                    message.toX = reader.float();
                    break;
                case /* required float toY */ 2:
                    message.toY = reader.float();
                    break;
                case /* required float fromX */ 3:
                    message.fromX = reader.float();
                    break;
                case /* required float fromY */ 4:
                    message.fromY = reader.float();
                    break;
                case /* optional float duration */ 5:
                    message.duration = reader.float();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required float toX = 1; */
        if (message.toX !== 0)
            writer.tag(1, WireType.Bit32).float(message.toX);
        /* required float toY = 2; */
        if (message.toY !== 0)
            writer.tag(2, WireType.Bit32).float(message.toY);
        /* required float fromX = 3; */
        if (message.fromX !== 0)
            writer.tag(3, WireType.Bit32).float(message.fromX);
        /* required float fromY = 4; */
        if (message.fromY !== 0)
            writer.tag(4, WireType.Bit32).float(message.fromY);
        /* optional float duration = 5; */
        if (message.duration !== undefined)
            writer.tag(5, WireType.Bit32).float(message.duration);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TouchMoveIosMessage
 */
export const TouchMoveIosMessage = new TouchMoveIosMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TouchUpMessage$Type extends MessageType {
    constructor() {
        super("TouchUpMessage", [
            { no: 1, name: "seq", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 2, name: "contact", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.seq = 0;
        message.contact = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required uint32 seq */ 1:
                    message.seq = reader.uint32();
                    break;
                case /* required uint32 contact */ 2:
                    message.contact = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required uint32 seq = 1; */
        if (message.seq !== 0)
            writer.tag(1, WireType.Varint).uint32(message.seq);
        /* required uint32 contact = 2; */
        if (message.contact !== 0)
            writer.tag(2, WireType.Varint).uint32(message.contact);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TouchUpMessage
 */
export const TouchUpMessage = new TouchUpMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TouchCommitMessage$Type extends MessageType {
    constructor() {
        super("TouchCommitMessage", [
            { no: 1, name: "seq", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.seq = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required uint32 seq */ 1:
                    message.seq = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required uint32 seq = 1; */
        if (message.seq !== 0)
            writer.tag(1, WireType.Varint).uint32(message.seq);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TouchCommitMessage
 */
export const TouchCommitMessage = new TouchCommitMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TouchResetMessage$Type extends MessageType {
    constructor() {
        super("TouchResetMessage", [
            { no: 1, name: "seq", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.seq = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required uint32 seq */ 1:
                    message.seq = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required uint32 seq = 1; */
        if (message.seq !== 0)
            writer.tag(1, WireType.Varint).uint32(message.seq);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TouchResetMessage
 */
export const TouchResetMessage = new TouchResetMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ApplyIosRuntimeSettingsMessage$Type extends MessageType {
    constructor() {
        super("ApplyIosRuntimeSettingsMessage", [
            { no: 1, name: "touchWatchdogTimeoutMs", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 2, name: "wdaRequestTimeoutMs", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 3, name: "wdaSessionTimeoutMs", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 4, name: "actionTimeoutRecoveryThreshold", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 5, name: "touchRecoveryCooldownMs", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 6, name: "wdaLeanMode", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 7, name: "wdaMjpegQuality", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 8, name: "wdaMjpegScaling", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 9, name: "wdaTreeCacheMs", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 10, name: "typeKeyDelayMs", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.touchWatchdogTimeoutMs = 0;
        message.wdaRequestTimeoutMs = 0;
        message.wdaSessionTimeoutMs = 0;
        message.actionTimeoutRecoveryThreshold = 0;
        message.touchRecoveryCooldownMs = 0;
        message.wdaLeanMode = false;
        message.wdaMjpegQuality = 0;
        message.wdaMjpegScaling = 0;
        message.wdaTreeCacheMs = 0;
        message.typeKeyDelayMs = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required uint32 touchWatchdogTimeoutMs */ 1:
                    message.touchWatchdogTimeoutMs = reader.uint32();
                    break;
                case /* required uint32 wdaRequestTimeoutMs */ 2:
                    message.wdaRequestTimeoutMs = reader.uint32();
                    break;
                case /* required uint32 wdaSessionTimeoutMs */ 3:
                    message.wdaSessionTimeoutMs = reader.uint32();
                    break;
                case /* required uint32 actionTimeoutRecoveryThreshold */ 4:
                    message.actionTimeoutRecoveryThreshold = reader.uint32();
                    break;
                case /* required uint32 touchRecoveryCooldownMs */ 5:
                    message.touchRecoveryCooldownMs = reader.uint32();
                    break;
                case /* required bool wdaLeanMode */ 6:
                    message.wdaLeanMode = reader.bool();
                    break;
                case /* required uint32 wdaMjpegQuality */ 7:
                    message.wdaMjpegQuality = reader.uint32();
                    break;
                case /* required uint32 wdaMjpegScaling */ 8:
                    message.wdaMjpegScaling = reader.uint32();
                    break;
                case /* required uint32 wdaTreeCacheMs */ 9:
                    message.wdaTreeCacheMs = reader.uint32();
                    break;
                case /* required uint32 typeKeyDelayMs */ 10:
                    message.typeKeyDelayMs = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required uint32 touchWatchdogTimeoutMs = 1; */
        if (message.touchWatchdogTimeoutMs !== 0)
            writer.tag(1, WireType.Varint).uint32(message.touchWatchdogTimeoutMs);
        /* required uint32 wdaRequestTimeoutMs = 2; */
        if (message.wdaRequestTimeoutMs !== 0)
            writer.tag(2, WireType.Varint).uint32(message.wdaRequestTimeoutMs);
        /* required uint32 wdaSessionTimeoutMs = 3; */
        if (message.wdaSessionTimeoutMs !== 0)
            writer.tag(3, WireType.Varint).uint32(message.wdaSessionTimeoutMs);
        /* required uint32 actionTimeoutRecoveryThreshold = 4; */
        if (message.actionTimeoutRecoveryThreshold !== 0)
            writer.tag(4, WireType.Varint).uint32(message.actionTimeoutRecoveryThreshold);
        /* required uint32 touchRecoveryCooldownMs = 5; */
        if (message.touchRecoveryCooldownMs !== 0)
            writer.tag(5, WireType.Varint).uint32(message.touchRecoveryCooldownMs);
        /* required bool wdaLeanMode = 6; */
        if (message.wdaLeanMode !== false)
            writer.tag(6, WireType.Varint).bool(message.wdaLeanMode);
        /* required uint32 wdaMjpegQuality = 7; */
        if (message.wdaMjpegQuality !== 0)
            writer.tag(7, WireType.Varint).uint32(message.wdaMjpegQuality);
        /* required uint32 wdaMjpegScaling = 8; */
        if (message.wdaMjpegScaling !== 0)
            writer.tag(8, WireType.Varint).uint32(message.wdaMjpegScaling);
        /* required uint32 wdaTreeCacheMs = 9; */
        if (message.wdaTreeCacheMs !== 0)
            writer.tag(9, WireType.Varint).uint32(message.wdaTreeCacheMs);
        /* required uint32 typeKeyDelayMs = 10; */
        if (message.typeKeyDelayMs !== 0)
            writer.tag(10, WireType.Varint).uint32(message.typeKeyDelayMs);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ApplyIosRuntimeSettingsMessage
 */
export const ApplyIosRuntimeSettingsMessage = new ApplyIosRuntimeSettingsMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GestureStartMessage$Type extends MessageType {
    constructor() {
        super("GestureStartMessage", [
            { no: 1, name: "seq", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.seq = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required uint32 seq */ 1:
                    message.seq = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required uint32 seq = 1; */
        if (message.seq !== 0)
            writer.tag(1, WireType.Varint).uint32(message.seq);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GestureStartMessage
 */
export const GestureStartMessage = new GestureStartMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GestureStopMessage$Type extends MessageType {
    constructor() {
        super("GestureStopMessage", [
            { no: 1, name: "seq", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.seq = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required uint32 seq */ 1:
                    message.seq = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required uint32 seq = 1; */
        if (message.seq !== 0)
            writer.tag(1, WireType.Varint).uint32(message.seq);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GestureStopMessage
 */
export const GestureStopMessage = new GestureStopMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TypeMessage$Type extends MessageType {
    constructor() {
        super("TypeMessage", [
            { no: 1, name: "text", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.text = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string text */ 1:
                    message.text = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string text = 1; */
        if (message.text !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.text);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TypeMessage
 */
export const TypeMessage = new TypeMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class PasteMessage$Type extends MessageType {
    constructor() {
        super("PasteMessage", [
            { no: 1, name: "text", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.text = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string text */ 1:
                    message.text = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string text = 1; */
        if (message.text !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.text);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message PasteMessage
 */
export const PasteMessage = new PasteMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class CopyMessage$Type extends MessageType {
    constructor() {
        super("CopyMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message CopyMessage
 */
export const CopyMessage = new CopyMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class KeyDownMessage$Type extends MessageType {
    constructor() {
        super("KeyDownMessage", [
            { no: 1, name: "key", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.key = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string key */ 1:
                    message.key = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string key = 1; */
        if (message.key !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.key);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message KeyDownMessage
 */
export const KeyDownMessage = new KeyDownMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class KeyUpMessage$Type extends MessageType {
    constructor() {
        super("KeyUpMessage", [
            { no: 1, name: "key", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.key = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string key */ 1:
                    message.key = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string key = 1; */
        if (message.key !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.key);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message KeyUpMessage
 */
export const KeyUpMessage = new KeyUpMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class KeyPressMessage$Type extends MessageType {
    constructor() {
        super("KeyPressMessage", [
            { no: 1, name: "key", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.key = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string key */ 1:
                    message.key = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string key = 1; */
        if (message.key !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.key);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message KeyPressMessage
 */
export const KeyPressMessage = new KeyPressMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class RebootMessage$Type extends MessageType {
    constructor() {
        super("RebootMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RebootMessage
 */
export const RebootMessage = new RebootMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceLogcatEntryMessage$Type extends MessageType {
    constructor() {
        super("DeviceLogcatEntryMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "date", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 3, name: "pid", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 4, name: "tid", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 5, name: "priority", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 6, name: "tag", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 7, name: "message", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.date = 0;
        message.pid = 0;
        message.tid = 0;
        message.priority = 0;
        message.tag = "";
        message.message = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required double date */ 2:
                    message.date = reader.double();
                    break;
                case /* required uint32 pid */ 3:
                    message.pid = reader.uint32();
                    break;
                case /* required uint32 tid */ 4:
                    message.tid = reader.uint32();
                    break;
                case /* required uint32 priority */ 5:
                    message.priority = reader.uint32();
                    break;
                case /* required string tag */ 6:
                    message.tag = reader.string();
                    break;
                case /* required string message */ 7:
                    message.message = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required double date = 2; */
        if (message.date !== 0)
            writer.tag(2, WireType.Bit64).double(message.date);
        /* required uint32 pid = 3; */
        if (message.pid !== 0)
            writer.tag(3, WireType.Varint).uint32(message.pid);
        /* required uint32 tid = 4; */
        if (message.tid !== 0)
            writer.tag(4, WireType.Varint).uint32(message.tid);
        /* required uint32 priority = 5; */
        if (message.priority !== 0)
            writer.tag(5, WireType.Varint).uint32(message.priority);
        /* required string tag = 6; */
        if (message.tag !== "")
            writer.tag(6, WireType.LengthDelimited).string(message.tag);
        /* required string message = 7; */
        if (message.message !== "")
            writer.tag(7, WireType.LengthDelimited).string(message.message);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceLogcatEntryMessage
 */
export const DeviceLogcatEntryMessage = new DeviceLogcatEntryMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class LogcatFilter$Type extends MessageType {
    constructor() {
        super("LogcatFilter", [
            { no: 1, name: "tag", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "priority", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.tag = "";
        message.priority = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string tag */ 1:
                    message.tag = reader.string();
                    break;
                case /* required uint32 priority */ 2:
                    message.priority = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string tag = 1; */
        if (message.tag !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.tag);
        /* required uint32 priority = 2; */
        if (message.priority !== 0)
            writer.tag(2, WireType.Varint).uint32(message.priority);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message LogcatFilter
 */
export const LogcatFilter = new LogcatFilter$Type();
// @generated message type with reflection information, may provide speed optimized methods
class LogcatStartMessage$Type extends MessageType {
    constructor() {
        super("LogcatStartMessage", [
            { no: 1, name: "filters", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => LogcatFilter }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.filters = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated LogcatFilter filters */ 1:
                    message.filters.push(LogcatFilter.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* repeated LogcatFilter filters = 1; */
        for (let i = 0; i < message.filters.length; i++)
            LogcatFilter.internalBinaryWrite(message.filters[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message LogcatStartMessage
 */
export const LogcatStartMessage = new LogcatStartMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class LogcatStopMessage$Type extends MessageType {
    constructor() {
        super("LogcatStopMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message LogcatStopMessage
 */
export const LogcatStopMessage = new LogcatStopMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class LogcatApplyFiltersMessage$Type extends MessageType {
    constructor() {
        super("LogcatApplyFiltersMessage", [
            { no: 1, name: "filters", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => LogcatFilter }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.filters = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated LogcatFilter filters */ 1:
                    message.filters.push(LogcatFilter.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* repeated LogcatFilter filters = 1; */
        for (let i = 0; i < message.filters.length; i++)
            LogcatFilter.internalBinaryWrite(message.filters[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message LogcatApplyFiltersMessage
 */
export const LogcatApplyFiltersMessage = new LogcatApplyFiltersMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ShellCommandMessage$Type extends MessageType {
    constructor() {
        super("ShellCommandMessage", [
            { no: 1, name: "command", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "timeout", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.command = "";
        message.timeout = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string command */ 1:
                    message.command = reader.string();
                    break;
                case /* required uint32 timeout */ 2:
                    message.timeout = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string command = 1; */
        if (message.command !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.command);
        /* required uint32 timeout = 2; */
        if (message.timeout !== 0)
            writer.tag(2, WireType.Varint).uint32(message.timeout);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ShellCommandMessage
 */
export const ShellCommandMessage = new ShellCommandMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ShellKeepAliveMessage$Type extends MessageType {
    constructor() {
        super("ShellKeepAliveMessage", [
            { no: 1, name: "timeout", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.timeout = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required uint32 timeout */ 1:
                    message.timeout = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required uint32 timeout = 1; */
        if (message.timeout !== 0)
            writer.tag(1, WireType.Varint).uint32(message.timeout);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ShellKeepAliveMessage
 */
export const ShellKeepAliveMessage = new ShellKeepAliveMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class InstallMessage$Type extends MessageType {
    constructor() {
        super("InstallMessage", [
            { no: 1, name: "href", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "launch", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 3, name: "isApi", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 4, name: "manifest", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "installFlags", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 6, name: "jwt", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 7, name: "pkg", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.href = "";
        message.launch = false;
        message.isApi = false;
        message.installFlags = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string href */ 1:
                    message.href = reader.string();
                    break;
                case /* required bool launch */ 2:
                    message.launch = reader.bool();
                    break;
                case /* required bool isApi */ 3:
                    message.isApi = reader.bool();
                    break;
                case /* optional string manifest */ 4:
                    message.manifest = reader.string();
                    break;
                case /* repeated string installFlags */ 5:
                    message.installFlags.push(reader.string());
                    break;
                case /* optional string jwt */ 6:
                    message.jwt = reader.string();
                    break;
                case /* optional string pkg */ 7:
                    message.pkg = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string href = 1; */
        if (message.href !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.href);
        /* required bool launch = 2; */
        if (message.launch !== false)
            writer.tag(2, WireType.Varint).bool(message.launch);
        /* required bool isApi = 3; */
        if (message.isApi !== false)
            writer.tag(3, WireType.Varint).bool(message.isApi);
        /* optional string manifest = 4; */
        if (message.manifest !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.manifest);
        /* repeated string installFlags = 5; */
        for (let i = 0; i < message.installFlags.length; i++)
            writer.tag(5, WireType.LengthDelimited).string(message.installFlags[i]);
        /* optional string jwt = 6; */
        if (message.jwt !== undefined)
            writer.tag(6, WireType.LengthDelimited).string(message.jwt);
        /* optional string pkg = 7; */
        if (message.pkg !== undefined)
            writer.tag(7, WireType.LengthDelimited).string(message.pkg);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message InstallMessage
 */
export const InstallMessage = new InstallMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UninstallMessage$Type extends MessageType {
    constructor() {
        super("UninstallMessage", [
            { no: 1, name: "packageName", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.packageName = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string packageName */ 1:
                    message.packageName = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string packageName = 1; */
        if (message.packageName !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.packageName);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UninstallMessage
 */
export const UninstallMessage = new UninstallMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UninstallIosMessage$Type extends MessageType {
    constructor() {
        super("UninstallIosMessage", [
            { no: 1, name: "packageName", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.packageName = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string packageName */ 1:
                    message.packageName = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string packageName = 1; */
        if (message.packageName !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.packageName);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UninstallIosMessage
 */
export const UninstallIosMessage = new UninstallIosMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class LaunchActivityMessage$Type extends MessageType {
    constructor() {
        super("LaunchActivityMessage", [
            { no: 1, name: "action", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "component", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "category", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "flags", kind: "scalar", opt: true, T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.action = "";
        message.component = "";
        message.category = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string action */ 1:
                    message.action = reader.string();
                    break;
                case /* required string component */ 2:
                    message.component = reader.string();
                    break;
                case /* repeated string category */ 3:
                    message.category.push(reader.string());
                    break;
                case /* optional uint32 flags */ 4:
                    message.flags = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string action = 1; */
        if (message.action !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.action);
        /* required string component = 2; */
        if (message.component !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.component);
        /* repeated string category = 3; */
        for (let i = 0; i < message.category.length; i++)
            writer.tag(3, WireType.LengthDelimited).string(message.category[i]);
        /* optional uint32 flags = 4; */
        if (message.flags !== undefined)
            writer.tag(4, WireType.Varint).uint32(message.flags);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message LaunchActivityMessage
 */
export const LaunchActivityMessage = new LaunchActivityMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class RotateMessage$Type extends MessageType {
    constructor() {
        super("RotateMessage", [
            { no: 1, name: "rotation", kind: "scalar", T: 5 /*ScalarType.INT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.rotation = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required int32 rotation */ 1:
                    message.rotation = reader.int32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required int32 rotation = 1; */
        if (message.rotation !== 0)
            writer.tag(1, WireType.Varint).int32(message.rotation);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RotateMessage
 */
export const RotateMessage = new RotateMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ChangeQualityMessage$Type extends MessageType {
    constructor() {
        super("ChangeQualityMessage", [
            { no: 1, name: "quality", kind: "scalar", T: 5 /*ScalarType.INT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.quality = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required int32 quality */ 1:
                    message.quality = reader.int32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required int32 quality = 1; */
        if (message.quality !== 0)
            writer.tag(1, WireType.Varint).int32(message.quality);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ChangeQualityMessage
 */
export const ChangeQualityMessage = new ChangeQualityMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ForwardTestMessage$Type extends MessageType {
    constructor() {
        super("ForwardTestMessage", [
            { no: 1, name: "targetHost", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "targetPort", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.targetHost = "";
        message.targetPort = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string targetHost */ 1:
                    message.targetHost = reader.string();
                    break;
                case /* required uint32 targetPort */ 2:
                    message.targetPort = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string targetHost = 1; */
        if (message.targetHost !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.targetHost);
        /* required uint32 targetPort = 2; */
        if (message.targetPort !== 0)
            writer.tag(2, WireType.Varint).uint32(message.targetPort);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ForwardTestMessage
 */
export const ForwardTestMessage = new ForwardTestMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ForwardCreateMessage$Type extends MessageType {
    constructor() {
        super("ForwardCreateMessage", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "devicePort", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 3, name: "targetHost", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "targetPort", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = "";
        message.devicePort = 0;
        message.targetHost = "";
        message.targetPort = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string id */ 1:
                    message.id = reader.string();
                    break;
                case /* required uint32 devicePort */ 2:
                    message.devicePort = reader.uint32();
                    break;
                case /* required string targetHost */ 3:
                    message.targetHost = reader.string();
                    break;
                case /* required uint32 targetPort */ 4:
                    message.targetPort = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* required uint32 devicePort = 2; */
        if (message.devicePort !== 0)
            writer.tag(2, WireType.Varint).uint32(message.devicePort);
        /* required string targetHost = 3; */
        if (message.targetHost !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.targetHost);
        /* required uint32 targetPort = 4; */
        if (message.targetPort !== 0)
            writer.tag(4, WireType.Varint).uint32(message.targetPort);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ForwardCreateMessage
 */
export const ForwardCreateMessage = new ForwardCreateMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ForwardRemoveMessage$Type extends MessageType {
    constructor() {
        super("ForwardRemoveMessage", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string id */ 1:
                    message.id = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ForwardRemoveMessage
 */
export const ForwardRemoveMessage = new ForwardRemoveMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ReverseForward$Type extends MessageType {
    constructor() {
        super("ReverseForward", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "devicePort", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 3, name: "targetHost", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "targetPort", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = "";
        message.devicePort = 0;
        message.targetHost = "";
        message.targetPort = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string id */ 1:
                    message.id = reader.string();
                    break;
                case /* required uint32 devicePort */ 2:
                    message.devicePort = reader.uint32();
                    break;
                case /* required string targetHost */ 3:
                    message.targetHost = reader.string();
                    break;
                case /* required uint32 targetPort */ 4:
                    message.targetPort = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* required uint32 devicePort = 2; */
        if (message.devicePort !== 0)
            writer.tag(2, WireType.Varint).uint32(message.devicePort);
        /* required string targetHost = 3; */
        if (message.targetHost !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.targetHost);
        /* required uint32 targetPort = 4; */
        if (message.targetPort !== 0)
            writer.tag(4, WireType.Varint).uint32(message.targetPort);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ReverseForward
 */
export const ReverseForward = new ReverseForward$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ReverseForwardsEvent$Type extends MessageType {
    constructor() {
        super("ReverseForwardsEvent", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "forwards", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => ReverseForward }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.forwards = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* repeated ReverseForward forwards */ 2:
                    message.forwards.push(ReverseForward.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* repeated ReverseForward forwards = 2; */
        for (let i = 0; i < message.forwards.length; i++)
            ReverseForward.internalBinaryWrite(message.forwards[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ReverseForwardsEvent
 */
export const ReverseForwardsEvent = new ReverseForwardsEvent$Type();
// @generated message type with reflection information, may provide speed optimized methods
class BrowserOpenMessage$Type extends MessageType {
    constructor() {
        super("BrowserOpenMessage", [
            { no: 1, name: "url", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "browser", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.url = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string url */ 1:
                    message.url = reader.string();
                    break;
                case /* optional string browser */ 2:
                    message.browser = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string url = 1; */
        if (message.url !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.url);
        /* optional string browser = 2; */
        if (message.browser !== undefined)
            writer.tag(2, WireType.LengthDelimited).string(message.browser);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message BrowserOpenMessage
 */
export const BrowserOpenMessage = new BrowserOpenMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class BrowserClearMessage$Type extends MessageType {
    constructor() {
        super("BrowserClearMessage", [
            { no: 1, name: "browser", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* optional string browser */ 1:
                    message.browser = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* optional string browser = 1; */
        if (message.browser !== undefined)
            writer.tag(1, WireType.LengthDelimited).string(message.browser);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message BrowserClearMessage
 */
export const BrowserClearMessage = new BrowserClearMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class StoreOpenMessage$Type extends MessageType {
    constructor() {
        super("StoreOpenMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message StoreOpenMessage
 */
export const StoreOpenMessage = new StoreOpenMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ScreenCaptureMessage$Type extends MessageType {
    constructor() {
        super("ScreenCaptureMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ScreenCaptureMessage
 */
export const ScreenCaptureMessage = new ScreenCaptureMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ConnectStartMessage$Type extends MessageType {
    constructor() {
        super("ConnectStartMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ConnectStartMessage
 */
export const ConnectStartMessage = new ConnectStartMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ConnectGetForwardUrlMessage$Type extends MessageType {
    constructor() {
        super("ConnectGetForwardUrlMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ConnectGetForwardUrlMessage
 */
export const ConnectGetForwardUrlMessage = new ConnectGetForwardUrlMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ConnectStopMessage$Type extends MessageType {
    constructor() {
        super("ConnectStopMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ConnectStopMessage
 */
export const ConnectStopMessage = new ConnectStopMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AccountAddMenuMessage$Type extends MessageType {
    constructor() {
        super("AccountAddMenuMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message AccountAddMenuMessage
 */
export const AccountAddMenuMessage = new AccountAddMenuMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AccountAddMessage$Type extends MessageType {
    constructor() {
        super("AccountAddMessage", [
            { no: 1, name: "user", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "password", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.user = "";
        message.password = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string user */ 1:
                    message.user = reader.string();
                    break;
                case /* required string password */ 2:
                    message.password = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string user = 1; */
        if (message.user !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.user);
        /* required string password = 2; */
        if (message.password !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.password);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message AccountAddMessage
 */
export const AccountAddMessage = new AccountAddMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AccountCheckMessage$Type extends MessageType {
    constructor() {
        super("AccountCheckMessage", [
            { no: 1, name: "type", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "account", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.type = "";
        message.account = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string type */ 1:
                    message.type = reader.string();
                    break;
                case /* required string account */ 2:
                    message.account = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string type = 1; */
        if (message.type !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.type);
        /* required string account = 2; */
        if (message.account !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.account);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message AccountCheckMessage
 */
export const AccountCheckMessage = new AccountCheckMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AccountGetMessage$Type extends MessageType {
    constructor() {
        super("AccountGetMessage", [
            { no: 1, name: "type", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* optional string type */ 1:
                    message.type = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* optional string type = 1; */
        if (message.type !== undefined)
            writer.tag(1, WireType.LengthDelimited).string(message.type);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message AccountGetMessage
 */
export const AccountGetMessage = new AccountGetMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AccountRemoveMessage$Type extends MessageType {
    constructor() {
        super("AccountRemoveMessage", [
            { no: 1, name: "type", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "account", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.type = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string type */ 1:
                    message.type = reader.string();
                    break;
                case /* optional string account */ 2:
                    message.account = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string type = 1; */
        if (message.type !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.type);
        /* optional string account = 2; */
        if (message.account !== undefined)
            writer.tag(2, WireType.LengthDelimited).string(message.account);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message AccountRemoveMessage
 */
export const AccountRemoveMessage = new AccountRemoveMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SdStatusMessage$Type extends MessageType {
    constructor() {
        super("SdStatusMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SdStatusMessage
 */
export const SdStatusMessage = new SdStatusMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AirplaneSetMessage$Type extends MessageType {
    constructor() {
        super("AirplaneSetMessage", [
            { no: 1, name: "enabled", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.enabled = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required bool enabled */ 1:
                    message.enabled = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required bool enabled = 1; */
        if (message.enabled !== false)
            writer.tag(1, WireType.Varint).bool(message.enabled);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message AirplaneSetMessage
 */
export const AirplaneSetMessage = new AirplaneSetMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class RingerSetMessage$Type extends MessageType {
    constructor() {
        super("RingerSetMessage", [
            { no: 1, name: "mode", kind: "enum", T: () => ["RingerMode", RingerMode] }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.mode = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required RingerMode mode */ 1:
                    message.mode = reader.int32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required RingerMode mode = 1; */
        if (message.mode !== 0)
            writer.tag(1, WireType.Varint).int32(message.mode);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RingerSetMessage
 */
export const RingerSetMessage = new RingerSetMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class RingerGetMessage$Type extends MessageType {
    constructor() {
        super("RingerGetMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RingerGetMessage
 */
export const RingerGetMessage = new RingerGetMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class WifiSetEnabledMessage$Type extends MessageType {
    constructor() {
        super("WifiSetEnabledMessage", [
            { no: 1, name: "enabled", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.enabled = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required bool enabled */ 1:
                    message.enabled = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required bool enabled = 1; */
        if (message.enabled !== false)
            writer.tag(1, WireType.Varint).bool(message.enabled);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message WifiSetEnabledMessage
 */
export const WifiSetEnabledMessage = new WifiSetEnabledMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class WifiGetStatusMessage$Type extends MessageType {
    constructor() {
        super("WifiGetStatusMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message WifiGetStatusMessage
 */
export const WifiGetStatusMessage = new WifiGetStatusMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class BluetoothSetEnabledMessage$Type extends MessageType {
    constructor() {
        super("BluetoothSetEnabledMessage", [
            { no: 1, name: "enabled", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.enabled = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required bool enabled */ 1:
                    message.enabled = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required bool enabled = 1; */
        if (message.enabled !== false)
            writer.tag(1, WireType.Varint).bool(message.enabled);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message BluetoothSetEnabledMessage
 */
export const BluetoothSetEnabledMessage = new BluetoothSetEnabledMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class BluetoothGetStatusMessage$Type extends MessageType {
    constructor() {
        super("BluetoothGetStatusMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message BluetoothGetStatusMessage
 */
export const BluetoothGetStatusMessage = new BluetoothGetStatusMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class BluetoothCleanBondedMessage$Type extends MessageType {
    constructor() {
        super("BluetoothCleanBondedMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message BluetoothCleanBondedMessage
 */
export const BluetoothCleanBondedMessage = new BluetoothCleanBondedMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class CapabilitiesMessage$Type extends MessageType {
    constructor() {
        super("CapabilitiesMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "hasTouch", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 3, name: "hasCursor", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.hasTouch = false;
        message.hasCursor = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required bool hasTouch */ 2:
                    message.hasTouch = reader.bool();
                    break;
                case /* required bool hasCursor */ 3:
                    message.hasCursor = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required bool hasTouch = 2; */
        if (message.hasTouch !== false)
            writer.tag(2, WireType.Varint).bool(message.hasTouch);
        /* required bool hasCursor = 3; */
        if (message.hasCursor !== false)
            writer.tag(3, WireType.Varint).bool(message.hasCursor);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message CapabilitiesMessage
 */
export const CapabilitiesMessage = new CapabilitiesMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AirplaneModeEvent$Type extends MessageType {
    constructor() {
        super("AirplaneModeEvent", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "enabled", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.enabled = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required bool enabled */ 2:
                    message.enabled = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required bool enabled = 2; */
        if (message.enabled !== false)
            writer.tag(2, WireType.Varint).bool(message.enabled);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message AirplaneModeEvent
 */
export const AirplaneModeEvent = new AirplaneModeEvent$Type();
// @generated message type with reflection information, may provide speed optimized methods
class BatteryEvent$Type extends MessageType {
    constructor() {
        super("BatteryEvent", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "status", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "health", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "source", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "level", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 6, name: "scale", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 7, name: "temp", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 8, name: "voltage", kind: "scalar", opt: true, T: 1 /*ScalarType.DOUBLE*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.status = "";
        message.health = "";
        message.source = "";
        message.level = 0;
        message.scale = 0;
        message.temp = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required string status */ 2:
                    message.status = reader.string();
                    break;
                case /* required string health */ 3:
                    message.health = reader.string();
                    break;
                case /* required string source */ 4:
                    message.source = reader.string();
                    break;
                case /* required uint32 level */ 5:
                    message.level = reader.uint32();
                    break;
                case /* required uint32 scale */ 6:
                    message.scale = reader.uint32();
                    break;
                case /* required double temp */ 7:
                    message.temp = reader.double();
                    break;
                case /* optional double voltage */ 8:
                    message.voltage = reader.double();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required string status = 2; */
        if (message.status !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.status);
        /* required string health = 3; */
        if (message.health !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.health);
        /* required string source = 4; */
        if (message.source !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.source);
        /* required uint32 level = 5; */
        if (message.level !== 0)
            writer.tag(5, WireType.Varint).uint32(message.level);
        /* required uint32 scale = 6; */
        if (message.scale !== 0)
            writer.tag(6, WireType.Varint).uint32(message.scale);
        /* required double temp = 7; */
        if (message.temp !== 0)
            writer.tag(7, WireType.Bit64).double(message.temp);
        /* optional double voltage = 8; */
        if (message.voltage !== undefined)
            writer.tag(8, WireType.Bit64).double(message.voltage);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message BatteryEvent
 */
export const BatteryEvent = new BatteryEvent$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ConnectivityEvent$Type extends MessageType {
    constructor() {
        super("ConnectivityEvent", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "connected", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 3, name: "type", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "subtype", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "failover", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 6, name: "roaming", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.connected = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required bool connected */ 2:
                    message.connected = reader.bool();
                    break;
                case /* optional string type */ 3:
                    message.type = reader.string();
                    break;
                case /* optional string subtype */ 4:
                    message.subtype = reader.string();
                    break;
                case /* optional bool failover */ 5:
                    message.failover = reader.bool();
                    break;
                case /* optional bool roaming */ 6:
                    message.roaming = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required bool connected = 2; */
        if (message.connected !== false)
            writer.tag(2, WireType.Varint).bool(message.connected);
        /* optional string type = 3; */
        if (message.type !== undefined)
            writer.tag(3, WireType.LengthDelimited).string(message.type);
        /* optional string subtype = 4; */
        if (message.subtype !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.subtype);
        /* optional bool failover = 5; */
        if (message.failover !== undefined)
            writer.tag(5, WireType.Varint).bool(message.failover);
        /* optional bool roaming = 6; */
        if (message.roaming !== undefined)
            writer.tag(6, WireType.Varint).bool(message.roaming);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ConnectivityEvent
 */
export const ConnectivityEvent = new ConnectivityEvent$Type();
// @generated message type with reflection information, may provide speed optimized methods
class PhoneStateEvent$Type extends MessageType {
    constructor() {
        super("PhoneStateEvent", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "state", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "manual", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 4, name: "operator", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.state = "";
        message.manual = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required string state */ 2:
                    message.state = reader.string();
                    break;
                case /* required bool manual */ 3:
                    message.manual = reader.bool();
                    break;
                case /* optional string operator */ 4:
                    message.operator = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required string state = 2; */
        if (message.state !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.state);
        /* required bool manual = 3; */
        if (message.manual !== false)
            writer.tag(3, WireType.Varint).bool(message.manual);
        /* optional string operator = 4; */
        if (message.operator !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.operator);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message PhoneStateEvent
 */
export const PhoneStateEvent = new PhoneStateEvent$Type();
// @generated message type with reflection information, may provide speed optimized methods
class RotationEvent$Type extends MessageType {
    constructor() {
        super("RotationEvent", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "rotation", kind: "scalar", T: 5 /*ScalarType.INT32*/ },
            { no: 3, name: "width", kind: "scalar", opt: true, T: 5 /*ScalarType.INT32*/ },
            { no: 4, name: "height", kind: "scalar", opt: true, T: 5 /*ScalarType.INT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.rotation = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required int32 rotation */ 2:
                    message.rotation = reader.int32();
                    break;
                case /* optional int32 width */ 3:
                    message.width = reader.int32();
                    break;
                case /* optional int32 height */ 4:
                    message.height = reader.int32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required int32 rotation = 2; */
        if (message.rotation !== 0)
            writer.tag(2, WireType.Varint).int32(message.rotation);
        /* optional int32 width = 3; */
        if (message.width !== undefined)
            writer.tag(3, WireType.Varint).int32(message.width);
        /* optional int32 height = 4; */
        if (message.height !== undefined)
            writer.tag(4, WireType.Varint).int32(message.height);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RotationEvent
 */
export const RotationEvent = new RotationEvent$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetDeviceDisplay$Type extends MessageType {
    constructor() {
        super("SetDeviceDisplay", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "channel", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "width", kind: "scalar", T: 5 /*ScalarType.INT32*/ },
            { no: 4, name: "height", kind: "scalar", T: 5 /*ScalarType.INT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.channel = "";
        message.width = 0;
        message.height = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required string channel */ 2:
                    message.channel = reader.string();
                    break;
                case /* required int32 width */ 3:
                    message.width = reader.int32();
                    break;
                case /* required int32 height */ 4:
                    message.height = reader.int32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required string channel = 2; */
        if (message.channel !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.channel);
        /* required int32 width = 3; */
        if (message.width !== 0)
            writer.tag(3, WireType.Varint).int32(message.width);
        /* required int32 height = 4; */
        if (message.height !== 0)
            writer.tag(4, WireType.Varint).int32(message.height);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetDeviceDisplay
 */
export const SetDeviceDisplay = new SetDeviceDisplay$Type();
// @generated message type with reflection information, may provide speed optimized methods
class IosDevicePorts$Type extends MessageType {
    constructor() {
        super("IosDevicePorts", [
            { no: 2, name: "screenPort", kind: "scalar", T: 5 /*ScalarType.INT32*/ },
            { no: 3, name: "connectPort", kind: "scalar", T: 5 /*ScalarType.INT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.screenPort = 0;
        message.connectPort = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required int32 screenPort */ 2:
                    message.screenPort = reader.int32();
                    break;
                case /* required int32 connectPort */ 3:
                    message.connectPort = reader.int32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required int32 screenPort = 2; */
        if (message.screenPort !== 0)
            writer.tag(2, WireType.Varint).int32(message.screenPort);
        /* required int32 connectPort = 3; */
        if (message.connectPort !== 0)
            writer.tag(3, WireType.Varint).int32(message.connectPort);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message IosDevicePorts
 */
export const IosDevicePorts = new IosDevicePorts$Type();
// @generated message type with reflection information, may provide speed optimized methods
class StartStreaming$Type extends MessageType {
    constructor() {
        super("StartStreaming", [
            { no: 1, name: "port", kind: "scalar", T: 5 /*ScalarType.INT32*/ },
            { no: 2, name: "channel", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.port = 0;
        message.channel = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required int32 port */ 1:
                    message.port = reader.int32();
                    break;
                case /* required string channel */ 2:
                    message.channel = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required int32 port = 1; */
        if (message.port !== 0)
            writer.tag(1, WireType.Varint).int32(message.port);
        /* required string channel = 2; */
        if (message.channel !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.channel);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message StartStreaming
 */
export const StartStreaming = new StartStreaming$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeleteDevice$Type extends MessageType {
    constructor() {
        super("DeleteDevice", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeleteDevice
 */
export const DeleteDevice = new DeleteDevice$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetAbsentDisconnectedDevices$Type extends MessageType {
    constructor() {
        super("SetAbsentDisconnectedDevices", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetAbsentDisconnectedDevices
 */
export const SetAbsentDisconnectedDevices = new SetAbsentDisconnectedDevices$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Applications$Type extends MessageType {
    constructor() {
        super("Applications", [
            { no: 1, name: "bundleId", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "bundleName", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.bundleId = "";
        message.bundleName = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string bundleId */ 1:
                    message.bundleId = reader.string();
                    break;
                case /* required string bundleName */ 2:
                    message.bundleName = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string bundleId = 1; */
        if (message.bundleId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.bundleId);
        /* required string bundleName = 2; */
        if (message.bundleName !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.bundleName);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message Applications
 */
export const Applications = new Applications$Type();
// @generated message type with reflection information, may provide speed optimized methods
class InstalledApplications$Type extends MessageType {
    constructor() {
        super("InstalledApplications", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "applications", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => Applications }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.applications = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* repeated Applications applications */ 2:
                    message.applications.push(Applications.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* repeated Applications applications = 2; */
        for (let i = 0; i < message.applications.length; i++)
            Applications.internalBinaryWrite(message.applications[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message InstalledApplications
 */
export const InstalledApplications = new InstalledApplications$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TransportInstalledApps$Type extends MessageType {
    constructor() {
        super("TransportInstalledApps", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TransportInstalledApps
 */
export const TransportInstalledApps = new TransportInstalledApps$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetDeviceApp$Type extends MessageType {
    constructor() {
        super("SetDeviceApp", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "bundleId", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "bundleName", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "pathToApp", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.bundleId = "";
        message.bundleName = "";
        message.pathToApp = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required string bundleId */ 2:
                    message.bundleId = reader.string();
                    break;
                case /* required string bundleName */ 3:
                    message.bundleName = reader.string();
                    break;
                case /* required string pathToApp */ 4:
                    message.pathToApp = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required string bundleId = 2; */
        if (message.bundleId !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.bundleId);
        /* required string bundleName = 3; */
        if (message.bundleName !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.bundleName);
        /* required string pathToApp = 4; */
        if (message.pathToApp !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.pathToApp);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetDeviceApp
 */
export const SetDeviceApp = new SetDeviceApp$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetIosDeviceApps$Type extends MessageType {
    constructor() {
        super("GetIosDeviceApps", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "bundleId", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "bundleName", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "pathToApp", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.bundleId = "";
        message.bundleName = "";
        message.pathToApp = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required string bundleId */ 2:
                    message.bundleId = reader.string();
                    break;
                case /* required string bundleName */ 3:
                    message.bundleName = reader.string();
                    break;
                case /* required string pathToApp */ 4:
                    message.pathToApp = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required string bundleId = 2; */
        if (message.bundleId !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.bundleId);
        /* required string bundleName = 3; */
        if (message.bundleName !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.bundleName);
        /* required string pathToApp = 4; */
        if (message.pathToApp !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.pathToApp);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetIosDeviceApps
 */
export const GetIosDeviceApps = new GetIosDeviceApps$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TransationGetMessage$Type extends MessageType {
    constructor() {
        super("TransationGetMessage", [
            { no: 1, name: "source", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "data", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.source = "";
        message.data = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string source */ 1:
                    message.source = reader.string();
                    break;
                case /* required string data */ 2:
                    message.data = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string source = 1; */
        if (message.source !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.source);
        /* required string data = 2; */
        if (message.data !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.data);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TransationGetMessage
 */
export const TransationGetMessage = new TransationGetMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetInstalledApplications$Type extends MessageType {
    constructor() {
        super("GetInstalledApplications", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetInstalledApplications
 */
export const GetInstalledApplications = new GetInstalledApplications$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UpdateIosDevice$Type extends MessageType {
    constructor() {
        super("UpdateIosDevice", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "platform", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "architecture", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "sdk", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 6, name: "service", kind: "message", T: () => IosServiceMessage }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = "";
        message.name = "";
        message.platform = "";
        message.architecture = "";
        message.sdk = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string id */ 1:
                    message.id = reader.string();
                    break;
                case /* required string name */ 2:
                    message.name = reader.string();
                    break;
                case /* required string platform */ 3:
                    message.platform = reader.string();
                    break;
                case /* required string architecture */ 4:
                    message.architecture = reader.string();
                    break;
                case /* required string sdk */ 5:
                    message.sdk = reader.string();
                    break;
                case /* required IosServiceMessage service */ 6:
                    message.service = IosServiceMessage.internalBinaryRead(reader, reader.uint32(), options, message.service);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* required string name = 2; */
        if (message.name !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.name);
        /* required string platform = 3; */
        if (message.platform !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.platform);
        /* required string architecture = 4; */
        if (message.architecture !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.architecture);
        /* required string sdk = 5; */
        if (message.sdk !== "")
            writer.tag(5, WireType.LengthDelimited).string(message.sdk);
        /* required IosServiceMessage service = 6; */
        if (message.service)
            IosServiceMessage.internalBinaryWrite(message.service, writer.tag(6, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UpdateIosDevice
 */
export const UpdateIosDevice = new UpdateIosDevice$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SdkIosVersion$Type extends MessageType {
    constructor() {
        super("SdkIosVersion", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "sdkVersion", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = "";
        message.sdkVersion = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string id */ 1:
                    message.id = reader.string();
                    break;
                case /* required string sdkVersion */ 2:
                    message.sdkVersion = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* required string sdkVersion = 2; */
        if (message.sdkVersion !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.sdkVersion);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SdkIosVersion
 */
export const SdkIosVersion = new SdkIosVersion$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SizeIosDevice$Type extends MessageType {
    constructor() {
        super("SizeIosDevice", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "height", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 3, name: "width", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 4, name: "scale", kind: "scalar", T: 5 /*ScalarType.INT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = "";
        message.height = 0;
        message.width = 0;
        message.scale = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string id */ 1:
                    message.id = reader.string();
                    break;
                case /* required double height */ 2:
                    message.height = reader.double();
                    break;
                case /* required double width */ 3:
                    message.width = reader.double();
                    break;
                case /* required int32 scale */ 4:
                    message.scale = reader.int32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* required double height = 2; */
        if (message.height !== 0)
            writer.tag(2, WireType.Bit64).double(message.height);
        /* required double width = 3; */
        if (message.width !== 0)
            writer.tag(3, WireType.Bit64).double(message.width);
        /* required int32 scale = 4; */
        if (message.scale !== 0)
            writer.tag(4, WireType.Varint).int32(message.scale);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SizeIosDevice
 */
export const SizeIosDevice = new SizeIosDevice$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DashboardOpenMessage$Type extends MessageType {
    constructor() {
        super("DashboardOpenMessage", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DashboardOpenMessage
 */
export const DashboardOpenMessage = new DashboardOpenMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetIosTreeElements$Type extends MessageType {
    constructor() {
        super("GetIosTreeElements", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetIosTreeElements
 */
export const GetIosTreeElements = new GetIosTreeElements$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TapDeviceTreeElement$Type extends MessageType {
    constructor() {
        super("TapDeviceTreeElement", [
            { no: 1, name: "label", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.label = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string label */ 1:
                    message.label = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string label = 1; */
        if (message.label !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.label);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TapDeviceTreeElement
 */
export const TapDeviceTreeElement = new TapDeviceTreeElement$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TemporarilyUnavailableMessage$Type extends MessageType {
    constructor() {
        super("TemporarilyUnavailableMessage", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TemporarilyUnavailableMessage
 */
export const TemporarilyUnavailableMessage = new TemporarilyUnavailableMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UpdateRemoteConnectUrl$Type extends MessageType {
    constructor() {
        super("UpdateRemoteConnectUrl", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message UpdateRemoteConnectUrl
 */
export const UpdateRemoteConnectUrl = new UpdateRemoteConnectUrl$Type();
// @generated message type with reflection information, may provide speed optimized methods
class IosServiceMessage$Type extends MessageType {
    constructor() {
        super("IosServiceMessage", [
            { no: 1, name: "hasAPNS", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.hasAPNS = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required bool hasAPNS */ 1:
                    message.hasAPNS = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required bool hasAPNS = 1; */
        if (message.hasAPNS !== false)
            writer.tag(1, WireType.Varint).bool(message.hasAPNS);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message IosServiceMessage
 */
export const IosServiceMessage = new IosServiceMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class LaunchDeviceApp$Type extends MessageType {
    constructor() {
        super("LaunchDeviceApp", [
            { no: 1, name: "pkg", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.pkg = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string pkg */ 1:
                    message.pkg = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string pkg = 1; */
        if (message.pkg !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.pkg);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message LaunchDeviceApp
 */
export const LaunchDeviceApp = new LaunchDeviceApp$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TerminateDeviceApp$Type extends MessageType {
    constructor() {
        super("TerminateDeviceApp", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message TerminateDeviceApp
 */
export const TerminateDeviceApp = new TerminateDeviceApp$Type();
// @generated message type with reflection information, may provide speed optimized methods
class KillDeviceApp$Type extends MessageType {
    constructor() {
        super("KillDeviceApp", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message KillDeviceApp
 */
export const KillDeviceApp = new KillDeviceApp$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetAppAsset$Type extends MessageType {
    constructor() {
        super("GetAppAsset", [
            { no: 1, name: "url", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.url = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string url */ 1:
                    message.url = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string url = 1; */
        if (message.url !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.url);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetAppAsset
 */
export const GetAppAsset = new GetAppAsset$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetAppAssetsList$Type extends MessageType {
    constructor() {
        super("GetAppAssetsList", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetAppAssetsList
 */
export const GetAppAssetsList = new GetAppAssetsList$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetAppHTML$Type extends MessageType {
    constructor() {
        super("GetAppHTML", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetAppHTML
 */
export const GetAppHTML = new GetAppHTML$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetAppInspectServerUrl$Type extends MessageType {
    constructor() {
        super("GetAppInspectServerUrl", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetAppInspectServerUrl
 */
export const GetAppInspectServerUrl = new GetAppInspectServerUrl$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceStatusChange$Type extends MessageType {
    constructor() {
        super("DeviceStatusChange", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "timeout", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        message.timeout = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                case /* required uint32 timeout */ 2:
                    message.timeout = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        /* required uint32 timeout = 2; */
        if (message.timeout !== 0)
            writer.tag(2, WireType.Varint).uint32(message.timeout);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceStatusChange
 */
export const DeviceStatusChange = new DeviceStatusChange$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeviceGetIsInOrigin$Type extends MessageType {
    constructor() {
        super("DeviceGetIsInOrigin", [
            { no: 1, name: "serial", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.serial = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required string serial */ 1:
                    message.serial = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required string serial = 1; */
        if (message.serial !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.serial);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DeviceGetIsInOrigin
 */
export const DeviceGetIsInOrigin = new DeviceGetIsInOrigin$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetPresentDevices$Type extends MessageType {
    constructor() {
        super("GetPresentDevices", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetPresentDevices
 */
export const GetPresentDevices = new GetPresentDevices$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetDeadDevices$Type extends MessageType {
    constructor() {
        super("GetDeadDevices", [
            { no: 1, name: "time", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.time = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* required uint32 time */ 1:
                    message.time = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* required uint32 time = 1; */
        if (message.time !== 0)
            writer.tag(1, WireType.Varint).uint32(message.time);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetDeadDevices
 */
export const GetDeadDevices = new GetDeadDevices$Type();
