// ============================================================================
// FAILING EXAMPLE TEST — opens Chrome on the device, then waits for an element
// that DOES NOT exist. The wait times out, the script exits 1 (CI marks it
// red) but the device is STILL released in the finally block.
//
// Usage: same as web-test-pass.mjs
//
// ============================================================================
// BAŞARISIZ ÖRNEK TEST — cihazda Chrome'u açar, sonra VAR OLMAYAN bir element
// bekler. Süre dolunca script exit 1 ile biter (CI kırmızı) ama cihaz finally
// bloğunda YİNE DE bırakılır, asla rezerve takılı kalmaz.
import {withAndroidPage} from './android-session.mjs'

const runName = process.env.MERCURY_RUN ||
    `web-fail-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`

try {
    await withAndroidPage(runName, async ({page}) => {
        // Step 1: navigate / Adım 1: sayfaya git
        await page.goto('https://example.com')
        console.log('Page opened / Sayfa açıldı: https://example.com')

        // Step 2: wait for an element that does not exist — INTENTIONAL FAILURE.
        // Adım 2: olmayan bir element bekle — KASITLI HATA.
        await page.waitForSelector('#nonexistent-element', {timeout: 5000}) // ← throws / hata fırlatır

        console.log('This line is never reached / Bu satıra asla gelinmez')
    })
}
catch (err) {
    console.log('')
    console.log('❌ TEST FAILED (expected) / TEST BAŞARISIZ (beklenen)')
    console.log(`Reason / Sebep: ${String(err).split('\n')[0]}`)
    console.log('Note / Not: device was still released above / cihaz yine de yukarıda bırakıldı')
    process.exit(1)
}
