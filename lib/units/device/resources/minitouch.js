import util from 'util';
import fs from 'fs';
import syrup from '@devicefarmer/stf-syrup';
import logger from '../../../util/logger.js';
import * as pathutil from '../../../util/pathutil.cjs';
import devutil from '../../../util/devutil.js';
import Resource from './util/resource.js';
import adb from '../support/adb.js';
import abi from '../support/abi.js';
import lifecycle from '../../../util/lifecycle.js';
export default syrup.serial()
    .dependency(adb)
    .dependency(abi)
    .dependency(devutil)
    .define(async (options, adb, abi, devutil) => {
    const log = logger.createLogger('device:resources:minitouch');
    const resources = {
        bin: new Resource({
            src: pathutil.requiredMatch(abi.all.map((supportedAbi) => pathutil.module(util.format('@devicefarmer/minitouch-prebuilt/prebuilt/%s/bin/minitouch%s', supportedAbi, abi.pie ? '' : '-nopie')))),
            dest: [
                '/data/local/tmp/minitouch',
                '/data/data/com.android.shell/minitouch'
            ],
            comm: 'minitouch',
            mode: 0o755
        })
    };
    const removeResource = async (res) => {
        await adb.getDevice(options.serial).execOut(['rm', '-f', res.dest]);
    };
    const pushResource = async (res) => {
        const transfer = await adb.getDevice(options.serial).push(res.src, res.dest, res.mode);
        await transfer.waitForEnd();
    };
    const checkExecutable = async (res) => {
        try {
            const stats = await adb.getDevice(options.serial).stat(res.dest);
            return (stats.mode & fs.constants.S_IXUSR) === fs.constants.S_IXUSR;
        }
        catch (err) {
            return false;
        }
    };
    const installResource = async (res) => {
        if (await checkExecutable(res))
            return;
        log.info('Installing "%s" as "%s"', res.src, res.dest);
        await removeResource(res);
        await pushResource(res);
        const ok = await checkExecutable(res);
        if (!ok) {
            log.error('Pushed "%s" not executable, attempting fallback location', res.comm);
            res.shift();
            return installResource(res);
        }
    };
    const plugin = {
        bin: resources.bin.dest,
        run: (cmd) => adb.getDevice(options.serial).shell(`exec ${resources.bin.dest} ${cmd || ''}`),
        stop: async () => {
            const pid = (await adb.getDevice(options.serial).execOut('pidof minitouch')).toString().trim();
            if (!pid?.length)
                return;
            log.info('Stopping minitouch process %s', pid);
            return adb.getDevice(options.serial).execOut(['kill', '-9', pid]);
        }
    };
    lifecycle.observe(() => plugin.stop());
    await plugin.stop();
    await installResource(resources.bin);
    return plugin;
});
