import http from 'http';
import util from 'util';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import validator from 'express-validator';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import logger from '../../util/logger.js';
import Storage from '../../util/storage.js';
import * as requtil from '../../util/requtil.js';
import download from '../../util/download.js';
import bundletool from '../../util/bundletool.js';
import rateLimitConfig from '../ratelimit/index.js';
import { accessTokenAuth } from '../api/helpers/securityHandlers.js';
import cookieSession from 'cookie-session';
import db from '../../db/index.js';
// @ts-ignore
import formidable from 'formidable';
export default async function (options) {
    await db.connect();
    const log = logger.createLogger('storage:temp');
    const app = express();
    const server = http.createServer(app);
    const storage = new Storage();
    const route = express.Router();
    app.set('strict routing', true);
    app.set('case sensitive routing', true);
    app.set('trust proxy', true);
    app.use((req, res, next) => {
        res.setHeader('X-mercury-unit', 'storage');
        next();
    });
    app.use(rateLimitConfig);
    app.use(cookieSession({
        name: options.ssid,
        keys: [options.secret]
    }));
    app.use(cookieParser());
    app.use(async (req, res, next) => {
        req.options = {
            secret: options.secret
        };
        try {
            await accessTokenAuth(req);
            next();
        }
        catch (err) {
            if (options.authUrl) {
                res.status(303);
                res.setHeader('Location', options.authUrl);
            }
            else {
                res.status(err.status || 500);
            }
            res.json({ message: err.message });
        }
    });
    app.use(bodyParser.json());
    app.use(validator());
    app.use(route);
    storage.on('timeout', (id) => {
        log.info('Cleaning up inactive resource %s', id);
    });
    route.post('/s/download/:plugin', async (req, res) => {
        try {
            await requtil.validate(req, () => {
                req.checkBody('url').notEmpty();
            });
            const file = await download(req.body.url, {
                dir: options.cacheDir,
                jwt: req.internalJwt
            });
            const storedFile = {
                id: storage.store(file),
                name: file.name
            };
            const plugin = req.params.plugin;
            res.status(201).json({
                success: true,
                resource: {
                    date: new Date(),
                    plugin: plugin,
                    id: storedFile.id,
                    name: storedFile.name,
                    href: util.format('/s/%s/%s%s', plugin, storedFile.id, storedFile.name ? util.format('/%s', path.basename(storedFile.name)) : '')
                }
            });
        }
        catch (err) {
            if (err instanceof requtil.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: 'ValidationError',
                    validationErrors: err.errors
                });
                return;
            }
            log.error('Error storing resource %s', err.stack);
            res.status(500).json({
                success: false,
                error: 'ServerError'
            });
        }
    });
    route.post('/s/upload/:plugin', async (req, res) => {
        try {
            const form = new formidable.IncomingForm({
                maxFileSize: options.maxFileSize
            });
            if (options.saveDir) {
                form.uploadDir = options.saveDir;
            }
            form.on('fileBegin', (name, file) => {
                if (/\.aab$/.test(file.name)) {
                    file.isAab = true;
                }
                const md5 = crypto.createHash('md5');
                file.name = md5.update(file.name).digest('hex');
            });
            const { fields, files } = await new Promise((resolve, reject) => {
                form.parse(req, (err, fields, files) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve({ fields, files });
                    }
                });
            });
            const storedFiles = Object.keys(files).map((field) => {
                const file = files[field];
                log.info('Uploaded %s to %s', file.name, file.path);
                return {
                    field: field,
                    id: storage.store(file),
                    name: file.name,
                    path: file.path,
                    isAab: file.isAab
                };
            });
            const processedFiles = await Promise.all(storedFiles.map((file) => bundletool({
                bundletoolPath: options.bundletoolPath,
                keystore: options.keystore,
                file: file
            })));
            const mapped = Object.create(null);
            processedFiles.forEach((file) => {
                const plugin = req.params.plugin;
                mapped[file.field] = {
                    date: new Date(),
                    plugin: plugin,
                    id: file.id,
                    name: file.name,
                    href: util.format('/s/%s/%s%s', plugin, file.id, file.name ? util.format('/%s', path.basename(file.name)) : '')
                };
            });
            res.status(201).json({
                success: true,
                resources: mapped
            });
        }
        catch (err) {
            log.error('Error storing resource %s', err.stack);
            res.status(500).json({
                success: false,
                error: 'ServerError'
            });
        }
    });
    route.get('/s/blob/:id/:name', (req, res) => {
        const file = storage.retrieve(req.params.id);
        if (file) {
            if (typeof req.query.download !== 'undefined') {
                res.set('Content-Disposition', 'attachment; filename="' + path.basename(file.name) + '"');
            }
            res.set('Content-Type', file.type);
            res.sendFile(file.path);
        }
        else {
            res.sendStatus(404);
        }
    });
    server.listen(options.port);
    log.info('Listening on port %s', options.port);
}
