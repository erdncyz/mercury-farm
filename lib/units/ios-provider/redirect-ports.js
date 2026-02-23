import * as usbmux from '@irdk/usbmux';
import logger from '../../util/logger.js';
const log = logger.createLogger('ios:redirect-ports');
/**
 * Open ports from an iOS device to a host.
 * Currently, works only for unix based systems.
 * Returns stop function.
 */
export async function openPort(devicePort, listenPort, udid, usbmuxPath) {
    usbmux.address.path = usbmuxPath;
    const relay = new usbmux.Relay(devicePort, listenPort, {
        udid: udid
    });
    await new Promise((resolve, reject) => {
        relay.on('ready', (...args) => {
            relay.removeListener('error', reject);
            resolve(args);
        });
        relay.on('error', reject);
    });
    return () => new Promise((resolve, reject) => {
        relay.on('close', () => {
            relay.removeListener('error', reject);
            resolve();
        });
        relay.on('error', reject);
        relay.stop();
    });
}
