/**
 * Optimized BigInt transform for serialization/deserialization
 * Serialize a `bigint` to a string with 'n' suffix for efficient parsing
 */
const BigIntTransform = {
    type: 'BigInt',
    shouldTransform: (_type, obj) => {
        return typeof obj === 'bigint';
    },
    toSerializable: (value) => {
        return `${value}n`;
    },
    fromSerializable: (data) => {
        return BigInt(data.slice(0, -1));
    }
};
export default BigIntTransform;
