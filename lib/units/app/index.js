import http from 'http'
import express from 'express'
import bodyParser from 'body-parser'
import serveStatic from 'serve-static'
import logger from '../../util/logger.js'
import * as pathutil from '../../util/pathutil.cjs'
import rateLimitConfig from '../ratelimit/index.js'
import * as markdownServe from 'markdown-serve'
export default (async function (options) {
    const log = logger.createLogger('app')
    let app = express()
    try {
        const Sentry = await import('@sentry/node')

        Sentry.setupExpressErrorHandler(app)
    }
    catch {
        log.error('Could not add sentry error handler')
    }
    app.use(function (req, res, next) {
        res.setHeader('X-mercury-unit', 'app')
        next()
    })
    app.get('/debug-sentry', function mainHandler(req, res) {
        throw new Error('My first Sentry error!')
    })
    let server = http.createServer(app)
    app.use('/static/wiki', markdownServe.middleware({
        rootDirectory: pathutil.root('node_modules/@devicefarmer/stf-wiki'),
        view: 'docs'
    }))
    app.set('strict routing', true)
    app.set('case sensitive routing', true)
    app.set('trust proxy', true)
    app.use(rateLimitConfig)

    app.get('/auth', function (req, res) {
        res.redirect(options.authUrl)
    })

    const staticOptions = {
        fallthrough: true,
        setHeaders: (res, path) => {
            if (path.endsWith('.html')) {
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
                res.setHeader('Pragma', 'no-cache')
                res.setHeader('Expires', '0')
            }
        }
    }

    app.use('/', serveStatic(pathutil.reactFrontend('dist'), staticOptions))
    app.use('/assets', serveStatic(pathutil.reactFrontend('dist/assets'), { fallthrough: true }))
    app.use('/locales', serveStatic(pathutil.reactFrontend('dist/locales'), { fallthrough: true }))

    app.get('/app/api/v1/auth_url', function (req, res) {
        res.send({
            authUrl: options.authUrl
        })
    })

    app.get('/app/api/v1/additional_url', function (req, res) {
        res.send({
            success: true,
            additionalUrl: options.additionalUrl
        })
    })

    // This needs to be before the csrf() middleware or we'll get nasty
    // errors in the logs. The dummy endpoint is a hack used to enable
    // autocomplete on some text fields.
    app.all('/app/api/v1/dummy', function (req, res) {
        res.send('OK')
    })
    app.use(bodyParser.json())

    app.use((req, res, next) => {
        if (!req.path.includes('api')) {
            // JS bundle/chunk missing (likely due to stale cached HTML)
            // Send a script to force the browser to reload the page and fetch the new HTML.
            if (req.path.endsWith('.js') && req.path.startsWith('/assets/')) {
                const reloadScript = `
                    console.warn("Stale chunk requested: ${req.path}. Forcing cache-busted reload.");
                    if(typeof window !== "undefined") {
                        var url = new URL(window.location.href);
                        url.searchParams.set("v", Date.now());
                        window.location.href = url.toString();
                    }
                `;
                res.type('application/javascript').status(200).send(reloadScript)
                return
            }

            res.status(500).send('Frontend build not found in "ui" folder')
            return
        }
        next()
    })

    server.listen(options.port)
    log.info('Listening on port %d', options.port)
})
