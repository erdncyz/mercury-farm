// ============================================================================
// Mercury Automation API client — Node 18+ (global fetch), no dependencies.
// Mirrors examples/automation-ruby/mercury_client.rb. Docs: docs/automation-api.md
//
// Mercury Otomasyon API istemcisi — Node 18+ (global fetch), bağımlılık yok.
// examples/automation-ruby/mercury_client.rb ile birebir. Doküman: docs/automation-api.md
//
// Required env vars / Zorunlu ortam değişkenleri:
//   MERCURY_BASE_URL  e.g./örn. https://YOUR_DOMAIN  (without /#/ · /#/ olmadan)
//   MERCURY_TOKEN     UI > Settings > Keys > Access Tokens
// ============================================================================

function requireEnv(name) {
    const value = process.env[name]
    if (!value) {
        throw new Error(`Missing env var / Eksik ortam değişkeni: ${name}`)
    }
    return value
}

export function envSerials() {
    return (process.env.MERCURY_SERIALS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
}

export class MercuryClient {
    constructor({baseUrl = requireEnv('MERCURY_BASE_URL'), token = requireEnv('MERCURY_TOKEN')} = {}) {
        this.baseUrl = baseUrl.replace(/\/+$/, '')
        this.token = token
    }

    // Reserve devices; the run appears on the Builds page under `run`.
    // Two modes: amount+type (filter) OR serials (specific devices).
    // Returns { groupId, devices } — keep groupId for release!
    //
    // Cihaz ayırır; koşum Builds sayfasında `run` adıyla görünür.
    // İki mod: amount+type (filtre) VEYA serials (belirli cihazlar).
    // Dönen değer: { groupId, devices } — release için groupId'yi sakla!
    async reserve({run, timeout = 600, amount = 1, type, serials = [], runUrl}) {
        const params = {run, timeout}
        if (serials.length > 0) {
            params.serials = serials.join(',')
        }
        else {
            params.amount = amount
            params.need_amount = true
            // android | ios — always set for platform-specific runs, otherwise ANY
            // free device (including the other platform) can be picked.
            // android | ios — platforma özel koşularda MUTLAKA ver, yoksa boştaki
            // herhangi bir cihaz (diğer platform dahil) seçilebilir.
            if (type) {
                params.type = type
            }
        }
        if (runUrl) {
            params.runUrl = runUrl
        }

        const body = await this.#request('GET', '/api/v1/autotests', {params})
        const group = body.group
        if (!group?.devices?.length) {
            throw new Error('No device captured / Cihaz ayrılamadı')
        }
        return {groupId: group.id, devices: group.devices}
    }

    // Put device into automation mode. Android → address for `adb connect`.
    // Cihazı automation moduna alır. Android → `adb connect` adresi.
    async useDevice(serial) {
        const body = await this.#request('POST', '/api/v1/autotests/useDevice', {body: {serial}})
        return body.remoteConnectUrl
    }

    // Release the group; run flips to "Finished" on Builds. Always call in finally!
    // Grubu bırakır; Builds'de koşum "Finished" olur. Her zaman finally içinde çağır!
    async release(groupId) {
        if (!groupId) {
            return
        }
        await this.#request('DELETE', '/api/v1/autotests', {params: {group: groupId}})
    }

    async #request(method, path, {params = {}, body} = {}) {
        const url = new URL(this.baseUrl + path)
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, String(value))
        }
        const res = await fetch(url, {
            method,
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${this.token}`,
                ...(body ? {'Content-Type': 'application/json'} : {})
            },
            body: body ? JSON.stringify(body) : undefined
        })
        const text = await res.text()
        if (!res.ok) {
            throw new Error(`Mercury API ${method} ${path} -> HTTP ${res.status}: ${text}`)
        }
        return text ? JSON.parse(text) : {}
    }
}
