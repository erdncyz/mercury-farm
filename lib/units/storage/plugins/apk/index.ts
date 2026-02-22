import http from 'http'
import https from 'https'
import url from 'url'
import util from 'util'
import express, {Response, Router} from 'express'
import logger from '../../../../util/logger.js'
import download from '../../../../util/download.js'
import manifest from './task/manifest.js'
import rateLimitConfig from '../../../ratelimit/index.js'
import cookieSession from 'cookie-session'
import csrf from 'csurf'
import * as apiutil from '../../../../util/apiutil.js'

interface ApkPluginOptions {
    cacheDir: string
    storageUrl: string
    port: number
    ssid: string
    secret: string
}


/**
 * Proxy HTTP/HTTPS request and pipe to response
 */
function proxyRequest(
    targetUrl: string,
    headers: http.IncomingHttpHeaders,
    res: Response,
    timeout?: number
): void {
    const parsedUrl = new URL(targetUrl)
    const protocol = parsedUrl.protocol === 'https:' ? https : http

    const options: http.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
            ...headers,
            host: parsedUrl.host
        },
        ...(timeout && { timeout })
    }

    const proxyReq = protocol.request(options, (proxyRes) => {
        // Forward status code and headers
        res.status(proxyRes.statusCode || 200)

        if (proxyRes.headers) {
            Object.entries(proxyRes.headers).forEach(([key, value]) => {
                if (value !== undefined) {
                    res.setHeader(key, value)
                }
            })
        }

        // Pipe the response
        proxyRes.pipe(res)
    })

    proxyReq.on('error', (err) => {
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Failed to proxy request'
            })
        }
    })

    proxyReq.end()
}

export default function(options: ApkPluginOptions): void {
    const log = logger.createLogger('storage:plugins:apk')
    const app = express()
    const server = http.createServer(app)
    const route: Router = express.Router()

    log.info('cacheDir located at ' + options.cacheDir)

    app.use(rateLimitConfig)
    app.use(cookieSession({
        name: options.ssid,
        keys: [options.secret]
    }))
    app.use(csrf())
    app.use(route)
    app.set('strict routing', true)
    app.set('case sensitive routing', true)
    app.set('trust proxy', true)

    route.get('/s/apk/:id/:name/manifest', async(req, res) => {
        const orig = util.format('/s/blob/%s/%s', req.params.id, req.params.name)
        const downloadUrl = url.resolve(options.storageUrl, orig)

        log.info(`Downloading apk from ${downloadUrl}`)

        try {
            const file = await download(downloadUrl, {
                dir: options.cacheDir
            }, req.headers)

            log.info('Got apk from %s in %s', downloadUrl, file.path)
            const data = await manifest(file)

            res.status(200).json({
                success: true,
                manifest: data
            })
        } catch (err) {
            log.error('Unable to read manifest of "%s": %s', req.params.id, err)
            res.status(400).json({success: false})
        }
    })

    route.get('/s/apk/:id/:name', (req, res) => {
        const targetUrl = url.resolve(
            options.storageUrl,
            util.format('/s/blob/%s/%s', req.params.id, req.params.name)
        )
        proxyRequest(targetUrl, req.headers, res, apiutil.INSTALL_APK_WAIT)
    })

    server.listen(options.port)
    log.info('Listening on port %s', options.port)
}
