import syrup from '@devicefarmer/stf-syrup'
import path from 'path'
import {Utils} from '@u4/adbkit'
import logger from '../../../util/logger.js'
import wireutil from '../../../wire/util.js'
import adb from '../support/adb.js'
import router from '../../base-device/support/router.js'
import push from '../../base-device/support/push.js'
import storage from '../../base-device/support/storage.js'
import {FileSystemGetMessage, FileSystemListMessage, FileSystemPushMessage} from '../../../wire/wire.js'

const MEDIA_DIRECTORIES = {
    image: '/sdcard/Pictures/Mercury',
    video: '/sdcard/Movies/Mercury'
}

export function mediaTargetPath(filename, mediaType, timestamp = Date.now()) {
    const directory = MEDIA_DIRECTORIES[mediaType]
    if (!directory) {
        throw new Error('Unsupported media type')
    }

    const basename = path.basename(filename || 'media')
    const safeName = basename
        .normalize('NFKD')
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .replace(/^\.+/, '') || 'media'
    const extension = path.extname(safeName).slice(0, 16)
    const stem = path.basename(safeName, path.extname(safeName)).slice(0, 100) || 'media'

    return `${directory}/${timestamp}-${stem}${extension}`
}

export default syrup.serial()
    .dependency(adb)
    .dependency(router)
    .dependency(push)
    .dependency(storage)
    .define(function(options, adb, router, push, storage) {
        var log = logger.createLogger('device:plugins:filesystem')
        var plugin = Object.create(null)
        plugin.retrieve = function(file, jwt) {
            log.info('Retrieving file "%s"', file)
            return adb.getDevice(options.serial).stat(file)
                .then(function(stats) {
                    return adb.getDevice(options.serial).pull(file)
                        .then(function(transfer) {
                            // We may have add new storage plugins for various file types
                            // in the future, and add proper detection for the mimetype.
                            // But for now, let's just use application/octet-stream for
                            // everything like it's 2001.
                            return storage.store('blob', transfer, {
                                filename: path.basename(file),
                                contentType: 'application/octet-stream',
                                knownLength: stats.size,
                                jwt
                            })
                        })
                })
        }
        router.on(FileSystemGetMessage, function(channel, message) {
            var reply = wireutil.reply(options.serial)
            plugin.retrieve(message.file, message.jwt)
                .then(function(file) {
                    push.send([
                        channel,
                        reply.okay('success', file)
                    ])
                })
                .catch(function(err) {
                    log.warn('Unable to retrieve "%s"', message.file, err.stack)
                    push.send([
                        channel,
                        reply.fail(err.message)
                    ])
                })
        })
        router.on(FileSystemListMessage, function(channel, message) {
            var reply = wireutil.reply(options.serial)
            adb.getDevice(options.serial).readdir(message.dir)
                .then(function(files) {
                    push.send([
                        channel,
                        reply.okay('success', files)
                    ])
                })
                .catch(function(err) {
                    log.warn('Unable to list directory "%s"', message.dir, err.stack)
                    push.send([
                        channel,
                        reply.fail(err.message)
                    ])
                })
        })
        router.on(FileSystemPushMessage, async function(channel, message) {
            const reply = wireutil.reply(options.serial)
            const target = mediaTargetPath(message.filename, message.mediaType)
            const directory = path.posix.dirname(target)
            let cleanup = async function() {}

            try {
                push.send([channel, reply.progress('downloading', 10)])
                const downloaded = await storage.download(message.href, channel, message.jwt)
                cleanup = downloaded.cleanup

                const mkdirOutput = await adb.getDevice(options.serial).shell(['mkdir', '-p', directory])
                await Utils.readAll(mkdirOutput)

                push.send([channel, reply.progress('pushing_media', 40)])
                const transfer = await adb.getDevice(options.serial).push(downloaded.path, target, 0o644)
                let transferError
                transfer.on('error', function(error) {
                    transferError = error
                })
                await transfer.waitForEnd()
                if (transferError) {
                    throw transferError
                }

                const stats = await adb.getDevice(options.serial).stat(target)
                if (!stats.size) {
                    throw new Error('Media file was pushed but has zero size')
                }

                push.send([channel, reply.progress('scanning_media', 90)])
                const scanOutput = await adb.getDevice(options.serial).shell([
                    'am',
                    'broadcast',
                    '-a',
                    'android.intent.action.MEDIA_SCANNER_SCAN_FILE',
                    '-d',
                    `file://${target}`
                ])
                await Utils.readAll(scanOutput)

                log.info('Uploaded media file "%s" to "%s"', message.filename, target)
                push.send([channel, reply.okay(target)])
            }
            catch(err) {
                log.warn('Unable to upload media file "%s": %s', message.filename, err.stack || err)
                push.send([channel, reply.fail(err.message || String(err))])
            }
            finally {
                try {
                    await cleanup()
                }
                catch(cleanupError) {
                    log.warn('Unable to clean up uploaded media temp file: %s', cleanupError.stack || cleanupError)
                }
            }
        })
        return plugin
    })
