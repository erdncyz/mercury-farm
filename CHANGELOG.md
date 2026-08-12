# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added / Eklendi

**Android media upload / Android medya yükleme** — The device Upload panel can now send supported photos and videos to `Pictures/Mercury` or `Movies/Mercury` and refresh the Android gallery. The media option is not shown for iOS devices.

**Android medya yükleme** — Cihazdaki Yükle paneli artık desteklenen fotoğraf ve videoları `Pictures/Mercury` veya `Movies/Mercury` klasörüne gönderebilir ve Android galerisini yeniler. Medya seçeneği iOS cihazlarda gösterilmez.

**Cross-platform clipboard / Platformlar arası pano** — The Clipboard panel can now send multiline Unicode text to both Android and iOS device clipboards, read the current value, and report transfer errors. iOS writes use WebDriverAgent `setPasteboard`.

**Platformlar arası pano** — Pano paneli artık çok satırlı Unicode metni Android ve iOS cihaz panosuna gönderebilir, mevcut değeri okuyabilir ve aktarım hatalarını gösterebilir. iOS yazma işlemi WebDriverAgent `setPasteboard` kullanır.

## [0.4.4] — 2026-07-28

### Fixed / Düzeltildi

**Device type filter (cihaz type filtresi)** — `/api/v1/autotests?type=android|ios` was matching a non-existent `type` field, always returning zero devices. Now translates to correct platform fields: `manufacturer` ≠ Apple + `platform` empty/Android (for Android), or `platform` iOS/tvOS / `manufacturer` Apple / `ios: true` (for iOS).

**Cihaz type filtresi** — `/api/v1/autotests?type=android|ios` var olmayan `type` alanıyla eşleşiyordu, hep 0 cihaz döndürüyordu. Şimdi doğru platform alanlarına çevriliyor: `manufacturer` ≠ Apple + `platform` boş/Android (Android için), veya `platform` iOS/tvOS / `manufacturer` Apple / `ios: true` (iOS için).

### Added / Eklendi

**Serials parameter (serial parametresi)** — Reserve specific devices by serial list:
```bash
GET /api/v1/autotests?timeout=600&run=my-run&serials=SERIAL_A,SERIAL_B
# Returns: group_id + devices → release with DELETE /api/v1/autotests?group=GROUP_ID
```
- `amount` is now optional when `serials` is provided
- Works for both single-run and `addDevices` endpoints
- All existing checks (bookable, free, lock) still apply

**Serial parametresi** — Belirli cihazları serial listesiyle ayır:
```bash
GET /api/v1/autotests?timeout=600&run=my-run&serials=SERIAL_A,SERIAL_B
# Yanıt: group_id + devices → release DELETE /api/v1/autotests?group=GROUP_ID ile
```
- `amount` serials verildiğinde opsiyonel
- Hem tekli hem `addDevices` endpointleri destekliyor
- Tüm mevcut kontroller (bookable, free, lock) uygulanıyor

**Automation examples in three frameworks (üç framework'te otomasyon örnekleri)**

- **Ruby** [`examples/automation-ruby/`](examples/automation-ruby/README.md): stdlib only, no gems
  - `mercury_client.rb` — shared client (`reserve` / `use_device` / `release`)
  - `single_run.rb` — **single run**: reserve 1 device, connect, release
  - `parallel_run.rb` — **parallel run**: reserve N devices, drive each in its own thread, release once
  - `appium_session.rb` — helper for test scenarios (reserve + Appium + always release)
  - `settings_test_pass.rb` / `settings_test_fail.rb` — passing & failing Appium scenarios
  - All files: EN+TR comments, no hardcoded tokens/IPs, env-based config

- **Java** [`examples/automation-java/`](examples/automation-java/README.md): Maven 17+, Appium `java-client` + `gson`
  - `MercuryClient.java` — shared client
  - `SingleRun.java` / `ParallelRun.java` — single & parallel modes
  - `AppiumSession.java` — helper for test scenarios
  - `SettingsTestPass.java` / `SettingsTestFail.java` — Appium scenarios (Android/iOS)
  - All files: EN+TR comments, thread pool for parallelism, always release in finally block

- **Playwright** [`examples/automation-playwright/`](examples/automation-playwright/README.md): Node 18+, zero-dependency REST client
  - `mercury-client.mjs` — shared client (global `fetch`)
  - `single-run.mjs` / `parallel-run.mjs` — single & parallel with `Promise.all`
  - `android-session.mjs` — helper for test scenarios
  - `web-test-pass.mjs` / `web-test-fail.mjs` — web testing scenarios on Android only
  - **Note**: Playwright drives only Android devices (via adb); use Appium examples (Ruby/Java) for iOS

**Otomasyon örnekleri üç framework'te** [`examples/`](examples/)

- **Ruby** [`examples/automation-ruby/`](examples/automation-ruby/README.md): stdlib sadece, gem yok
  - Ayırma + tekli + çoklu + Appium senaryoları (Settings uygulaması)
  - Başarılı & başarısız testler; cihaz her zaman bırakılır

- **Java** [`examples/automation-java/`](examples/automation-java/README.md): Maven 17+
  - Ayırma + tekli + çoklu (thread pool) + Appium senaryoları
  - EN+TR yorumlar, finally'de hep bırakma

- **Playwright** [`examples/automation-playwright/`](examples/automation-playwright/README.md): Node 18+
  - Android cihazlar üzerinde Chrome web testi (adb via _android API)
  - Tekli + çoklu (`Promise.all`)
  - İOS için Appium örneklerine referans

### Changed / Değiştirildi

**Documentation** — automation-api.md, parallel-execution.md
- Add detailed workflow diagrams: high-level architecture, step-by-step single run, parallel model comparison, Appium role vs Mercury responsibility, topology A/B explanation
- Add Java & Playwright example sections (clickable links, EN+TR)
- All .rb/.mjs files syntax-checked; Java compiles with Maven
- No breaking changes to the API; `type` filter now works as intended

**Dokümentasyon** — automation-api.md, parallel-execution.md
- Detaylı workflow diyagramları: mimari, adım adım tekli akış, paralel model karşılaştırması, Appium vs Mercury rolleri, topoloji A/B açıklaması
- Java & Playwright örnek bölümleri eklendi (tıklanabilir linkler, EN+TR)
- Tüm .rb/.mjs dosyaları syntax-check'li; Java Maven'le derlenebilir
- API'de kırılma yok; `type` filtresi artık doğru çalışıyor

---

## [0.4.3] — YYYY-MM-DD

(Earlier releases go here / Önceki sürümler buraya gelir)
