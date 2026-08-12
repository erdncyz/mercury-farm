import syrup from '@devicefarmer/stf-syrup'
import wireutil from '../../../wire/util.js'
import router from '../../base-device/support/router.js'
import push from '../../base-device/support/push.js'
import wdaClient from './wda/client.js'
import Logger from '../../../util/logger.js'
import {CopyMessage, PasteMessage} from '../../../wire/wire.js'
const log = Logger.createLogger('ios-device:clipboard')
export default syrup.serial()
    .dependency(router)
    .dependency(push)
    .dependency(wdaClient)
    .define(function(options, router, push, wdaClient) {
        router.on(CopyMessage, function(channel) {
            const reply = wireutil.reply(options.serial)
            wdaClient.getClipBoard()
                .then(clipboard => {
                    push.send([
                        channel,
                        reply.okay(clipboard)
                    ])
                })
                .catch((err) => {
                    log.error('Error on getting clipboard: ', err)
                    push.send([
                        channel,
                        reply.fail('')
                    ])
                })
        })
        router.on(PasteMessage, function(channel, message) {
            const reply = wireutil.reply(options.serial)
            wdaClient.setClipBoard(message.text)
                .then(() => {
                    push.send([
                        channel,
                        reply.okay()
                    ])
                })
                .catch((err) => {
                    log.error('Error on setting clipboard: ', err)
                    push.send([
                        channel,
                        reply.fail(err.message || String(err))
                    ])
                })
        })
    })
