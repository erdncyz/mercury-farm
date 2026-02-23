/**
 * Transform for serializing functions into JSON-compatible format
 * Note: This creates placeholder functions, not executable ones
 */
const FunctionTransform = {
    type: 'Function',
    lookup: Function,
    // Simple and fast function type check
    shouldTransform: (type, obj) => {
        return typeof obj === 'function';
    },
    // Extract function metadata for serialization
    toSerializable: (func) => {
        let body = '';
        try {
            // Extract function body between first { and last }
            const funcString = func.toString();
            const startIndex = funcString.indexOf('{') + 1;
            const endIndex = funcString.lastIndexOf('}');
            if (startIndex > 0 && endIndex > startIndex) {
                body = funcString.substring(startIndex, endIndex);
            }
        }
        catch {
            // Ignore errors in function stringification
        }
        return {
            name: func.name,
            body,
            proto: Object.getPrototypeOf(func).constructor.name
        };
    },
    // Create placeholder function with metadata
    fromSerializable: (data) => {
        try {
            const tempFunc = function () { };
            if (typeof data.name === 'string') {
                Object.defineProperty(tempFunc, 'name', {
                    value: data.name,
                    writable: false,
                    configurable: true
                });
            }
            if (typeof data.body === 'string') {
                Object.defineProperty(tempFunc, 'body', {
                    value: data.body,
                    writable: false,
                    configurable: true
                });
            }
            if (typeof data.proto === 'string') { // @ts-ignore
                tempFunc.constructor = {
                    name: data.proto
                };
            }
            return tempFunc;
        }
        catch {
            return data;
        }
    }
};
export default FunctionTransform;
