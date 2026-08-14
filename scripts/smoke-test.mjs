#!/usr/bin/env node
/**
 * Mercury runtime smoke test.
 *
 * Guards against the class of breakage where a dependency bump (e.g. a
 * grouped Dependabot PR) lands without runtime validation and silently
 * breaks units at startup. Two real incidents motivated this:
 *   - express 4 -> 5: auth units crashed on bare '*' routes / res.send(401)
 *   - protobufjs 5 -> 7: every Android device worker died at startup
 *     (loadProtoFile/Builder API removed) leaving devices stuck "Preparing"
 *
 * Runs in three contexts with no extra dependencies:
 *   - locally:            node scripts/smoke-test.mjs
 *   - PR CI:              after npm ci on a bare checkout
 *   - release gate:       inside the built Docker image (prod deps only)
 *
 * Steps:
 *   1. Import sweep    – imports every CLI command module, pulling the full
 *                        unit dependency graph. Catches removed exports,
 *                        native binding load failures and import-time crashes.
 *   2. STFService wire – exercises the protobufjs v5 Builder API exactly the
 *                        way lib/units/device/resources/service.js does.
 *   3. Mercury wire    – verifies shell commands and transaction progress
 *                        messages preserve their payloads through protobuf.
 *   4. Express 5 scan  – static scan for route patterns that Express 5
 *                        rejects (unnamed '*' wildcards, res.send(number)).
 *   5. auth-mock boot  – boots the auth-mock unit and performs a real login
 *                        round-trip over HTTP.
 */
import {spawn} from 'node:child_process'
import {readdirSync, readFileSync, statSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(ROOT)

const failures = []

async function step(name, fn) {
    process.stdout.write(`--- ${name}\n`)
    try {
        await fn()
        process.stdout.write(`ok: ${name}\n`)
    }
    catch (err) {
        failures.push(name)
        process.stdout.write(`FAIL: ${name}\n${err?.stack || err}\n`)
    }
}

// ---------------------------------------------------------------------------
// 1. Import sweep: import every CLI command module (each one imports its unit
//    and the unit's full plugin graph at module load time). Skips
//    lib/cli/index.js itself because importing it executes yargs.
// ---------------------------------------------------------------------------
await step('import sweep (all CLI unit modules)', async() => {
    const cliDir = path.join(ROOT, 'lib', 'cli')
    const modules = readdirSync(cliDir, {withFileTypes: true})
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(cliDir, entry.name, 'index.js'))
        .filter(file => {
            try {
                return statSync(file).isFile()
            }
            catch {
                return false
            }
        })
    if (modules.length < 10) {
        throw new Error(`Expected to find CLI modules under lib/cli/, found ${modules.length}`)
    }
    for (const file of modules) {
        const rel = path.relative(ROOT, file)
        try {
            await import(pathToFileURL(file).href)
        }
        catch (err) {
            throw new Error(`Importing ${rel} failed: ${err?.stack || err}`)
        }
    }
    process.stdout.write(`imported ${modules.length} CLI modules\n`)
})

// ---------------------------------------------------------------------------
// 2. STFService wire protocol: must keep working with the pinned protobufjs
//    v5 Builder API (loadProtoFile/build/encodeNB). protobufjs >= 6 removed
//    this API entirely; a bump would make this step throw.
// ---------------------------------------------------------------------------
await step('STFService protobuf wire (protobufjs v5 API)', async() => {
    const {default: ProtoBuf} = await import('protobufjs')
    if (typeof ProtoBuf.loadProtoFile !== 'function') {
        throw new Error('protobufjs no longer exposes loadProtoFile — the installed major is incompatible with the STFService wire code (pin protobufjs to 5.x)')
    }
    const builder = ProtoBuf.loadProtoFile(path.join(ROOT, 'vendor', 'STFService', 'wire.proto'))
    const wire = builder.build().jp.co.cyberagent.stf.proto
    const envelope = new wire.Envelope(null, wire.MessageType.DO_WAKE, new wire.DoWakeRequest().encodeNB())
    const encoded = envelope.encodeNB()
    if (!encoded || encoded.length === 0) {
        throw new Error('Envelope.encodeNB() produced no bytes')
    }
    const decoded = wire.Envelope.decode(encoded)
    if (decoded.type !== wire.MessageType.DO_WAKE) {
        throw new Error('Envelope round-trip failed')
    }
})

// ---------------------------------------------------------------------------
// 3. Mercury transactions: shell commands must preserve command/timeout fields,
//    and shell output does not have a meaningful progress percentage.
// ---------------------------------------------------------------------------
await step('Mercury shell transaction wire', async() => {
    const {default: wireutil} = await import('../lib/wire/util.js')
    const {Envelope, ShellCommandMessage, TransactionProgressMessage} = await import('../lib/wire/wire.js')
    const {Any} = await import('../lib/wire/google/protobuf/any.js')

    const shellPayload = {command: 'echo shell-output', timeout: 10000}
    const shellEnvelope = Envelope.fromBinary(wireutil.tr('tx-smoke', ShellCommandMessage, shellPayload))
    const shellMessage = Any.unpack(shellEnvelope.message, ShellCommandMessage)
    if (shellMessage?.command !== shellPayload.command || shellMessage.timeout !== shellPayload.timeout) {
        throw new Error(`Shell command round-trip failed: ${JSON.stringify(shellMessage)}`)
    }

    const progressEnvelope = Envelope.fromBinary(wireutil.reply('smoke-device').progress('shell-output'))
    const progressMessage = Any.unpack(progressEnvelope.message, TransactionProgressMessage)
    if (progressMessage?.data !== 'shell-output' || progressMessage.progress !== 0) {
        throw new Error(`Transaction progress round-trip failed: ${JSON.stringify(progressMessage)}`)
    }

    const websocketSource = readFileSync(path.join(ROOT, 'lib', 'units', 'websocket', 'index.js'), 'utf8')
    if (/new wire\.ShellCommandMessage\(/.test(websocketSource)) {
        throw new Error('Websocket shell routes still use the legacy positional constructor')
    }
})

// ---------------------------------------------------------------------------
// 4. Express 5 static scan: unnamed '*' wildcards and res.send(number) crash
//    or misbehave on Express 5. Catch regressions before they boot.
// ---------------------------------------------------------------------------
await step('Express 5 route pattern scan (lib/)', async() => {
    const offenders = []
    const walk = (dir) => {
        for (const entry of readdirSync(dir, {withFileTypes: true})) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                walk(full)
            }
            else if (/\.(js|mjs|cjs|ts)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
                const source = readFileSync(full, 'utf8')
                const rel = path.relative(ROOT, full)
                // Route registrations whose string literal contains a '*'
                // that is not a named wildcard ('*name' is valid in v5).
                const routeCall = /\.(?:get|post|put|delete|patch|options|head|all|use)\(\s*(['"`])((?:(?!\1).)*\*(?:(?!\1).)*)\1/g
                for (const match of source.matchAll(routeCall)) {
                    const route = match[2]
                    if (/\*(?![A-Za-z_])/.test(route)) {
                        offenders.push(`${rel}: unnamed wildcard route '${route}' (Express 5 requires '*name')`)
                    }
                }
                for (const match of source.matchAll(/\bres\.send\(\s*(\d+)\s*[,)]/g)) {
                    offenders.push(`${rel}: res.send(${match[1]}) — use res.sendStatus(${match[1]}) (Express 5 removed send(status))`)
                }
            }
        }
    }
    walk(path.join(ROOT, 'lib'))
    if (offenders.length > 0) {
        throw new Error(`Express 5 incompatible patterns found:\n  ${offenders.join('\n  ')}`)
    }
})

// ---------------------------------------------------------------------------
// 5. auth-mock boot + login round-trip: boots a real unit (Express route
//    registration happens at startup) and exchanges credentials for a JWT.
// ---------------------------------------------------------------------------
await step('auth-mock unit boot + JWT round-trip', async() => {
    const port = 20000 + Math.floor(Math.random() * 20000)
    const child = spawn(process.execPath, [
        path.join(ROOT, 'bin', 'mercury.mjs'),
        'auth-mock',
        '--port', String(port),
        '--app-url', `http://127.0.0.1:${port}/`,
        '--secret', 'smoke-test-secret'
    ], {cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe']})

    let output = ''
    child.stdout.on('data', chunk => (output += chunk))
    child.stderr.on('data', chunk => (output += chunk))

    const exited = new Promise((resolve) => {
        child.on('exit', (code, signal) => resolve({code, signal}))
    })

    try {
        const deadline = Date.now() + 30000
        let ready = false
        while (Date.now() < deadline) {
            if (child.exitCode !== null) {
                throw new Error(`auth-mock exited early (code ${child.exitCode}).\n--- output ---\n${output}`)
            }
            try {
                const res = await fetch(`http://127.0.0.1:${port}/auth/contact`, {signal: AbortSignal.timeout(2000)})
                if (res.status === 200) {
                    ready = true
                    break
                }
            }
            catch {
                // not listening yet
            }
            await new Promise(r => setTimeout(r, 500))
        }
        if (!ready) {
            throw new Error(`auth-mock did not start listening within 30s.\n--- output ---\n${output}`)
        }

        const login = await fetch(`http://127.0.0.1:${port}/auth/api/v1/mock`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: 'smoke', email: 'smoke@test.local'}),
            signal: AbortSignal.timeout(5000)
        })
        if (login.status !== 200) {
            throw new Error(`Login returned HTTP ${login.status}.\n--- output ---\n${output}`)
        }
        const body = await login.json()
        if (!body.success || !body.jwt) {
            throw new Error(`Login response missing jwt: ${JSON.stringify(body)}`)
        }
    }
    finally {
        child.kill('SIGTERM')
        await Promise.race([exited, new Promise(r => setTimeout(r, 3000))])
        if (child.exitCode === null) {
            child.kill('SIGKILL')
        }
    }
})

// ---------------------------------------------------------------------------
process.stdout.write('\n')
if (failures.length > 0) {
    process.stdout.write(`SMOKE TEST FAILED: ${failures.join(', ')}\n`)
    process.exit(1)
}
process.stdout.write('SMOKE TEST PASSED\n')
// Hard-exit: the import sweep may leave live handles (zmq contexts, timers).
process.exit(0)
