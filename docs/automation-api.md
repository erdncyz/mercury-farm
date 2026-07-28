# Automation API (EN + TR)

This document explains how to reserve/release devices for automated test runs,
where Appium fits in, and how runs show up on the **Builds** page.

Related guides:

- [Appium Setup](./appium-setup.md) — install Appium and the platform drivers
- [Appium Inspector Connection](./appium-integration.md) — manual/Inspector flow, step by step
- [Parallel Execution](./parallel-execution.md) — multiple devices and CI workers

---

## English

### The big picture

Mercury is the **device broker**; it does not run Appium for you. Appium runs on
**your machine or your CI runner**:

```text
┌──────────────────┐    1. reserve (run=NAME)    ┌─────────────┐
│ CI runner / laptop │ ───────────────────────▶ │   Mercury   │
│                    │ ◀── 2. remoteConnectUrl ─── │ (records to │
│  appium :4723      │                              │   Builds)   │
│  + test suite      │    3. adb connect / WDA      └─────────────┘
│                    │ ───────────────────────▶ real devices
└──────────────────┘    4. release group
```

A full run always follows the same order:

1. **Reserve** devices: `GET /api/v1/autotests?run=NAME&...` — the `run` name is what appears on the **Builds** page.
2. **Connect**: `POST /api/v1/autotests/useDevice` per device → `remoteConnectUrl` (`adb connect` on Android, `appium:webDriverAgentUrl` on iOS).
3. **Start Appium locally** on the runner and execute the tests:

   ```bash
   appium --address 127.0.0.1 --port 4723
   ```

4. **Release** the group in the `finally`/cleanup step: `DELETE /api/v1/autotests?group=GROUP_ID`.

While step 3 is running, the run is visible as `Running` on the Builds page and
the device screens can be watched live.

### Where to run Appium (two topologies)

First, an important distinction. If your farm UI is at `https://YOUR_DOMAIN/#/`:

| Purpose | Address |
| --- | --- |
| Mercury UI (browser) | `https://YOUR_DOMAIN/#/` |
| Mercury REST API (reserve/release) | `https://YOUR_DOMAIN/api/v1/...` |
| Appium server (WebDriver) | `http://<appium-host>:4723` — **a separate process, never behind the UI URL** |

**Topology A — Appium on the test runner (default, recommended)**

Appium and the test suite run on your laptop or CI runner; Mercury only brokers
the devices. This is the flow described above and in
[Appium Inspector Connection](./appium-integration.md). Nothing needs to be
installed on the farm host.

**Topology B — central Appium on the farm host (e.g. `YOUR_DOMAIN`)**

You can also start Appium on the farm machine itself so testers on other
machines only need a WebDriver client:

```bash
# on the farm host (YOUR_DOMAIN)
appium --address 0.0.0.0 --port 4723 --allow-cors
```

- `--address 0.0.0.0` makes Appium reachable from other machines; open TCP port `4723` on the firewall.
- Test code on any machine points its WebDriver/Appium URL to `http://YOUR_DOMAIN:4723` (plain HTTP, no `/#/`).
- **Android caveat:** Appium uses the `adb` of the machine it runs on, so the `adb connect $REMOTE_CONNECT_URL` step must be executed **on the farm host** (the same machine as Appium). In CI do it with an SSH step, e.g. `ssh user@YOUR_DOMAIN "adb connect $REMOTE_CONNECT_URL"`, or run the whole reserve+connect script on the farm host.
- **iOS is simpler:** `appium:webDriverAgentUrl` is dialed directly by Appium over HTTP, so no extra step is needed as long as the farm host can reach the WDA endpoint (it can — it is the same machine).
- Security note: an open Appium port has no authentication. Keep `4723` restricted to your internal network/VPN.

Reservation (`run`, `runUrl`) and release calls work the same in both
topologies, and runs appear on the **Builds** page either way.

### Base URL and Auth

All requests use bearer token auth:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR_DOMAIN/api/v1/user
```

### Core automation endpoints

- `GET /api/v1/autotests` → capture devices for a run
- `DELETE /api/v1/autotests?group=<groupId>` → release captured devices
- `GET /api/v1/autotests/{id}/addDevices` → add devices to existing group
- `POST /api/v1/autotests/useDevice` → mark one device as automation and get `remoteConnectUrl`
- `POST /api/v1/autotests/install/{serial}` → install app from URL on device
- `GET /api/v1/builds` → list your automation runs (run history shown on the **Builds** page)
- `DELETE /api/v1/builds/{id}` → delete one finished run (owner or admin)
- `DELETE /api/v1/builds` → delete all finished runs (admins delete everything, users delete their own)

### Capture devices

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?amount=1&timeout=600&run=my-run&type=ios&need_amount=true"
```

Common query params:

- `amount` required (unless `serials` is provided)
- `timeout` required (seconds)
- `run` required (run id/name) — **this is the name shown on the Builds page**, so pick something readable like `nightly-regression-2026-07-19` or your CI build number
- `runUrl` optional — link to your CI pipeline/job; the run name on the Builds page becomes a clickable link to it
- `type` optional (`android` or `ios`) — **always set this for platform-specific runs**; without it any free device (including the other platform) can be picked
- `serials` optional — comma-separated serial list to reserve **specific devices**; takes precedence over `amount` and the other filters. All listed devices must be free, otherwise the call fails with 409. The response still returns the `group.id` to use for release.
- `need_amount` optional strict count
- `abi`, `model`, `sdk`, `version` optional filters

Reserve specific devices by serial:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?timeout=600&run=my-run&serials=SERIAL_A,SERIAL_B"
# → response contains group.id → release with DELETE /api/v1/autotests?group=<group.id>
```

Important: non-admin users are limited to **2 devices** per run.

### Track runs in the UI (Builds page)

Every capture call automatically creates a run record. Open **Builds** in the top navigation (between **Devices** and **Settings**) to see it — no extra integration is needed.

What you see per run:

- **Status chip**: `Running` (green), `Finished` (gray), `Failed` (red — device capture failed)
- **Run name** (`run` param); clickable when `runUrl` was provided
- **Owner**, **start time**, **end time** (or `In progress`), **duration**
- **Device chips**: model + platform/OS version for every captured device

While a run is `Running`, its device chips turn green with a camera icon — click one to **watch the automation live** on the device screen. When the run finishes (release call or timeout), the chips become inactive and the record stays as history.

Example with a good run name and CI link:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?amount=2&timeout=900&run=nightly-regression-${CI_BUILD_NUMBER}&runUrl=${CI_JOB_URL}&type=android&need_amount=true"
```

Visibility and cleanup:

- Admins see all runs; regular users see only their own.
- Runs can be deleted from the UI (trash icon per row, **Clear history** for bulk) or via `DELETE /api/v1/builds/{id}`. Active runs cannot be deleted.
- Runs older than **30 days** are cleaned up automatically. Configure with the `BUILDS_RETENTION_DAYS` environment variable on the API unit (`0` disables cleanup).

### Release devices

```bash
curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?group=GROUP_ID"
```

### Python end-to-end example (with Appium, both topologies)

```python
import subprocess

import requests
from appium import webdriver
from appium.options.android import UiAutomator2Options

BASE = "https://YOUR_DOMAIN"          # Mercury API host (the UI lives at /#/)
APPIUM = "http://127.0.0.1:4723"       # Topology A: Appium on this machine
# APPIUM = "http://YOUR_DOMAIN:4723"  # Topology B: central Appium on the farm host
TOKEN = "YOUR_TOKEN"
headers = {"Authorization": f"Bearer {TOKEN}"}

# 1) Reserve — 'run' is the name shown on the Builds page
capture = requests.get(
    f"{BASE}/api/v1/autotests",
    headers=headers,
    params={
        "amount": 1,
        "timeout": 600,
        "run": "ci-run-001",
        "runUrl": "https://ci.example/job/123",  # optional, clickable on Builds
        "type": "android",
        "need_amount": True,
    },
    timeout=30,
)
capture.raise_for_status()
group = capture.json()["group"]
group_id = group["id"]
serial = group["devices"][0]["serial"]

try:
    # 2) Put the device in automation mode and get the connect address
    use = requests.post(
        f"{BASE}/api/v1/autotests/useDevice",
        headers=headers,
        json={"serial": serial},
        timeout=30,
    )
    use.raise_for_status()
    remote = use.json()["remoteConnectUrl"]

    # 3) Attach ADB — must run on the SAME machine as Appium.
    #    Topology A: run it locally as below.
    #    Topology B: run it on the farm host instead:
    #      subprocess.run(["ssh", "user@YOUR_DOMAIN", f"adb connect {remote}"], check=True)
    subprocess.run(["adb", "connect", remote], check=True)

    # 4) Appium session — while this runs, the run shows as "Running" on Builds
    options = UiAutomator2Options()
    options.udid = remote
    options.new_command_timeout = 300
    options.no_reset = True
    driver = webdriver.Remote(APPIUM, options=options)
    try:
        print(driver.current_activity)
        # ... your tests ...
    finally:
        driver.quit()
finally:
    # 5) Release — flips the run to "Finished" on the Builds page
    requests.delete(
        f"{BASE}/api/v1/autotests",
        headers=headers,
        params={"group": group_id},
        timeout=30,
    ).raise_for_status()
```

## Ruby Examples (single + parallel runs)

Ready-to-run Ruby scripts live in the repo — click to open:

- [examples/automation-ruby/mercury_client.rb](../examples/automation-ruby/mercury_client.rb) — shared client (`reserve` / `use_device` / `release`), plain Ruby stdlib, no gems
- [examples/automation-ruby/single_run.rb](../examples/automation-ruby/single_run.rb) — **single run**: reserve 1 device (by filter or by serial), connect, run tests, release
- [examples/automation-ruby/parallel_run.rb](../examples/automation-ruby/parallel_run.rb) — **parallel run**: reserve N devices in one group, drive each in its own thread, release once
- [examples/automation-ruby/settings_test_pass.rb](../examples/automation-ruby/settings_test_pass.rb) — **passing Appium scenario**: open Settings, tap General, verify, PASS
- [examples/automation-ruby/settings_test_fail.rb](../examples/automation-ruby/settings_test_fail.rb) — **failing Appium scenario**: looks for a nonexistent menu, exits 1, device still released
- [examples/automation-ruby/README.md](../examples/automation-ruby/README.md) — environment variables and quick start

```bash
export MERCURY_BASE_URL=https://YOUR_DOMAIN
export MERCURY_TOKEN=...              # keep it out of source control
export MERCURY_TYPE=android           # android | ios — always set for platform-specific runs

ruby examples/automation-ruby/single_run.rb                       # single run
MERCURY_AMOUNT=2 ruby examples/automation-ruby/parallel_run.rb    # parallel run
# specific devices instead of filters:
MERCURY_SERIALS=SERIAL_A,SERIAL_B ruby examples/automation-ruby/parallel_run.rb
```

Both scripts print the `remoteConnectUrl` per device (Android: `adb connect`,
iOS: `appium:webDriverAgentUrl`), keep the run visible as `Running` on the
**Builds** page, and always release the group in an `ensure` block.

## Java Examples (single + parallel runs)

Same flow in Java 17 + Maven (Appium `java-client` + `gson`) — click to open:

- [examples/automation-java/README.md](../examples/automation-java/README.md) — quick start and file list
- [examples/automation-java/src/main/java/mercury/MercuryClient.java](../examples/automation-java/src/main/java/mercury/MercuryClient.java) — shared client
- [examples/automation-java/src/main/java/mercury/SingleRun.java](../examples/automation-java/src/main/java/mercury/SingleRun.java) — **single run**
- [examples/automation-java/src/main/java/mercury/ParallelRun.java](../examples/automation-java/src/main/java/mercury/ParallelRun.java) — **parallel run** (thread pool)
- [examples/automation-java/src/main/java/mercury/SettingsTestPass.java](../examples/automation-java/src/main/java/mercury/SettingsTestPass.java) / [SettingsTestFail.java](../examples/automation-java/src/main/java/mercury/SettingsTestFail.java) — passing + failing Appium scenarios

```bash
cd examples/automation-java
mvn -q compile exec:java -Dexec.mainClass=mercury.SingleRun
MERCURY_AMOUNT=2 mvn -q compile exec:java -Dexec.mainClass=mercury.ParallelRun
```

## Playwright Examples (Android only)

Playwright's experimental `_android` API drives Chrome on the device over adb —
no Appium needed, but **Android only** (use the Appium examples for iOS):

- [examples/automation-playwright/README.md](../examples/automation-playwright/README.md) — quick start, requirements
- [examples/automation-playwright/mercury-client.mjs](../examples/automation-playwright/mercury-client.mjs) — shared client (Node 18+, zero deps)
- [examples/automation-playwright/single-run.mjs](../examples/automation-playwright/single-run.mjs) — **single run**
- [examples/automation-playwright/parallel-run.mjs](../examples/automation-playwright/parallel-run.mjs) — **parallel run** (`Promise.all`)
- [examples/automation-playwright/web-test-pass.mjs](../examples/automation-playwright/web-test-pass.mjs) / [web-test-fail.mjs](../examples/automation-playwright/web-test-fail.mjs) — passing + failing Chrome scenarios

```bash
cd examples/automation-playwright && npm install
node single-run.mjs
MERCURY_AMOUNT=2 node parallel-run.mjs
```

## Azure Pipeline Example (Ruby + Mercury)

```yaml
trigger:
- main

pool:
  vmImage: 'macOS-latest'

variables:
  MERCURY_BASE_URL: 'https://YOUR_DOMAIN'
  # Topology A: Appium on the CI agent (started below)
  APPIUM_URL: 'http://127.0.0.1:4723'
  # Topology B: central Appium on the farm host -- remove the Appium steps below and use:
  #   APPIUM_URL: 'http://YOUR_DOMAIN:4723'
  #   APPIUM_HOST_SSH: 'user@YOUR_DOMAIN'   # so adb connect runs on the farm host

steps:
- task: UseRubyVersion@0
  inputs:
    versionSpec: '3.2'

- script: |
    gem install bundler
    bundle install
  displayName: Install Ruby dependencies

# Topology A only: install and start Appium on the CI agent
- script: |
    npm install -g appium
    appium driver install uiautomator2
    appium --address 127.0.0.1 --port 4723 &
    sleep 5
  displayName: Start local Appium

- script: ruby examples/automation-ruby/single_run.rb
  displayName: Run Ruby mobile tests on Mercury
  env:
    MERCURY_BASE_URL: $(MERCURY_BASE_URL)
    MERCURY_TOKEN: $(MERCURY_TOKEN)
    MERCURY_TYPE: android
```

For multi-device pipelines switch the script to
[examples/automation-ruby/parallel_run.rb](../examples/automation-ruby/parallel_run.rb)
and set `MERCURY_AMOUNT` (or `MERCURY_SERIALS`).

Store `MERCURY_TOKEN` as a secret variable.

---

## Türkçe

### Genel resim

Mercury bir **cihaz broker'ıdır**; Appium'u senin yerine çalıştırmaz. Appium
**kendi makinende veya CI runner'ında** çalışır:

1. **Cihaz ayır**: `GET /api/v1/autotests?run=ISIM&...` — `run` adı **Builds** sayfasında görünen isimdir.
2. **Bağlan**: her cihaz için `POST /api/v1/autotests/useDevice` → `remoteConnectUrl` (Android'de `adb connect`, iOS'ta `appium:webDriverAgentUrl`).
3. **Appium'u runner'da başlat** ve testleri koştur:

   ```bash
   appium --address 127.0.0.1 --port 4723
   ```

4. **Serbest bırak**: `finally`/cleanup adımında `DELETE /api/v1/autotests?group=GROUP_ID`.

3. adım sürerken koşum Builds sayfasında `Çalışıyor` olarak görünür ve cihaz
ekranları canlı izlenebilir.

### Appium nerede çalıştırılır? (iki topoloji)

Önce önemli bir ayrım. Farm UI'ın `https://YOUR_DOMAIN/#/` adresindeyse:

| Amaç | Adres |
| --- | --- |
| Mercury UI (tarayıcı) | `https://YOUR_DOMAIN/#/` |
| Mercury REST API (ayır/bırak) | `https://YOUR_DOMAIN/api/v1/...` |
| Appium sunucusu (WebDriver) | `http://<appium-host>:4723` — **ayrı bir süreçtir, asla UI adresinin arkasında değildir** |

**Topoloji A — Appium test makinesinde (varsayılan, önerilen)**

Appium ve test paketi kendi bilgisayarında veya CI runner'da çalışır; Mercury
sadece cihazları aracılar. Yukarıdaki akış ve
[Appium Inspector Bağlantısı](./appium-integration.md) bu modeli anlatır. Farm
sunucusuna hiçbir şey kurmak gerekmez.

**Topoloji B — farm sunucusunda merkezi Appium (örn. `YOUR_DOMAIN`)**

Appium'u farm makinesinin üzerinde de başlatabilirsin; böylece diğer
makinelerdeki testçilere sadece bir WebDriver istemcisi yeter:

```bash
# farm sunucusunda (YOUR_DOMAIN)
appium --address 0.0.0.0 --port 4723 --allow-cors
```

- `--address 0.0.0.0` Appium'u diğer makinelerden erişilebilir yapar; firewall'da TCP `4723` portunu aç.
- Herhangi bir makinedeki test kodu, WebDriver/Appium URL'si olarak `http://YOUR_DOMAIN:4723` kullanır (düz HTTP, `/#/` yok).
- **Android'de dikkat:** Appium, üzerinde çalıştığı makinenin `adb`'sini kullanır; bu yüzden `adb connect $REMOTE_CONNECT_URL` adımı **farm sunucusunda** (Appium ile aynı makinede) çalıştırılmalıdır. CI'da bunu SSH adımıyla yap: `ssh user@YOUR_DOMAIN "adb connect $REMOTE_CONNECT_URL"`, veya ayır+bağlan script'inin tamamını farm sunucusunda koştur.
- **iOS daha basittir:** `appium:webDriverAgentUrl` Appium tarafından doğrudan HTTP ile çağrılır; farm sunucusu WDA adresine zaten erişebildiği için ek adım gerekmez.
- Güvenlik notu: açık Appium portunda kimlik doğrulama yoktur. `4723` portunu iç ağ/VPN ile sınırla.

Rezervasyon (`run`, `runUrl`) ve bırakma çağrıları her iki topolojide de
aynıdır; koşumlar her durumda **Builds** sayfasında görünür.

Kurulum için: [Appium Setup](./appium-setup.md) · adım adım akış için: [Appium Inspector Bağlantısı](./appium-integration.md) · çoklu cihaz için: [Parallel Execution](./parallel-execution.md)

### Temel URL ve Kimlik Doğrulama

Tüm istekler bearer token ile yapılır:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR_DOMAIN/api/v1/user
```

### Ana otomasyon endpointleri

- `GET /api/v1/autotests` → test koşusu için cihaz ayırır
- `DELETE /api/v1/autotests?group=<groupId>` → ayrılan cihazları bırakır
- `GET /api/v1/autotests/{id}/addDevices` → mevcut gruba cihaz ekler
- `POST /api/v1/autotests/useDevice` → cihazı automation kullanımına alır ve `remoteConnectUrl` döner
- `POST /api/v1/autotests/install/{serial}` → cihaza URL üzerinden uygulama kurar
- `GET /api/v1/builds` → otomasyon koşumlarını listeler (**Builds** sayfasındaki koşum geçmişi)
- `DELETE /api/v1/builds/{id}` → biten bir koşumu siler (sahibi veya admin)
- `DELETE /api/v1/builds` → biten koşumları toplu siler (admin hepsini, kullanıcı kendisininkini)

### Cihaz ayırma örneği

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?amount=1&timeout=600&run=my-run&type=ios&need_amount=true"
```

Sık kullanılan parametreler:

- `amount` zorunlu (`serials` verilmediyse)
- `timeout` zorunlu (saniye)
- `run` zorunlu (koşu adı/id) — **Builds sayfasında görünecek isim budur**; `nightly-regression-2026-07-19` veya CI build numarası gibi okunaklı bir değer seç
- `runUrl` opsiyonel — CI pipeline/job linki; Builds sayfasındaki koşum adı bu linke tıklanabilir olur
- `type` opsiyonel (`android` veya `ios`) — **platforma özel koşularda mutlaka ver**; verilmezse boştaki herhangi bir cihaz (diğer platform dahil) seçilebilir
- `serials` opsiyonel — **belirli cihazları** ayırmak için virgülle ayrılmış serial listesi; `amount` ve diğer filtrelerden önceliklidir. Listedeki tüm cihazlar boşta olmalıdır, aksi halde çağrı 409 döner. Yanıtta release için kullanılacak `group.id` yine döner.
- `need_amount` opsiyonel (tam sayı zorlaması)
- `abi`, `model`, `sdk`, `version` opsiyonel filtre

Serial ile belirli cihaz ayırma:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?timeout=600&run=my-run&serials=SERIAL_A,SERIAL_B"
# → yanıttaki group.id ile bırak: DELETE /api/v1/autotests?group=<group.id>
```

Not: admin olmayan kullanıcılar koşu başına en fazla **2 cihaz** alabilir.

### Koşumları UI'dan izleme (Builds sayfası)

Her cihaz ayırma çağrısı otomatik olarak bir koşum kaydı oluşturur. Üst menüde **Builds** sekmesini aç (**Devices** ile **Settings** arasında) — ekstra entegrasyon gerekmez.

Her koşum satırında görünenler:

- **Durum rozeti**: `Çalışıyor` (yeşil), `Tamamlandı` (gri), `Başarısız` (kırmızı — cihaz alınamadı)
- **Koşum adı** (`run` parametresi); `runUrl` gönderildiyse tıklanabilir
- **Sahibi**, **başlangıç**, **bitiş** (veya `Devam ediyor`), **süre**
- **Cihaz chip'leri**: alınan her cihazın modeli + platform/OS sürümü

Koşum `Çalışıyor` durumundayken cihaz chip'leri kamera ikonlu yeşile döner — tıklayınca otomasyonu **cihaz ekranından canlı izlersin**. Koşum bitince (release çağrısı veya timeout) chip'ler pasifleşir, kayıt geçmişte kalır.

İyi bir koşum adı ve CI linki ile örnek:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?amount=2&timeout=900&run=nightly-regression-${CI_BUILD_NUMBER}&runUrl=${CI_JOB_URL}&type=android&need_amount=true"
```

Görünürlük ve temizlik:

- Admin tüm koşumları, normal kullanıcı sadece kendi koşumlarını görür.
- Koşumlar UI'dan silinebilir (satırda çöp kutusu, toplu için **Geçmişi temizle**) veya `DELETE /api/v1/builds/{id}` ile. Aktif koşan build silinemez.
- **30 günden** eski koşumlar otomatik temizlenir. API unit'inde `BUILDS_RETENTION_DAYS` ortam değişkeniyle ayarlanır (`0` kapatır).

### Cihazları bırakma

```bash
curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?group=GROUP_ID"
```

### Uçtan uca örnekler

İngilizce bölümdeki örnekler her iki topolojiyi de destekler; ortam değişkeniyle seçilir:

- **Python**: [Python end-to-end example](#python-end-to-end-example-with-appium-both-topologies) — `APPIUM` değişkenini `http://127.0.0.1:4723` (Topoloji A) veya `http://YOUR_DOMAIN:4723` (Topoloji B) yap.
- **Ruby (hazır script'ler)** — tıklayıp aç:
  - [examples/automation-ruby/single_run.rb](../examples/automation-ruby/single_run.rb) — **tekli koşum**: 1 cihaz ayır (filtreyle veya serial ile), bağlan, testi koştur, bırak
  - [examples/automation-ruby/parallel_run.rb](../examples/automation-ruby/parallel_run.rb) — **çoklu (paralel) koşum**: N cihazı tek grupta ayır, her cihazı ayrı thread'de koştur, tek sefer bırak
  - [examples/automation-ruby/settings_test_pass.rb](../examples/automation-ruby/settings_test_pass.rb) — **başarılı Appium senaryosu**: Ayarlar'ı aç, Genel'e tıkla, doğrula, PASS
  - [examples/automation-ruby/settings_test_fail.rb](../examples/automation-ruby/settings_test_fail.rb) — **başarısız Appium senaryosu**: olmayan menüyü arar, exit 1; cihaz yine bırakılır
  - [examples/automation-ruby/mercury_client.rb](../examples/automation-ruby/mercury_client.rb) — ortak istemci (`reserve` / `use_device` / `release`), ek gem gerekmez
  - Kurulum ve ortam değişkenleri: [examples/automation-ruby/README.md](../examples/automation-ruby/README.md)
- **Java (hazır proje)** — aynı akış Java 17 + Maven ile (Appium java-client): [examples/automation-java/README.md](../examples/automation-java/README.md) — tekli [SingleRun.java](../examples/automation-java/src/main/java/mercury/SingleRun.java), çoklu [ParallelRun.java](../examples/automation-java/src/main/java/mercury/ParallelRun.java), başarılı/başarısız senaryolar dahil.
- **Playwright (sadece Android)** — Appium'suz, adb üzerinden cihazdaki Chrome'u sürer: [examples/automation-playwright/README.md](../examples/automation-playwright/README.md) — tekli [single-run.mjs](../examples/automation-playwright/single-run.mjs), çoklu [parallel-run.mjs](../examples/automation-playwright/parallel-run.mjs), başarılı/başarısız web senaryoları dahil. iOS için Appium örneklerine bak.
- **Azure Pipelines**: [Azure Pipeline Example](#azure-pipeline-example-ruby--mercury) — Topoloji A'da Appium CI agent'ta kurulup başlatılır; Topoloji B'de Appium adımları kaldırılıp `APPIUM_URL` farm sunucusuna yönlendirilir.
- **Azure Pipelines**: [Azure Pipeline Example](#azure-pipeline-example-ruby--mercury) — Topoloji A'da Appium CI agent'ta kurulup başlatılır; Topoloji B'de Appium adımları kaldırılıp `APPIUM_URL` farm sunucusuna yönlendirilir.

Her örnekte akış aynıdır: ayır (`run` adı Builds'de görünür) → `useDevice` → `adb connect` (Appium'un çalıştığı makinede!) → Appium session → `finally` içinde release.
