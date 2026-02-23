// Cached sandbox document for performance
let sandbox;
/**
 * Get or create sandbox document for safe HTML parsing
 */
const getSandbox = () => {
    return sandbox ??= document.implementation.createHTMLDocument('sandbox');
};
/**
 * Efficiently convert element attributes to plain object
 */
const objectifyAttributes = (element) => {
    const data = {};
    // Use for...of for better performance with NamedNodeMap
    for (const attribute of element.attributes) {
        data[attribute.name] = attribute.value;
    }
    return data;
};
/**
 * Transform for serializing HTML elements into JSON-compatible format
 * Uses sandboxed document for safe deserialization
 */
const HTMLTransform = {
    type: 'HTMLElement',
    // Optimized HTML element detection
    shouldTransform: (type, obj) => {
        return obj &&
            obj.children &&
            typeof obj.innerHTML === 'string' &&
            typeof obj.tagName === 'string';
    },
    // Serialize HTML element to plain object
    toSerializable: (element) => {
        return {
            tagName: element.tagName.toLowerCase(),
            attributes: objectifyAttributes(element),
            innerHTML: element.innerHTML
        };
    },
    // Deserialize to actual HTML element using sandbox
    fromSerializable: (data) => {
        try {
            const element = getSandbox().createElement(data.tagName);
            element.innerHTML = data.innerHTML;
            for (const attributeName of Object.keys(data.attributes)) {
                try {
                    element.setAttribute(attributeName, data.attributes[attributeName]);
                }
                catch {
                    // no-op
                }
            }
            return element;
        }
        catch {
            return data;
        }
    }
};
export default HTMLTransform;
