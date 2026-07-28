// ============================================================================
// PARALLEL RUN — reserve N devices in one group, drive each concurrently
// (Promise.all), release the group once at the end.
//
// Usage:
//   export MERCURY_BASE_URL=... MERCURY_TOKEN=...
//   export MERCURY_AMOUNT=2             # non-admins max 2 / admin değilsen en fazla 2
//   # Specific devices / belirli cihazlar: export MERCURY_SERIALS=SERIAL_A,SERIAL_B
//   node parallel-run.mjs
//
// ============================================================================
// ÇOKLU (PARALEL) KOŞUM — N cihazı tek grupta ayır, hepsini eşzamanlı sür
// (Promise.all), sonunda grubu tek seferde bırak.
// Tekli koşum için: single-run.mjs · iOS için Appium örneklerine bak.
import {execFileSync} from 'node:child_process'
import {MercuryClient, envSerials} from './mercury-client.mjs'

const client = new MercuryClient()
const serials = envSerials()
const runName = process.env.MERCURY_RUN ||
    `parallel-run-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`

const {groupId, devices} = await client.reserve({
    run: runName,
    runUrl: process.env.CI_JOB_URL,
    timeout: Number(process.env.MERCURY_TIMEOUT || 900),
    amount: Number(process.env.MERCURY_AMOUNT || 2),
    type: 'android',                                     // Playwright → Android only / sadece Android
    serials                                              // if given, exactly these / verildiyse tam bunlar
})

console.log(`Group ${groupId} — ${devices.length} devices: ${devices.map(d => d.serial).join(', ')}`)

try {
    const results = await Promise.allSettled(devices.map(async device => {
        const remote = await client.useDevice(device.serial)
        console.log(`[${device.serial}] remoteConnectUrl: ${remote}`)

        // adb must connect on the machine where Playwright runs.
        // adb, Playwright'ın çalıştığı makinede bağlanmalı.
        execFileSync('adb', ['connect', remote], {stdio: 'inherit'})

        // ---- TESTS FOR THIS DEVICE / BU CİHAZIN TESTLERİ --------------------
        await new Promise(r => setTimeout(r, Number(process.env.MERCURY_HOLD_SECONDS || 30) * 1000))
        // ----------------------------------------------------------------------
        console.log(`[${device.serial}] done / tamamlandı`)
    }))

    const errors = results.filter(r => r.status === 'rejected')
    for (const err of errors) {
        console.error(`ERROR / HATA: ${err.reason}`)
    }
    if (errors.length > 0) {
        throw new Error(`${errors.length} devices had errors / cihazda hata oluştu`)
    }
}
finally {
    await client.release(groupId) // one call frees the whole group / tek çağrı tüm grubu bırakır
    console.log(`Released group / Grup bırakıldı: ${groupId}`)
}
