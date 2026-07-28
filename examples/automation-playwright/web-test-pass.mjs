// ============================================================================
// PASSING EXAMPLE TEST — opens Chrome on the reserved device, navigates to
// example.com, verifies the heading, exits 0. Run flips to "Finished" on Builds.
//
// Usage:
//   npm install
//   export MERCURY_BASE_URL=... MERCURY_TOKEN=...
//   node web-test-pass.mjs
//
// ============================================================================
// BAŞARILI ÖRNEK TEST — ayrılan cihazda Chrome'u açar, example.com'a gider,
// başlığı doğrular, exit 0 ile biter. Builds'de "Finished" olur.
import {withAndroidPage} from './android-session.mjs'

const runName = process.env.MERCURY_RUN ||
    `web-pass-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`

await withAndroidPage(runName, async ({page}) => {
    // Step 1: navigate / Adım 1: sayfaya git
    await page.goto('https://example.com')
    console.log('Page opened / Sayfa açıldı: https://example.com')

    // Step 2: verify the heading / Adım 2: başlığı doğrula
    const heading = await page.textContent('h1', {timeout: 15000})
    if (!heading?.includes('Example Domain')) {
        throw new Error(`Unexpected heading / Beklenmeyen başlık: ${heading}`)
    }
    console.log(`Heading verified / Başlık doğrulandı: "${heading}"`)

    console.log('')
    console.log('✅ TEST PASSED / TEST BAŞARILI')
})
