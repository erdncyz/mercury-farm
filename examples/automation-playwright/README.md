# Mercury Playwright Automation Examples / Örnekleri

Node.js 18+ · tek bağımlılık `playwright`. Rezervasyon istemcisi bağımlılıksızdır (global `fetch`).
Ruby eşleniği / Ruby counterpart: [examples/automation-ruby](../automation-ruby/README.md) ·
Detaylı API dokümanı / Full API docs: [docs/automation-api.md](../../docs/automation-api.md)

> ⚠️ **Playwright yalnızca Android sürer** (deneysel `_android` API'si, adb üzerinden cihazdaki
> Chrome'u kontrol eder). **iOS için** Appium tabanlı örneklere bak:
> [automation-ruby](../automation-ruby/README.md) veya [automation-java](../automation-java/README.md).
>
> ⚠️ **Playwright drives Android only** (experimental `_android` API controlling Chrome on the
> device over adb). **For iOS** use the Appium-based examples above.

| Dosya | Ne için? |
| --- | --- |
| [mercury-client.mjs](./mercury-client.mjs) | Ortak istemci: `reserve` / `useDevice` / `release` (bağımlılıksız) |
| [single-run.mjs](./single-run.mjs) | **Tekli koşum** — 1 cihaz ayır, adb connect, test koştur, bırak |
| [parallel-run.mjs](./parallel-run.mjs) | **Çoklu (paralel) koşum** — N cihazı tek grupta ayır, `Promise.all` ile paralel koştur |
| [android-session.mjs](./android-session.mjs) | Örnek testler için yardımcı: ayır + Playwright'ı cihaza bağla + her durumda bırak |
| [web-test-pass.mjs](./web-test-pass.mjs) | **✅ Başarılı senaryo** — cihazda Chrome aç, example.com'u doğrula, PASS |
| [web-test-fail.mjs](./web-test-fail.mjs) | **❌ Başarısız senaryo** — olmayan elementi bekler, exit 1; cihaz yine bırakılır |

## Hızlı başlangıç / Quick start

```bash
npm install                                   # playwright'ı kurar / installs playwright

export MERCURY_BASE_URL=https://YOUR_DOMAIN   # UI'daki /#/ olmadan
export MERCURY_TOKEN=...                      # UI > Settings > Keys > Access Tokens

node single-run.mjs                           # tekli koşum / single run
MERCURY_AMOUNT=2 node parallel-run.mjs        # çoklu koşum / parallel run
```

## Örnek test senaryoları / Example test scenarios

```bash
node web-test-pass.mjs    # ✅ Chrome → example.com → başlığı doğrula → PASS (exit 0)
node web-test-fail.mjs    # ❌ olmayan element → timeout → FAIL (exit 1, cihaz yine bırakılır)
```

Gereksinimler / Requirements:

- Cihazda **Chrome** kurulu olmalı / Chrome must be installed on the device
- `adb` bu makinede çalışmalı (Playwright yerel adb'yi kullanır) / `adb` must work on this machine
- Android 11+ önerilir (Playwright Android desteği deneyseldir) / Android 11+ recommended

## Ortam değişkenleri / Environment variables

[Ruby örnekleriyle aynı / same as the Ruby examples](../automation-ruby/README.md#ortam-değişkenleri):
`MERCURY_BASE_URL`, `MERCURY_TOKEN`, `MERCURY_SERIALS`, `MERCURY_AMOUNT`,
`MERCURY_TIMEOUT`, `MERCURY_RUN`, `CI_JOB_URL`, `MERCURY_HOLD_SECONDS`.
(`MERCURY_TYPE` yok — Playwright her zaman Android ayırır / not needed, always Android.)

## Akış / Workflow

Appium yerine Playwright'ın adb tabanlı Android sürücüsü kullanılır; geri kalan akış aynıdır:
reserve → useDevice → `adb connect` → Playwright `_android.devices()` → Chrome → release.
Diyagramlar için: [automation-ruby/README.md](../automation-ruby/README.md#akış--workflow)

Instead of Appium, Playwright's adb-based Android driver is used; the rest of the flow is
identical: reserve → useDevice → `adb connect` → Playwright `_android.devices()` → Chrome →
release. See the diagrams in [automation-ruby/README.md](../automation-ruby/README.md#akış--workflow).
