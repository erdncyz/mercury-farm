/**
 * Transform for serializing Map objects into JSON-compatible format
 * Handles object keys by JSON stringifying them
 */
const MapTransform = {
    type: 'Map',
    lookup: Map,
    // Optimized Map detection using constructor name
    shouldTransform: (type, obj) => {
        return obj?.constructor?.name === 'Map';
    },
    // Convert Map to serializable object with stringified object keys
    toSerializable: (map) => {
        const body = {};
        // Optimize iteration with forEach for better performance
        map.forEach((value, key) => {
            // Stringify object keys, keep primitive keys as-is for efficiency
            const serializedKey = typeof key === 'object' ? JSON.stringify(key) : key;
            body[serializedKey] = value;
        });
        return {
            name: 'Map',
            body,
            proto: Object.getPrototypeOf(map).constructor.name
        };
    },
    // Convert serialized data back to object (not actual Map for compatibility)
    fromSerializable: (data) => {
        const obj = { ...data.body };
        // Restore constructor information if available
        if (typeof data.proto === 'string') {
            // @ts-ignore - Intentional constructor override for compatibility
            obj.constructor = {
                name: data.proto
            };
        }
        return obj;
    }
};
export default MapTransform;
