import {resolve} from 'path'
import logger from '../../../../util/logger.js'
import childProcess from 'child_process'
import assert from 'assert'
import EventEmitter from 'events'
import {tmpdir} from 'os'
import {writeFileSync} from 'fs'
// @ts-ignore
import lockfile from 'proper-lockfile'

const log = logger.createLogger('wda')
const lockFilePath = resolve(tmpdir(), 'wda')
writeFileSync(lockFilePath, '')

const waitNLock = async(attempt = 0) => {
    try {
        return await lockfile.lock(lockFilePath, {
            stale: 10 * 60 * 1000, // 10 min
            update: 1500 // per 1.5 sec
        })
    }
    catch (/** @type {any} */ e) { // if locked - try again later
        if (e.code !== 'ELOCKED' || ++attempt >= 720) { // max 720 attempts - 30 min
            throw e
        }
        await new Promise(r => setTimeout(r, 2500)) // retry per 2.5 sec
        return waitNLock()
    }
}

export default class WDAService {

    /**
     * @param {string | null} path wda path
     */
    constructor(path) {
        if (path) {
            this.wdaPath = path
        }
        else {
            this.wdaPath = resolve(import.meta.dirname, '../../../../../WebDriverAgent')
        }

        /**
         * @type {Object.<string, childProcess.ChildProcess>} amogus
         */
        this.testProcs = {}

        this.developmentTeam = process.env.IOS_WDA_DEVELOPMENT_TEAM?.trim() || ''
        this.bundleId = process.env.IOS_WDA_BUNDLE_ID?.trim() ||
            (this.developmentTeam ? `com.mercury.WebDriverAgentRunner.${this.developmentTeam}` : '')
        if (this.developmentTeam && !/^[A-Z0-9]{10}$/.test(this.developmentTeam)) {
            throw new Error('IOS_WDA_DEVELOPMENT_TEAM must be a 10-character Apple team identifier')
        }
        if (this.bundleId && !/^[A-Za-z0-9.-]+$/.test(this.bundleId)) {
            throw new Error('IOS_WDA_BUNDLE_ID contains unsupported characters')
        }
    }

    signingArguments() {
        if (!this.developmentTeam) {
            return ''
        }
        return ` DEVELOPMENT_TEAM=${this.developmentTeam}` +
            ' CODE_SIGN_STYLE=Automatic' +
            ` PRODUCT_BUNDLE_IDENTIFIER=${this.bundleId}`
    }

    async prepareWda(simulator, udid) {
        const buildProc = childProcess.spawn(
            `xcodebuild -project WebDriverAgent.xcodeproj -scheme WebDriverAgentRunner -destination 'platform=iOS${
                simulator ? ' Simulator' : ''
            },id=${udid}' -allowProvisioningUpdates${this.signingArguments()} build`,
            {cwd: this.wdaPath, shell: true, timeout: 10 * 60 * 1000, stdio: 'inherit'}
        )
        assert(buildProc)
        await EventEmitter.once(buildProc, 'exit')
        if (buildProc.exitCode !== 0) {
            throw Error(`Could not build wda. Exit code is ${buildProc.exitCode}`)
        }
    }

    /**
     *
     * @param {string} udid device udid
     * @param {number=} port
     * @param {number=} screenPort
     * @returns {Promise<void>} nothing
     */
    async start(udid, port, screenPort, shouldBuild = true) {
        await this.cleanup(udid)

        const unlock = await waitNLock()
        try {
            if (shouldBuild) {
                await this.prepareWda(!!port, udid)
            }
            const portArg = port ? ` USE_PORT=${port}` : ''
            const screenPortArg = screenPort ? ` MJPEG_SERVER_PORT=${screenPort}` : ''
            const command =
                'xcodebuild -project WebDriverAgent.xcodeproj ' +
                  '-scheme WebDriverAgentRunner ' +
                  `-destination "id=${udid}" ` +
                  '-allowProvisioningUpdates ' +
                  this.signingArguments() +
                  ' test' +
                   portArg + screenPortArg

            const testproc = childProcess.spawn(command, {cwd: this.wdaPath, shell: true, stdio: 'pipe'})
            this.testProcs[udid] = testproc
            await new Promise((resolve, reject) => { // Wait for server init
                assert(testproc)
                testproc.on('exit', reject)
                testproc?.stdout?.on('data', (chunk) => {
                    const findRes = /ServerURLHere->(.*)<-ServerURLHere/g.exec(chunk)
                    if (findRes) {
                        assert(testproc)
                        testproc.removeListener('exit', reject)
                        resolve(findRes[0])
                    }
                })
                testproc?.stdout?.pipe(process.stdout)
                testproc?.stderr?.pipe(process.stderr)
            })
            testproc.on('exit', async() => {
                await this.cleanup(udid)
                log.error(`WDA process for ${udid} exited`)
            })
        }
        catch (e) {
            await this.cleanup(udid)
            throw e
        }
        finally {
            await unlock()
        }

    }

    /**
     * Restarts the already-built WDA runner without paying the full Xcode build
     * cost. This is used when XCTest's screenshot service gets wedged while the
     * device itself is still connected.
     *
     * @param {string} udid device udid
     * @param {number=} port
     * @param {number=} screenPort
     * @returns {Promise<void>} nothing
     */
    restart(udid, port, screenPort) {
        return this.start(udid, port, screenPort, false)
    }

    /**
     * @param {string} udid device udid
     * @returns {Promise<void>} nothing
     */
    async cleanup(udid) {
        log.debug('Stopped WDA')
        if (!this.testProcs[udid]) {
            return
        }

        const proc = this.testProcs[udid]
        delete this.testProcs[udid]
        proc.kill(9)
        if (proc.exitCode === null) {
            await EventEmitter.once(proc, 'exit')
        }
    }
}
