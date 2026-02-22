import syrup from '@devicefarmer/stf-syrup'
import logger from '../../../util/logger.js'
import wire from '../../../wire/index.js'
import wireutil from '../../../wire/util.js'
import push from '../../base-device/support/push.js'
import service from './service.js'
export default syrup.serial()
    .dependency(push)
    .dependency(service)
    .define(function(options, push, service) {
        const log = logger.createLogger('device:plugins:mobile-service')
        function updateMobileServices(data) {
            log.info('Updating mobile services list')
            push.send([
                wireutil.global,
                wireutil.envelope(new wire.GetServicesAvailabilityMessage(options.serial, data.hasGMS, data.hasHMS))
            ])
        }
        function loadMobileServices() {
            log.info('Loading mobile services list')
            const timeoutMs = 8000
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`getMobileServices timeout after ${timeoutMs}ms`)), timeoutMs)
            })

            return Promise.race([service.getMobileServices(), timeoutPromise])
                .then(updateMobileServices)
                .catch((err) => {
                    log.warn('Unable to load mobile services, using defaults: %s', err?.message || err)
                    updateMobileServices({ hasGMS: false, hasHMS: false })
                })
        }
        return loadMobileServices()
    })
