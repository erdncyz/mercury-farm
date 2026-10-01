import assert from 'node:assert/strict'
import http from 'node:http'
import {once} from 'node:events'
import test from 'node:test'
import express from 'express'
import startApp from '../lib/units/app/index.js'
import noStore from '../lib/util/no-store.js'

async function useServer(t, server) {
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    }))
    if (!server.listening) {
        await once(server, 'listening')
    }
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    return `http://127.0.0.1:${address.port}`
}

test('runtime API responses are not stored while static caches and cookies are preserved', async(t) => {
    const app = express()
    app.use(['/api/v1', '/app/api/v1'], noStore)
    app.get('/api/v1/devices', (req, res) => res.json({devices: [], cookie: req.headers.cookie}))
    app.get('/app/api/v1/auth_url', (_req, res) => res.json({authUrl: '/auth/mock'}))
    app.get('/api/v1/unauthorized', (_req, res) => res.status(401).json({message: 'Unauthorized'}))
    app.get('/api/v1/error', (_req, res) => res.status(500).json({message: 'Failed'}))
    app.get('/assets/app.js', (_req, res) => {
        res.setHeader('Cache-Control', 'public, max-age=3600')
        res.type('application/javascript').send('window.loaded = true')
    })
    const server = http.createServer(app).listen(0, '127.0.0.1')
    const baseUrl = await useServer(t, server)

    for (const [path, status] of [
        ['/api/v1/devices', 200],
        ['/app/api/v1/auth_url', 200],
        ['/api/v1/unauthorized', 401],
        ['/api/v1/missing', 404],
        ['/api/v1/error', 500]
    ]) {
        await t.test(`${path} sends no-store, including error responses`, async() => {
            const response = await fetch(`${baseUrl}${path}`)
            assert.equal(response.status, status)
            assert.equal(response.headers.get('cache-control'), 'no-store')
            assert.equal(response.headers.get('clear-site-data'), null)
            await response.text()
        })
    }

    await t.test('preserves the incoming session cookie', async() => {
        const response = await fetch(`${baseUrl}/api/v1/devices`, {headers: {Cookie: 'session=existing'}})
        assert.equal((await response.json()).cookie, 'session=existing')
        assert.equal(response.headers.get('set-cookie'), null)
    })

    await t.test('does not override static asset caching', async() => {
        const response = await fetch(`${baseUrl}/assets/app.js`)
        assert.equal(response.status, 200)
        assert.equal(response.headers.get('cache-control'), 'public, max-age=3600')
        await response.text()
    })
})

test('the app unit applies no-store to its real metadata endpoints', async(t) => {
    const createServer = http.createServer.bind(http)
    let server
    t.mock.method(http, 'createServer', (...args) => {
        server = createServer(...args)
        return server
    })

    await startApp({port: 0, authUrl: '/auth/mock', additionalUrl: '/help'})
    assert.ok(server)
    const baseUrl = await useServer(t, server)

    for (const path of ['/app/api/v1/auth_url', '/app/api/v1/additional_url', '/app/api/v1/dummy']) {
        const response = await fetch(`${baseUrl}${path}`)
        assert.equal(response.status, 200)
        assert.equal(response.headers.get('cache-control'), 'no-store')
        await response.text()
    }
})
