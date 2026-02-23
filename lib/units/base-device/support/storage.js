import util from 'util';
import url from 'url';
import syrup from '@devicefarmer/stf-syrup';
import logger from '../../../util/logger.js';
import { createReadStream, createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import temp from 'tmp-promise';
import { finished } from 'stream/promises';
import https from "https";
import http from "http";
import FormData from 'form-data';
import { Readable } from 'stream';
function uploadFile(options, stream, meta) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(options.url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        const form = new FormData();
        form.append('file', stream, meta);
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'POST',
            headers: {
                ...options.headers,
                ...form.getHeaders()
            }
        };
        const req = protocol.request(requestOptions, (res) => {
            const chunks = [];
            res.on('data', (chunk) => {
                chunks.push(chunk);
            });
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString();
                resolve({
                    statusCode: res.statusCode || 500,
                    body
                });
            });
        });
        req.on('error', (err) => {
            reject(err);
        });
        form.pipe(req);
    });
}
export default syrup.serial()
    .define((options) => {
    const log = logger.createLogger('base-device:support:storage');
    const plugin = {
        store: async (type, stream, meta) => {
            const uploadUrl = url.resolve(options.storageUrl, util.format('s/upload/%s', type));
            const headers = {
                internal: 'Internal ' + meta.jwt
            };
            try {
                const { statusCode, body } = await uploadFile({ url: uploadUrl, headers }, stream, meta);
                if (statusCode !== 201) {
                    log.error('Upload to %s failed: HTTP %s', uploadUrl, statusCode);
                    log.debug(body);
                    throw new Error(util.format('Upload to %s failed: HTTP %s', uploadUrl, statusCode));
                }
                const result = JSON.parse(body);
                log.info('Uploaded to %s', result.resources.file.href);
                return result.resources.file;
            }
            catch (err) {
                if (err instanceof SyntaxError) {
                    log.error('Invalid JSON in response, err: %s', err);
                    throw err;
                }
                log.error('Upload to %s failed: %s', uploadUrl, err.stack);
                throw err;
            }
        },
        storeByPath: (path, type, meta) => plugin.store(type, createReadStream(path), meta),
        get: async (href, channel, jwt) => {
            const apkUrl = url.resolve(options.storageUrl, href);
            const res = await fetch(apkUrl, {
                headers: {
                    channel,
                    Authorization: `Bearer ${jwt}`,
                    device: options.serial
                }
            });
            log.info('Reading %s returned: %s', apkUrl, res.status);
            if (res.status >= 300) {
                throw Error(`Could not download file. Server returned status = ${res.status}, ${await res.text()}`);
            }
            if (res.body === null) {
                throw Error(`Could not download file. Server returned no body and status = ${res.status}`);
            }
            return Readable.fromWeb(res.body);
        },
        download: async (href, channel, jwt, localPath, name) => {
            const fileStream = await plugin.get(href, channel, jwt);
            const file = (localPath && { path: localPath }) || await temp.file(name ? { name } : {});
            const writeStream = createWriteStream(file.path);
            log.info('Downloading to %s', file.path);
            await finished(fileStream.pipe(writeStream));
            return {
                path: file.path,
                cleanup: () => file?.cleanup ? file.cleanup() : unlink(file.path)
            };
        }
    };
    return plugin;
});
