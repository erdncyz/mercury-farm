const isMinusZero = (value) => 1 / value === -Infinity;
/**
 * Transform for handling special arithmetic values: Infinity, -Infinity, and -0
 * These values need special handling as they don't serialize properly in JSON
 */
const ArithmeticTransform = {
    type: 'Arithmetic',
    lookup: Number,
    shouldTransform: (type, value) => {
        return type === 'number' &&
            (value === Infinity || value === -Infinity || isMinusZero(value));
    },
    toSerializable: (value) => {
        if (value === Infinity) {
            return 0 /* ArithmeticType.infinity */;
        }
        if (value === -Infinity) {
            return 1 /* ArithmeticType.minusInfinity */;
        }
        return 2 /* ArithmeticType.minusZero */;
    },
    fromSerializable: (data) => {
        switch (data) {
            case 0 /* ArithmeticType.infinity */:
                return Infinity;
            case 1 /* ArithmeticType.minusInfinity */:
                return -Infinity;
            case 2 /* ArithmeticType.minusZero */:
                return -0;
            default:
                return data;
        }
    }
};
export default ArithmeticTransform;
