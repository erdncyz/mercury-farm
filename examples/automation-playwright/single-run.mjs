// ============================================================================
// SINGLE RUN — reserve one device, connect, run your tests, release.
//
// Usage:
//   export MERCURY_BASE_URL=https://YOUR_DOMAIN
//   export MERCURY_TOKEN=...            # UI > Settings > Keys > Access Tokens
//   # Specific device / belirli cihaz: export MERCURY_SERIALS=R58N42ABCDE
//   node single-run.mjs
//
// Note: Playwright only automates ANDROID devices (over adb). For iOS use the
// Appium examples (automation-ruby / automation-java).
//
// ============================================================================
// TEKLİ KOŞUM — tek cihaz ayır, bağlan, testini koştur, bırak.
// Not: Playwright yalnızca ANDROID cihazları sürer (adb üzerinden). iOS için
// Appium örneklerine bak (automation-ruby / automation-java).
// Çoklu/paralel koşum için: parallel-run.mjs
import {execFileSync} from 'node:child_process'
import {MercuryClient, envSerials} from './mercury-client.mjs'

const client = new MercuryClient()
const serials = envSerials()
const runName = process.env.MERCURY_RUN ||
    `single-run-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`

const {groupId, devices} = await client.reserve({
    run: runName,                                       // Builds page name / Builds sayfasındaki isim
    runUrl: process.env.CI_JOB_URL,                     // optional clickable link / opsiyonel link
    timeout: Number(process.env.MERCURY_TIMEOUT || 600), // seconds / saniye
    amount: 1,
    type: 'android',                                     // Playwright → Android only / sadece Android
    serials: serials.slice(0, 1)                         // if given use that device / verildiyse o cihaz
})

const device = devices[0]
console.log(`Reserved / Ayrıldı: ${device.serial} (${device.model} / ${device.version}) — group=${groupId}`)

try {
    const remote = await client.useDevice(device.serial)
    console.log(`remoteConnectUrl: ${remote}`)

    // adb must connect on the machine where Playwright runs.
    // adb, Playwright'ın çalıştığı makinede bağlanmalı.
    execFileSync('adb', ['connect', remote], {stdio: 'inherit'})

    // ---- YOUR TESTS RUN HERE / TESTLERİN BURADA KOŞAR ----------------------
    // Drive Chrome on the device with Playwright's Android support — see
    // web-test-pass.mjs for a complete example.
    // Cihazdaki Chrome'u Playwright'ın Android desteğiyle sür — tam örnek için
    // web-test-pass.mjs dosyasına bak.
    await new Promise(r => setTimeout(r, Number(process.env.MERCURY_HOLD_SECONDS || 30) * 1000))
    // -------------------------------------------------------------------------
}
finally {
    await client.release(groupId) // always released / her durumda bırakılır
    console.log(`Released group / Grup bırakıldı: ${groupId}`)
}
