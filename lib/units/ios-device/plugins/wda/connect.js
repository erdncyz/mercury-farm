import syrup from '@devicefarmer/stf-syrup'
import logger from '../../../../util/logger.js'
import wdaClient from './client.js'
import httpProxy from 'http-proxy'
import urlformat from '../../../base-device/support/urlformat.js'
import connector, {DEVICE_TYPE} from '../../../base-device/support/connector.js'
import group from '../../../base-device/plugins/group.js'

export default syrup.serial()
    .dependency(wdaClient)
    .dependency(urlformat)
    .dependency(connector)
    .dependency(group)
    .define((options, wdaClient, urlformat, connector, group) => {
        const log = logger.createLogger('ios-device:plugins:wda:connect')
        let proxy = null

        // Remote automation (Appium/WDA) never touches the zmq device channel,
        // so without this the group lease expires mid-run and the device is
        // released by the inactivity timeout. Mirrors the ADB bridge behaviour
        // in device/plugins/connect.ts ('userActivity' -> group.keepalive()).
        const keepalive = () => group.keepalive()

        const plugin = {
            url: urlformat(options.connectUrlPattern, options.connectPort),
            start: () => new Promise((resolve, reject) => {
                proxy = proxy || httpProxy.createProxyServer({target: wdaClient.baseUrl})
                    .on('error', (err) => {
                        log.error('WDA Proxy error: %s', err)
                        reject(err)
                    })
                    .on('proxyReq', keepalive)
                    .on('proxyReqWs', keepalive)
                    .listen(options.connectPort)
                resolve(plugin.url)
            }),

            stop: async() => {
                if (connector.started && proxy) {
                    proxy.close()
                    proxy = null
                }
            }
        }

        return () => connector.init({
            serial: options.serial,
            deviceType: DEVICE_TYPE.IOS,
            handlers: plugin
        })
    })
