import net from 'net'
import request from 'request-promise' // TODO: replace with fastest/standart lib
import Promise from 'bluebird'
import syrup from '@devicefarmer/stf-syrup'
import logger from '../../../../util/logger.js'
import * as iosutil from '../util/iosutil.js'
import wireutil from '../../../../wire/util.js'
import wire from '../../../../wire/index.js'
import lifecycle from '../../../../util/lifecycle.js'
import db from '../../../../db/index.js'
import dbapi from '../../../../db/api.js'
import devicenotifier from '../devicenotifier.js'
import info from '../info/index.js'
import push from '../../../base-device/support/push.js'
const LOG_REQUEST_MSG = 'Request has been sent to WDA with data: '

/**
 * @param {any} raw
 * @param {number} fallback
 */
const parseMs = (raw, fallback) => {
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * @param {any} raw
 * @param {number} fallback
 */
const parseNonNegative = (raw, fallback) => {
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

/**
 * @param {any} raw
 * @param {boolean} fallback
 */
const parseBool = (raw, fallback = false) => {
    if (typeof raw === 'boolean') {
        return raw
    }

    if (raw === undefined || raw === null || raw === '') {
        return fallback
    }

    const normalized = String(raw).trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
        return true
    }
    if (['0', 'false', 'no', 'off'].includes(normalized)) {
        return false
    }

    return fallback
}

const DEFAULT_WDA_ACTION_TIMEOUT_MS = parseMs(
    process.env.IOS_TOUCH_ACTION_TIMEOUT_MS || process.env.IOS_WDA_ACTION_TIMEOUT_MS,
    20000
)
const DEFAULT_WDA_REQUEST_TIMEOUT_MS = parseMs(process.env.IOS_WDA_REQUEST_TIMEOUT_MS, 12000)
const DEFAULT_WDA_SESSION_TIMEOUT_MS = parseMs(process.env.IOS_WDA_SESSION_TIMEOUT_MS, 20000)
const DEFAULT_IOS_TYPE_KEY_DELAY_MS = parseMs(process.env.IOS_TYPE_KEY_DELAY_MS, 120)
const DEFAULT_IOS_WDA_MJPEG_QUALITY = parseMs(process.env.IOS_WDA_MJPEG_QUALITY, 10)
const DEFAULT_IOS_WDA_MJPEG_SCALING = parseMs(process.env.IOS_WDA_MJPEG_SCALING, 70)
const DEFAULT_IOS_ACTION_TIMEOUT_RECOVERY_THRESHOLD = parseMs(process.env.IOS_ACTION_TIMEOUT_RECOVERY_THRESHOLD, 3)
const DEFAULT_IOS_TOUCH_RECOVERY_COOLDOWN_MS = parseMs(process.env.IOS_TOUCH_RECOVERY_COOLDOWN_MS, 12000)
const DEFAULT_IOS_WDA_LEAN_MODE = parseBool(process.env.IOS_WDA_LEAN_MODE, false)
const DEFAULT_IOS_WDA_TREE_CACHE_MS = parseNonNegative(process.env.IOS_WDA_TREE_CACHE_MS, 0)
const DEFAULT_IOS_WDA_WAIT_FOR_IDLE_TIMEOUT = parseNonNegative(process.env.IOS_WDA_WAIT_FOR_IDLE_TIMEOUT, 0.5)
const DEFAULT_IOS_WDA_ANIMATION_COOLOFF_TIMEOUT = parseNonNegative(process.env.IOS_WDA_ANIMATION_COOLOFF_TIMEOUT, 0.0)
const DEFAULT_IOS_WDA_MAX_CHILDREN = parseMs(process.env.IOS_WDA_MAX_CHILDREN, 0)
const DEFAULT_IOS_WDA_ELEMENT_RESPONSE_ATTRIBUTES = process.env.IOS_WDA_ELEMENT_RESPONSE_ATTRIBUTES
    || 'type,label,name,enabled,visible,rect'

const requestClient = request.defaults({
    forever: true,
    pool: {
        maxSockets: 64
    }
})
export default syrup.serial()
    .dependency(devicenotifier)
    .dependency(push)
    .dependency(info)
    .define(async(options, notifier, push, info) => {
        const log = logger.createLogger('wdaClient')
        log.info('WdaClient.js initializing...')
        await db.connect()
        const socket = new net.Socket() // wtf why is this not part of the WdaClient object?

        class WdaClient {
            baseUrl = iosutil.getUri(options.wdaHost, options.wdaPort)
            sessionId = null
            orientation = null
            touchDownParams = {}
            tapStartAt = 0

            /** @type {any}*/
            deviceSize = null

            /**
             * @type {{ type: string; value: any; }[]}
             */
            typeKeyActions = []
            typeKeyTimerId = null
            typeKeyDelay = DEFAULT_IOS_TYPE_KEY_DELAY_MS
            runtimeSettings = {
                touchWatchdogTimeoutMs: DEFAULT_WDA_ACTION_TIMEOUT_MS,
                wdaRequestTimeoutMs: DEFAULT_WDA_REQUEST_TIMEOUT_MS,
                wdaSessionTimeoutMs: DEFAULT_WDA_SESSION_TIMEOUT_MS,
                actionTimeoutRecoveryThreshold: DEFAULT_IOS_ACTION_TIMEOUT_RECOVERY_THRESHOLD,
                touchRecoveryCooldownMs: DEFAULT_IOS_TOUCH_RECOVERY_COOLDOWN_MS,
                typeKeyDelayMs: DEFAULT_IOS_TYPE_KEY_DELAY_MS,
                wdaMjpegQuality: DEFAULT_IOS_WDA_MJPEG_QUALITY,
                wdaMjpegScaling: DEFAULT_IOS_WDA_MJPEG_SCALING,
                wdaLeanMode: DEFAULT_IOS_WDA_LEAN_MODE,
                wdaTreeCacheMs: DEFAULT_IOS_WDA_TREE_CACHE_MS,
                wdaWaitForIdleTimeout: DEFAULT_IOS_WDA_WAIT_FOR_IDLE_TIMEOUT,
                wdaAnimationCoolOffTimeout: DEFAULT_IOS_WDA_ANIMATION_COOLOFF_TIMEOUT,
                wdaMaxChildren: DEFAULT_IOS_WDA_MAX_CHILDREN
            }
            upperCase = false
            isSwiping = false
            swipeStartedAt = 0
            pendingSwipeParams = null
            isRotating = false
            lastRotationAt = 0
            lastRotationTarget = null
            consecutiveActionTimeouts = 0
            isRecoveringFromActionTimeout = false
            lastActionRecoveryAt = 0
            sessionStartPromise = null
            sessionRecoveryPromise = null
            deviceType = null
            treeElementsCache = {
                fetchedAt: 0,
                value: null
            }
            getDeviceType() {
                if (this.deviceType !== null) {
                    return this.deviceType
                }
                return dbapi.getDeviceType(options.serial).then((deviceType) => {
                    if (!deviceType) {
                        return null
                    }
                    log.info('Reusing device type value: ', deviceType)
                    this.deviceType = deviceType
                    return this.deviceType
                }).catch((err) => {
                    log.error('Error getting device type from DB')
                    return lifecycle.fatal(err)
                })
            }
            startSession() {
                if (this.sessionStartPromise) {
                    return this.sessionStartPromise
                }

                this.sessionStartPromise = (async() => {
                    log.info('verifying wda session status...')
                    this.getDeviceType()
                    const params = {
                        capabilities: {},
                    }

                    return this.handleRequest({
                        method: 'GET',
                        uri: `${this.baseUrl}/status`,
                        json: true,
                    })
                        .then((statusResponse) => {
                            log.info(`status response: ${JSON.stringify(statusResponse)}`)
                            // Reuse existing session if WDA already has one.
                            if (statusResponse?.sessionId) {
                                this.sessionId = statusResponse.sessionId
                                log.info(`reusing existing wda session: ${this.sessionId}`)
                                this.applyMjpegSettings().catch((err) => {
                                    log.warn('Failed to apply WDA MJPEG settings on reused session: %s', err?.message || err)
                                })
                                this.setStatus(3)
                                if (this.deviceType !== 'Apple TV') {
                                    this.getOrientation()
                                    this.batteryIosEvent()
                                }
                                this.setVersion(null, statusResponse)
                                return this.size()
                            }
                            return null
                        })
                        .then((sizeOrNull) => {
                            if (sizeOrNull) {
                                return sizeOrNull
                            }
                            log.info('starting wda session...')
                            return this.handleRequest({
                                method: 'POST',
                                uri: `${this.baseUrl}/session`,
                                body: params,
                                json: true,
                            })
                                .then((sessionResponse) => {
                                    log.info(`startSession response: ${JSON.stringify(sessionResponse)}`)
                                    this.setVersion(sessionResponse)
                                    this.sessionId = sessionResponse?.sessionId
                                    if (!this.sessionId) {
                                        log.error('WDA did not return a valid sessionId in startSession response')
                                        return Promise.reject(new Error('Missing WDA sessionId'))
                                    }
                                    log.info(`sessionId: ${this.sessionId}`)
                                    this.applyMjpegSettings().catch((err) => {
                                        log.warn('Failed to apply WDA MJPEG settings on new session: %s', err?.message || err)
                                    })
                                    if (this.deviceType !== 'Apple TV') {
                                        this.getOrientation()
                                        this.batteryIosEvent()
                                    }
                                    this.setStatus(3)
                                    return this.size()
                                })
                                .catch((err) => {
                                    log.error('"startSession" No valid response from web driver!', err)
                                    return Promise.reject(err)
                                })
                        })
                })()
                    .finally(() => {
                        this.sessionStartPromise = null
                    })

                return this.sessionStartPromise
            }
            stopSession(opts = {}) {
                log.info('stopping wda session: ', this.sessionId)
                let currentSessionId = this.sessionId
                this.sessionId = null
                if (currentSessionId === null) {
                    return Promise.resolve()
                }
                return this.handleRequest({
                    method: 'DELETE',
                    uri: `${this.baseUrl}/session/${currentSessionId}`,
                    timeout: opts.timeout
                })
            }
            setStatus(status) {
                push.send([
                    wireutil.global,
                    wireutil.envelope(new wire.DeviceStatusMessage(options.serial, status))
                ])
            }
            buildWdaSessionSettings() {
                /** @type {any} */
                const settings = {
                    mjpegServerFramerate: Math.max(1, Number(options.screenFrameRate || 30)),
                    mjpegServerScreenshotQuality: Math.max(1, Math.min(100, this.runtimeSettings.wdaMjpegQuality)),
                    mjpegScalingFactor: Math.max(1, Math.min(100, this.runtimeSettings.wdaMjpegScaling)),
                    mjpegFixOrientation: true
                }

                if (this.runtimeSettings.wdaLeanMode) {
                    settings.shouldUseCompactResponses = true
                    settings.elementResponseAttributes = DEFAULT_IOS_WDA_ELEMENT_RESPONSE_ATTRIBUTES
                }

                settings.waitForIdleTimeout = this.runtimeSettings.wdaWaitForIdleTimeout
                settings.animationCoolOffTimeout = this.runtimeSettings.wdaAnimationCoolOffTimeout

                if (this.runtimeSettings.wdaMaxChildren > 0) {
                    settings.snapshotMaxDepth = this.runtimeSettings.wdaMaxChildren
                }

                return settings
            }
            updateRuntimeSettings(runtimeSettings = {}) {
                this.runtimeSettings = {
                    ...this.runtimeSettings,
                    touchWatchdogTimeoutMs: parseMs(runtimeSettings.touchWatchdogTimeoutMs, this.runtimeSettings.touchWatchdogTimeoutMs),
                    wdaRequestTimeoutMs: parseMs(runtimeSettings.wdaRequestTimeoutMs, this.runtimeSettings.wdaRequestTimeoutMs),
                    wdaSessionTimeoutMs: parseMs(runtimeSettings.wdaSessionTimeoutMs, this.runtimeSettings.wdaSessionTimeoutMs),
                    actionTimeoutRecoveryThreshold: parseMs(runtimeSettings.actionTimeoutRecoveryThreshold, this.runtimeSettings.actionTimeoutRecoveryThreshold),
                    touchRecoveryCooldownMs: parseMs(runtimeSettings.touchRecoveryCooldownMs, this.runtimeSettings.touchRecoveryCooldownMs),
                    typeKeyDelayMs: parseMs(runtimeSettings.typeKeyDelayMs, this.runtimeSettings.typeKeyDelayMs),
                    wdaMjpegQuality: parseMs(runtimeSettings.wdaMjpegQuality, this.runtimeSettings.wdaMjpegQuality),
                    wdaMjpegScaling: parseMs(runtimeSettings.wdaMjpegScaling, this.runtimeSettings.wdaMjpegScaling),
                    wdaLeanMode: parseBool(runtimeSettings.wdaLeanMode, this.runtimeSettings.wdaLeanMode),
                    wdaTreeCacheMs: parseNonNegative(runtimeSettings.wdaTreeCacheMs, this.runtimeSettings.wdaTreeCacheMs),
                    wdaWaitForIdleTimeout: parseNonNegative(runtimeSettings.wdaWaitForIdleTimeout, this.runtimeSettings.wdaWaitForIdleTimeout),
                    wdaAnimationCoolOffTimeout: parseNonNegative(runtimeSettings.wdaAnimationCoolOffTimeout, this.runtimeSettings.wdaAnimationCoolOffTimeout),
                    wdaMaxChildren: parseMs(runtimeSettings.wdaMaxChildren, this.runtimeSettings.wdaMaxChildren)
                }

                this.typeKeyDelay = this.runtimeSettings.typeKeyDelayMs

                log.info('Applied iOS runtime settings: %s', JSON.stringify(this.runtimeSettings))

                this.applyMjpegSettings().catch((err) => {
                    log.warn('Failed to apply runtime WDA MJPEG settings: %s', err?.message || err)
                })
            }
            applyMjpegSettings() {
                if (!this.sessionId || this.deviceType === 'Apple TV') {
                    return Promise.resolve()
                }

                const settings = this.buildWdaSessionSettings()

                log.info('Applying WDA MJPEG settings: %s', JSON.stringify(settings))
                return this.handleRequest({
                    method: 'POST',
                    uri: `${this.baseUrl}/session/${this.sessionId}/appium/settings`,
                    body: {settings},
                    json: true
                })
            }
            typeKey(params) {
            // collect several chars till the space and do mass actions...
                if (!params.value || !params.value[0]) {
                    return
                }
                let [value] = params.value
                // register keyDown and keyUp for current char
                if (this.upperCase) {
                    value = value.toUpperCase()
                }
                this.typeKeyActions.push({type: 'keyDown', value})
                this.typeKeyActions.push({type: 'keyUp', value})
                const handleRequest = () => {
                    const requestParams = {
                        method: 'POST',
                        uri: `${this.baseUrl}/session/${this.sessionId}/actions`,
                        body: {
                            actions: [
                                {
                                    type: 'key',
                                    id: 'keyboard',
                                    actions: this.typeKeyActions,
                                }
                            ]
                        },
                        json: true,
                    }
                    // reset this.typeKeyActions array as we are going to send word or char(s) by timeout
                    this.typeKeyActions = []
                    if (this.typeKeyTimerId) {
                    // reset type key timer as we are going to send word or char(s) by timeout
                        clearTimeout(this.typeKeyTimerId)
                        this.typeKeyTimerId = null
                    }
                    if (this.deviceType !== 'Apple TV') {
                        return this.handleRequest(requestParams)
                    }
                    // Apple TV keys
                    switch (true) {
                    case value === '\v':
                        return this.handleRequest({
                            method: 'POST',
                            uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                            body: {name: 'left'},
                            json: true,
                        })
                    case value === '\f':
                        return this.handleRequest({
                            method: 'POST',
                            uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                            body: {name: 'right'},
                            json: true,
                        })
                    case value === '\0':
                        return this.handleRequest({
                            method: 'POST',
                            uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                            body: {name: 'up'},
                            json: true,
                        })
                    case value === '\x18':
                        return this.handleRequest({
                            method: 'POST',
                            uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                            body: {name: 'down'},
                            json: true,
                        })
                    case value === '\r':
                        return this.handleRequest({
                            method: 'POST',
                            uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                            body: {name: 'select'},
                            json: true,
                        })
                    default:
                        break
                    }
                }
                if (value === ' ') {
                // as only space detected send full word to the iOS device
                    handleRequest()
                }
                else {
                // reset timer to start tracker again from the latest char. Final flush will happen if no types during this.typeKeyDelay ms
                    if (this.typeKeyTimerId) {
                        clearTimeout(this.typeKeyTimerId)
                    }
                    // @ts-ignore
                    this.typeKeyTimerId = setTimeout(handleRequest, this.typeKeyDelay)
                }
            }
            tap(params) {
                this.tapStartAt = (new Date()).getTime()
                this.touchDownParams = params
            }
            homeBtn() {
                if (this.deviceType !== 'Apple TV') {
                    return this.handleRequest({
                        method: 'POST',
                        uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                        body: {name: 'home'},
                        json: true
                    }).then(() => {
                    // #801 Reset coordinates to Portrait mode after pressing home button
                        if (this.orientation && this.orientation !== 'PORTRAIT') {
                            return this.rotation({orientation: 'PORTRAIT'})
                        }
                        return Promise.resolve()
                    })
                }
                else {
                // #749: Fixing button action for AppleTV
                    return this.handleRequest({
                        method: 'POST',
                        uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                        body: {name: 'menu'},
                        json: true
                    })
                }
            }
            swipe(params) {
                const scale = iosutil.swipe(this.orientation, params, this.deviceSize)
                const swipeDurationMs = Math.max(
                    100,
                    Math.min(
                        1500,
                        Number.isFinite(Number(scale.duration)) && Number(scale.duration) > 0
                            ? Number(scale.duration) * 1000
                            : 300
                    )
                )
                const body = {
                    actions: [
                        {
                            type: 'pointer',
                            id: 'finger1',
                            parameters: {pointerType: 'touch'},
                            actions: [
                                {type: 'pointerMove', duration: 0, x: scale.fromX, y: scale.fromY},
                                {type: 'pointerDown', button: 0},

                                {type: 'pointerMove',
                                    duration: swipeDurationMs,
                                    x: scale.toX,
                                    // eslint-disable-next-line no-nested-ternary
                                    y: (scale.fromY < scale.toY) ? scale.toY - (scale.toY / 4) : (scale.fromY - scale.toY >= 50 ? scale.toY + (scale.toY / 4) : scale.toY)},
                                {type: 'pointerUp'}
                            ],
                        }
                    ],
                }
                if (this.deviceType === 'Apple TV') {
                    return log.error('Swipe is not supported')
                }
                let swipeOperation = () => {
                    if (this.isSwiping) {
                        const swipeLockAgeMs = Date.now() - this.swipeStartedAt
                        if (swipeLockAgeMs > 2500) {
                            log.warn('Forcing stale swipe lock release after %sms', swipeLockAgeMs)
                            this.isSwiping = false
                        }
                        else {
                            this.pendingSwipeParams = params
                            return
                        }
                    }

                    if (!this.isSwiping) {
                        this.isSwiping = true
                        this.swipeStartedAt = Date.now()
                        const swipeResetTimeoutMs = this.runtimeSettings.touchWatchdogTimeoutMs + 1000
                        const swipeResetTimer = setTimeout(() => {
                            this.isSwiping = false
                            log.warn('Swipe watchdog reset triggered after %sms', swipeResetTimeoutMs)
                        }, swipeResetTimeoutMs)

                        this.handleRequest({
                            method: 'POST',
                            uri: `${this.baseUrl}/session/${this.sessionId}/actions`,
                            body,
                            json: true,
                        }).then((response) => {
                            log.info('swipe response: ', response)
                        }).catch((err) => {
                            log.warn('Swipe request failed: %s', err?.message || err)
                        }).finally(() => {
                            clearTimeout(swipeResetTimer)
                            this.isSwiping = false
                            this.swipeStartedAt = 0
                            const pendingSwipeParams = this.pendingSwipeParams
                            this.pendingSwipeParams = null
                            if (pendingSwipeParams) {
                                this.swipe(pendingSwipeParams)
                            }
                        })
                    }
                }
                return swipeOperation()
            }
            touchUp() {
                if (!this.isSwiping && this.deviceSize) {
                    let {x, y} = this.touchDownParams
                    const isLandscape = this.orientation === 'LANDSCAPE'
                    x *= isLandscape ? this.deviceSize.height : this.deviceSize.width
                    y *= isLandscape ? this.deviceSize.width : this.deviceSize.height
                    if (((new Date()).getTime() - this.tapStartAt) <= 1000 || !this.tapStartAt) {
                        const body = {
                            actions: [
                                {
                                    type: 'pointer',
                                    id: 'finger1',
                                    parameters: {pointerType: 'touch'},
                                    actions: [
                                        {type: 'pointerMove', duration: 0, x, y},
                                        {type: 'pointerDown', button: 0},
                                        {type: 'pointerMove', duration: 0, x, y},
                                        {type: 'pointerUp'}
                                    ],
                                }
                            ],
                        }
                        if (this.deviceType !== 'Apple TV') {
                            log.info(options.deviceName)
                            return this.handleRequest({
                                method: 'POST',
                                uri: `${this.baseUrl}/session/${this.sessionId}/actions`,
                                body,
                                json: true,
                            })
                        // else if (deviceType === 'Watch_OS') {...}
                        }
                        else {
                        // Avoid crash, wait until width/height values are available
                            if (x >= 0 && y >= 0) {
                                switch (true) {
                                case x < 300:
                                    return this.handleRequest({
                                        method: 'POST',
                                        uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                                        body: {name: 'left'},
                                        json: true,
                                    })
                                case x > 1650:
                                    return this.handleRequest({
                                        method: 'POST',
                                        uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                                        body: {name: 'right'},
                                        json: true,
                                    })
                                case y > 850:
                                    return this.handleRequest({
                                        method: 'POST',
                                        uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                                        body: {name: 'down'},
                                        json: true,
                                    })
                                case y < 250:
                                    return this.handleRequest({
                                        method: 'POST',
                                        uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                                        body: {name: 'up'},
                                        json: true,
                                    })
                                default:
                                    return this.handleRequest({
                                        method: 'POST',
                                        uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                                        body: {name: 'select'},
                                        json: true,
                                    })
                                }
                            }
                        }
                    }
                    else {
                        if (this.deviceType === 'Apple TV') {
                            return log.error('Holding tap is not supported')
                        }
                        return this.handleRequest({
                            method: 'POST',
                            uri: `${this.baseUrl}/session/${this.sessionId}/wda/touchAndHold`,
                            body: {x, y, duration: 1},
                            json: true,
                        })
                    }
                }
            }
            tapDeviceTreeElement(message) {
                const params = {
                    using: 'link text',
                    value: 'label=' + message.label,
                }
                return new Promise((resolve, reject) => {
                    this.handleRequest({
                        method: 'POST',
                        uri: `${this.baseUrl}/session/${this.sessionId}/elements`,
                        body: params,
                        json: true
                    })
                        .then(response => {
                            const element = response?.value?.[0]
                            const ELEMENT = element && element.ELEMENT
                            if (!ELEMENT) {
                                throw new Error('Unable to find iOS tree element by label')
                            }
                            return this.handleRequest({
                                method: 'POST',
                                uri: `${this.baseUrl}/session/${this.sessionId}/element/${ELEMENT}/click`,
                                body: {},
                                json: true
                            })
                        })
                        .catch(err => {
                            log.error(err)
                        })
                })
            }
            doubleClick() {
                if (!this.isSwiping && this.deviceSize) {
                    const {x, y} = this.touchDownParams
                    const params = {
                        x: x * this.deviceSize.width,
                        y: y * this.deviceSize.height
                    }
                    return this.handleRequest({
                        method: 'POST',
                        uri: `${this.baseUrl}/session/${this.sessionId}/wda/doubleTap`,
                        body: params,
                        json: true
                    })
                }
            }
            size() {
                if (this.deviceSize !== null) {
                    return this.deviceSize
                }
                log.info('getting device window size...')
                const {width, height, scale} = info.extendedInfo

                if (!width || !height || !scale) {
                    return null
                }

                // Set device size based on orientation, default is PORTRAIT
                if (this.orientation === 'PORTRAIT' || !this.orientation) {
                    this.deviceSize = {height: height / scale, width: width / scale}
                }
                else if (this.orientation === 'LANDSCAPE') {
                    this.deviceSize = {height: width / scale, width: height / scale}
                }
                else if (this.deviceType === 'Apple TV') {
                    this.deviceSize = {height: height, width: width}
                }
                return this.deviceSize
            }
            setVersion(currentSession, statusResponse = null) {
                const sdkVersion = currentSession?.value?.capabilities?.sdkVersion
                    || currentSession?.value?.os?.version
                    || statusResponse?.value?.os?.sdkVersion
                    || statusResponse?.value?.os?.version
                if (!sdkVersion) {
                    log.warn('WDA sdkVersion is missing in session/status response')
                    return
                }
                log.info('Setting current device version: ' + sdkVersion)
                push.send([
                    wireutil.global,
                    wireutil.envelope(new wire.SdkIosVersion(options.serial, sdkVersion))
                ])
            }
            openUrl(message) {
                const params = {
                    url: message.url
                }
                return this.handleRequest({
                    method: 'POST',
                    uri: `${this.baseUrl}/session/` + this.sessionId + '/url',
                    body: params,
                    json: true
                })
            }
            screenshot() {
                return new Promise((resolve, reject) => {
                    this.handleRequest({
                        method: 'GET',
                        uri: `${this.baseUrl}/screenshot`,
                        json: true
                    })
                        .then(response => {
                            try {
                                resolve(response)
                            }
                            catch (e) {
                                reject(e)
                            }
                        })
                        .catch(err => reject(err))
                })
            }
            getOrientation() {
                return this.handleRequest({
                    method: 'GET',
                    uri: `${this.baseUrl}/session/${this.sessionId}/orientation`,
                    json: true
                }).then((orientationResponse) => {
                    const nextOrientation = orientationResponse?.value
                    if (!nextOrientation) {
                        log.warn('WDA orientation response is empty')
                        return
                    }
                    this.orientation = nextOrientation
                    log.info('Current device orientation: ' + this.orientation)
                })
            }
            rotation(params) {
                const targetOrientation = params?.orientation
                if (!targetOrientation) {
                    return Promise.resolve()
                }

                const now = Date.now()
                const isDuplicateRotation =
                    this.lastRotationTarget === targetOrientation &&
                    (now - this.lastRotationAt) < 3000

                if (this.isRotating || isDuplicateRotation) {
                    return Promise.resolve()
                }

                this.lastRotationAt = now
                this.lastRotationTarget = targetOrientation
                this.orientation = targetOrientation
                this.isRotating = true
                return this.handleRequest({
                    method: 'POST',
                    uri: `${this.baseUrl}/session/${this.sessionId}/orientation`,
                    body: params,
                    json: true
                }).then(val => {
                    this.getOrientation()
                    this.size()
                    // @ts-ignore
                    const rotationDegrees = iosutil.orientationToDegrees(this.orientation)
                    push.send([
                        wireutil.global,
                        wireutil.envelope(new wire.RotationEvent(options.serial, rotationDegrees))
                    ])
                    this.isRotating = false
                }).catch((err) => {
                    this.isRotating = false
                    return Promise.reject(err)
                })
            }
            batteryIosEvent() {
                return this.handleRequest({
                    method: 'GET',
                    uri: `${this.baseUrl}/session/${this.sessionId}/wda/batteryInfo`,
                    json: true,
                })
                    .then((batteryInfoResponse) => {
                        if (!batteryInfoResponse?.value) {
                            log.warn('WDA battery response is empty')
                            return
                        }
                        let batteryState = iosutil.batteryState(batteryInfoResponse.value.state)
                        let batteryLevel = iosutil.batteryLevel(batteryInfoResponse.value.level)
                        push.send([
                            wireutil.global,
                            wireutil.envelope(new wire.BatteryEvent(options.serial, batteryState, 'good', 'usb', batteryLevel, 1, 0.0, 5))
                        ])
                    })
                    .then(() => {
                        log.info('Setting new device battery info')
                    })
                    .catch((err) => log.info(err))
            }
            getTreeElements() {
                if (this.runtimeSettings.wdaTreeCacheMs > 0) {
                    const cacheAge = Date.now() - this.treeElementsCache.fetchedAt
                    if (this.treeElementsCache.value && cacheAge <= this.runtimeSettings.wdaTreeCacheMs) {
                        return Promise.resolve(this.treeElementsCache.value)
                    }
                }

                return this.handleRequest({
                    method: 'GET',
                    uri: `${this.baseUrl}/source?format=json`,
                    json: true
                }).then((response) => {
                    this.treeElementsCache = {
                        fetchedAt: Date.now(),
                        value: response
                    }
                    return response
                })
            }
            pressButtonSendRequest(params) {
                return this.handleRequest({
                    method: 'POST',
                    uri: `${this.baseUrl}/session/${this.sessionId}/wda/pressButton`,
                    body: {
                        name: params
                    },
                    json: true
                })
            }
            switchCharset() {
                this.upperCase = !this.upperCase
                log.info(this.upperCase)
            }
            appActivate(params) {
                return this.handleRequest({
                    method: 'POST',
                    uri: `${this.baseUrl}/session/${this.sessionId}/wda/apps/activate`,
                    body: {
                        bundleId: params
                    },
                    json: true
                })
            }
            pressPower() {
                return this.handleRequest({
                    method: 'GET',
                    uri: `${this.baseUrl}/session/${this.sessionId}/wda/locked`,
                    json: true
                })
                    .then(response => {
                        let url = ''
                        if (response.value === true) {
                            url = `${this.baseUrl}/session/${this.sessionId}/wda/unlock`
                        }
                        else {
                            url = `${this.baseUrl}/session/${this.sessionId}/wda/lock`
                        }
                        return this.handleRequest({
                            method: 'POST',
                            uri: url,
                            json: true
                        })
                    })
            }
            getClipBoard() {
                return this.handleRequest({
                    method: 'POST',
                    uri: `${this.baseUrl}/session/${this.sessionId}/wda/getPasteboard`
                })
                    .then(res => {
                        let clipboard = Buffer.from(JSON.parse(res).value, 'base64').toString('utf-8')
                        return clipboard || 'No clipboard data'
                    })
            }
            handleRequest(requestOpt) {
                const requestUri = String(requestOpt?.uri || '')
                const requestMethod = String(requestOpt?.method || 'GET').toUpperCase()
                const isNullSessionUri = /\/session\/null(\/|$)/.test(requestUri)

                const isSessionBootstrapCall = requestMethod === 'POST' && /\/session$/.test(requestUri)
                const isActionCall = /\/actions$/.test(requestUri)
                    || /\/wda\/(doubleTap|touchAndHold)$/.test(requestUri)
                    || /\/element\/.+\/click$/.test(requestUri)

                const timeout = requestOpt?.timeout || (
                    isSessionBootstrapCall
                        ? this.runtimeSettings.wdaSessionTimeoutMs
                        : isActionCall
                            ? this.runtimeSettings.touchWatchdogTimeoutMs
                            : this.runtimeSettings.wdaRequestTimeoutMs
                )

                const requestOptions = {
                    ...requestOpt,
                    timeout
                }

                return new Promise((resolve, reject) => {
                    requestClient(requestOptions)
                        .then(response => {
                            if (isActionCall) {
                                this.consecutiveActionTimeouts = 0
                            }
                            log.verbose(LOG_REQUEST_MSG, JSON.stringify(requestOptions))
                            return resolve(response)
                        })
                        .catch(async(err) => {
                            const errMes = err?.error?.value?.message
                            const isTimeout = err?.name === 'RequestError' && /ETIMEDOUT|ESOCKETTIMEDOUT/i.test(err?.message || '')

                            if (isNullSessionUri) {
                                if (!this.sessionStartPromise) {
                                    this.startSession().catch((sessionStartErr) => {
                                        log.warn('Failed to recover from null session URI: %s', sessionStartErr?.message || sessionStartErr)
                                    })
                                }
                                resolve()
                                return
                            }

                            if (!errMes || [
                                'Timed out while waiting until the screen gets locked',
                                'unlocked',
                                'Unable To Rotate Device'
                            ].includes(errMes)) {
                                if (isTimeout) {
                                    log.warn('WDA request timeout (%sms): %s %s', timeout, requestMethod, requestUri)
                                    if (isActionCall && !requestOpt.__retryActionOnce) {
                                        log.warn('Retrying timed out WDA action request once: %s %s', requestMethod, requestUri)
                                        resolve(
                                            await this.handleRequest({
                                                ...requestOpt,
                                                __retryActionOnce: true
                                            })
                                        )
                                        return
                                    }
                                    if (isActionCall) {
                                        this.consecutiveActionTimeouts += 1
                                        if (this.consecutiveActionTimeouts >= this.runtimeSettings.actionTimeoutRecoveryThreshold && !this.isRecoveringFromActionTimeout) {
                                            const now = Date.now()
                                            const elapsedSinceLastRecovery = now - this.lastActionRecoveryAt
                                            if (elapsedSinceLastRecovery < this.runtimeSettings.touchRecoveryCooldownMs) {
                                                log.warn('WDA action timeout recovery is cooling down (%sms remaining)', this.runtimeSettings.touchRecoveryCooldownMs - elapsedSinceLastRecovery)
                                                resolve()
                                                return
                                            }

                                            this.isRecoveringFromActionTimeout = true
                                            this.lastActionRecoveryAt = now
                                            log.warn('WDA action timeout threshold reached, restarting WDA session')
                                            if (!this.sessionRecoveryPromise) {
                                                this.sessionRecoveryPromise = this.stopSession({timeout: 1000})
                                                    .catch((sessionStopErr) => {
                                                        log.warn('Failed stopping WDA session during recovery: %s', sessionStopErr?.message || sessionStopErr)
                                                    })
                                                    .then(() => this.startSession())
                                                    .catch((sessionStartErr) => {
                                                        log.warn('Failed starting WDA session during recovery: %s', sessionStartErr?.message || sessionStartErr)
                                                    })
                                                    .finally(() => {
                                                        this.consecutiveActionTimeouts = 0
                                                        this.isRecoveringFromActionTimeout = false
                                                        this.sessionRecoveryPromise = null
                                                    })
                                            }
                                        }
                                    }
                                }
                                resolve()
                                return
                            }

                            if (errMes.includes('Session does not exist')) {
                                await this.startSession()
                                resolve(
                                    await this.handleRequest(requestOpt)
                                )
                                return
                            }

                            if (errMes.includes('StatusCodeError')) {
                                log.error(`WDA request failed: ${err}`)
                            }
                            else {
                                log.warn(`Unexpected WDA request error: ${err?.message || err}`)
                            }

                            resolve() // TODO: or reject?

                            // TODO: refactoring needed
                            // #409: capture wda/appium crash asap and exit with status 1 from Mercury
                            // notifier.setDeviceTemporaryUnavialable(err)
                            // notifier.setDeviceAbsent(err)
                            // lifecycle.fatal(err) // exit with error code 1 is the best way to activate valid auto-healing steps with container(s) restart
                        })
                })
            }
            pressButton(key) {
                switch (key) {
                case 'settings':
                    if (this.deviceType === 'Apple TV') {
                        return this.appActivate('com.apple.TVSettings')
                    }
                    return this.appActivate('com.apple.Preferences')
                case 'store':
                    if (this.deviceType === 'Apple TV') {
                        return this.appActivate('com.apple.TVAppStore')
                    }
                    return this.appActivate('com.apple.AppStore')
                case 'volume_up':
                    return this.pressButtonSendRequest('volumeUp')
                case 'volume_down':
                    return this.pressButtonSendRequest('volumeDown')
                case 'power':
                    return this.pressPower()
                case 'camera':
                    return this.pressButtonSendRequest('camera')
                case 'search':
                    if (this.deviceType === 'Apple TV') {
                        return this.appActivate('com.apple.TVSearch')
                    }
                    return this.appActivate('com.apple.mobilesafari')
                case 'finder':
                    return this.appActivate('com.apple.findmy')
                case 'home':
                    return this.homeBtn()
                case 'mute': {
                    let i
                    for (i = 0; i < 16; i++) {
                        Promise.delay(1000).then(() => {
                            this.pressButtonSendRequest('volumeDown')
                        })
                    }
                    return true
                }
                case 'switch_charset': {
                    return this.switchCharset()
                }
                // Media button requests in case there's future WDA compatibility
                case 'media_play_pause':
                    return log.error('Non-existent button in WDA')
                case 'media_stop':
                    return log.error('Non-existent button in WDA')
                case 'media_next':
                    return log.error('Non-existent button in WDA')
                case 'media_previous':
                    return log.error('Non-existent button in WDA')
                case 'media_fast_forward':
                    return log.error('Non-existent button in WDA')
                case 'media_rewind':
                    return log.error('Non-existent button in WDA')
                default:
                    return this.pressButtonSendRequest(key)
                }
            }
        }

        /*
        * WDA MJPEG connection is stable enough to be track status wda server itself.
        * As soon as connection is closed or an error is detected we have to restart Mercury
        */
        function connectToWdaMjpeg(options) {
            log.info('connecting to WdaMjpeg')
            socket.connect(options.mjpegPort, options.wdaHost, () => {
                log.info(`Connected to WdaMjpeg ${options.wdaHost}:${options.mjpegPort}`)
            })
            // #410: Use status 6 (preparing) on WDA startup
            push.send([
                wireutil.global,
                wireutil.envelope(new wire.DeviceStatusMessage(options.serial, 6))
            ])
        }

        let retry = 4
        async function wdaMjpegCloseEventHandler(hadError) {
            console.log(`WdaMjpeg connection was closed${hadError ? ' by error' : ''}`)
            notifier.setDeviceAbsent('WdaMjpeg connection is lost')

            if (!retry) {
                push.send([
                    wireutil.global,
                    wireutil.envelope(new wire.DeviceStatusMessage(options.serial, 3))
                ])
                lifecycle.fatal('WdaMjpeg connection is lost')
            }

            await new Promise(r => setTimeout(r, 2000))
            --retry
            connectToWdaMjpeg(options)
        }
        socket.on('close', wdaMjpegCloseEventHandler)
        connectToWdaMjpeg(options)
        return new WdaClient()
    })
