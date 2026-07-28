// ============================================================================
// Shared helper for the example tests: reserve 1 Android device on Mercury,
// adb connect, attach Playwright to it, yield {device, page}, then ALWAYS
// close + release. Playwright's Android support is experimental and drives
// Chrome on the device — make sure Chrome is installed and adb works.
//
// Örnek testler için ortak yardımcı: Mercury'den 1 Android cihaz ayırır,
// adb connect yapar, Playwright'ı cihaza bağlar, {device, page} verir; sonunda
// HER DURUMDA kapatır + bırakır. Playwright Android desteği deneyseldir ve
// cihazdaki Chrome'u sürer — cihazda Chrome kurulu ve adb çalışıyor olmalı.
// ============================================================================
import {execFileSync} from 'node:child_process'
import {_android as android} from 'playwright'
import {MercuryClient, envSerials} from './mercury-client.mjs'

export async function withAndroidPage(runName, testBody) {
    const client = new MercuryClient()
    const serials = envSerials()

    // 1) Reserve a device / Cihaz ayır
    const {groupId, devices} = await client.reserve({
        run: runName,
        runUrl: process.env.CI_JOB_URL,
        timeout: Number(process.env.MERCURY_TIMEOUT || 600),
        amount: 1,
        type: 'android', // Playwright → Android only / sadece Android
        serials: serials.slice(0, 1)
    })
    const reserved = devices[0]
    console.log(`Reserved / Ayrıldı: ${reserved.serial} (${reserved.model}) — group=${groupId}`)

    try {
        // 2) Automation mode + adb connect / Automation modu + adb connect
        const remote = await client.useDevice(reserved.serial)
        console.log(`remoteConnectUrl: ${remote}`)
        execFileSync('adb', ['connect', remote], {stdio: 'inherit'})

        // 3) Attach Playwright to the adb device / Playwright'ı adb cihazına bağla
        const androidDevices = await android.devices()
        const device = androidDevices.find(d => d.serial() === remote)
        if (!device) {
            throw new Error(`Playwright could not see ${remote} in adb devices / adb devices içinde göremedi`)
        }

        // 4) Launch Chrome on the device / Cihazda Chrome başlat
        const context = await device.launchBrowser()
        const page = await context.newPage()
        try {
            await testBody({device, page})
        }
        finally {
            await context.close()
            await device.close()
        }
    }
    finally {
        // 5) ALWAYS release / Test patlasa bile HER DURUMDA bırakılır
        await client.release(groupId)
        console.log(`Released group / Grup bırakıldı: ${groupId}`)
    }
}
