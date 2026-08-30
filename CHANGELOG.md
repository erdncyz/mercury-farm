# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [0.8.0] — 2026-08-30

### Added / Eklendi

**Device display names / Cihaz görünen adları** — Device card titles can now be assigned a persistent custom name from the UI and reset to the automatically detected model name. The alias is also used in device tables, settings, shell selection, and the active device header.

**Cihaz görünen adları** — Cihaz kartı başlıklarına artık UI üzerinden kalıcı özel ad verilebilir ve ad otomatik algılanan model adına sıfırlanabilir. Alias; cihaz tablolarında, ayarlarda, shell seçiminde ve aktif cihaz başlığında da kullanılır.

**Android media upload / Android medya yükleme** — The device Upload panel can now send supported photos and videos to `Pictures/Mercury` or `Movies/Mercury` and refresh the Android gallery. The media option is not shown for iOS devices.

**Android medya yükleme** — Cihazdaki Yükle paneli artık desteklenen fotoğraf ve videoları `Pictures/Mercury` veya `Movies/Mercury` klasörüne gönderebilir ve Android galerisini yeniler. Medya seçeneği iOS cihazlarda gösterilmez.

**Cross-platform clipboard / Platformlar arası pano** — The Clipboard panel can now send multiline Unicode text to both Android and iOS device clipboards, read the current value, and report transfer errors. iOS writes use WebDriverAgent `setPasteboard`.

**Platformlar arası pano** — Pano paneli artık çok satırlı Unicode metni Android ve iOS cihaz panosuna gönderebilir, mevcut değeri okuyabilir ve aktarım hatalarını gösterebilir. iOS yazma işlemi WebDriverAgent `setPasteboard` kullanır.

### Changed / Değiştirildi

**Low-latency iOS screen streaming / Düşük gecikmeli iOS ekran akışı** — iOS now opens directly over authenticated H.264 WebSocket when WebCodecs is available, retains WebRTC as a compatibility path, bounds VideoToolbox and browser render queues, reuses pixel buffers, and drops stale frames under backpressure instead of accumulating control latency.

**Düşük gecikmeli iOS ekran akışı** — iOS, WebCodecs kullanılabildiğinde doğrudan kimlik doğrulamalı H.264 WebSocket ile açılır; WebRTC uyumluluk yolu olarak korunur. VideoToolbox ve tarayıcı render kuyrukları sınırlandırılır, pixel buffer'lar yeniden kullanılır ve ağ baskısında kontrol gecikmesi biriktirmek yerine eski kareler atılır.

**WebDriverAgent 16.11.4** — Updated the bundled iOS control service to WebDriverAgent 16.11.4.

**WebDriverAgent 16.11.4** — Paketlenen iOS kontrol servisi WebDriverAgent 16.11.4 sürümüne güncellendi.

### Fixed / Düzeltildi

**Current iPhone model names / Güncel iPhone model adları** — Added mappings for the iPhone 17 family (`iPhone18,1`–`iPhone18,5`), corrected duplicate iPhone 16 Plus identifiers, and made unknown future identifiers fall back to the device-reported name instead of exposing the raw product code.

**Güncel iPhone model adları** — iPhone 17 ailesi (`iPhone18,1`–`iPhone18,5`) eşlemeleri eklendi, yinelenen iPhone 16 Plus kimlikleri düzeltildi ve gelecekteki bilinmeyen kimliklerin ham ürün kodu yerine cihazın bildirdiği ada düşmesi sağlandı.

**Automatic network configuration / Otomatik ağ yapılandırması** — Fresh installations default to automatic LAN address detection instead of shipping a machine-specific address. Manual domains remain supported with `MERCURY_DOMAIN_MODE=manual`.

**Otomatik ağ yapılandırması** — Yeni kurulumlar makineye özel sabit adres yerine otomatik LAN adresi algılamayı kullanır. Manuel domain kullanımı `MERCURY_DOMAIN_MODE=manual` ile desteklenmeye devam eder.

---

## [0.7.0] — 2026-08-27

### Added / Eklendi

**H.264 screen transport / H.264 ekran taşıması** — Added authenticated H.264 screen streaming for Android and iOS, including WebCodecs codec bootstrap, cached GOP recovery, and a VideoToolbox-based iOS encoder.

**H.264 ekran taşıması** — Android ve iOS için kimlik doğrulamalı H.264 ekran akışı, WebCodecs codec başlangıcı, GOP kurtarma ve VideoToolbox tabanlı iOS encoder eklendi.

### Fixed / Düzeltildi

**iOS interaction latency / iOS etkileşim gecikmesi** — Preserved live capture during pointer gestures, shortened swipe replay, routed large axis-aligned scrolls through WDA's faster directional endpoint, and initialized WDA before H.264 authentication so the first input is not dropped.

**iOS etkileşim gecikmesi** — Pointer hareketlerinde canlı görüntü korunuyor, swipe yeniden oynatma süresi kısaltılıyor, büyük eksenli scroll'lar hızlı WDA endpoint'ine yönlendiriliyor ve ilk input'un kaybolmaması için H.264 kimlik doğrulamasından önce WDA başlatılıyor.

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
