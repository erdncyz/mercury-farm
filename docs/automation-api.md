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

Mercury is the **device broker**. Appium is a separate WebDriver server: it can
run on **your test runner** (Topology A) or centrally on the **farm/Appium host**
(Topology B). The test client may run on a different machine from Appium.

```text
┌──────────────────┐   1. reserve / 4. release   ┌─────────────┐
│ CI runner/laptop │ ──────────────────────────▶ │   Mercury   │
│ test client      │ ◀── 2. remoteConnectUrl ─── │  + Builds   │
└────────┬─────────┘                              └─────────────┘
         │ 3. WebDriver session
         ▼
┌──────────────────┐   Android: adb connect on this host
│ Appium server    │   iOS: normalized WDA URL
│ local or central │ ──────────────────────────▶ real devices
└──────────────────┘
```

A full run always follows the same order:

1. **Reserve** devices: `GET /api/v1/autotests?run=NAME&...` — the `run` name is what appears on the **Builds** page.
2. **Connect**: `POST /api/v1/autotests/useDevice` per device → `remoteConnectUrl` (`adb connect` on Android, `appium:webDriverAgentUrl` on iOS).
3. **Execute the tests through Appium** — either a local server on the runner or
  a central server selected with `APPIUM_URL`:

   ```bash
  # Topology A only; Topology B uses an already-running central Appium.
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

**Topology A — Appium on the test runner (default)**

Appium and the test suite run on your laptop or CI runner; Mercury brokers the
devices. Install the Appium platform driver (`uiautomator2` or `xcuitest`) on
that runner.

**Topology B — central Appium on the farm host (e.g. `YOUR_DOMAIN`)**

You can also start Appium on the farm machine itself so testers on other
machines only need a WebDriver client:

```bash
# on the farm host (YOUR_DOMAIN)
appium --address 0.0.0.0 --port 4723 --allow-cors
```

- `--address 0.0.0.0` makes Appium reachable from other machines; open TCP port `4723` on the firewall.
- Test code on any machine points its WebDriver/Appium URL to `http://YOUR_DOMAIN:4723` (plain HTTP, no `/#/`).
- **Android caveat:** Appium uses the `adb` of the machine it runs on, so `adb connect $REMOTE_CONNECT_URL` must execute **on the Appium host**. Register that host's `~/.android/adbkey.pub` under **Settings → Keys → ADB Keys** first. The Ruby helper can run the command over SSH when `MERCURY_ADB_SSH=user@YOUR_DOMAIN` is set; otherwise the connection must already exist on the Appium host. Java and Playwright examples do not provide this SSH helper.
- **iOS:** pass the WDA endpoint as `appium:webDriverAgentUrl`. Mercury may return bare `HOST:PORT`; normalize it to `http://HOST:PORT` only when no scheme is present. The Ruby helper does this automatically.
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
- `timeout` required, `60..10800` seconds
- `run` required (run id/name) — **this is the name shown on the Builds page**, so pick something readable like `nightly-regression-2026-07-19` or your CI build number
- `project` optional — groups runs under a project header on the Builds page; pass the name of the project you are running (e.g. `project=MY_PROJECT`). Every execution (today's run, tomorrow's run) stays a separate row under it
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

`Finished` means the reservation closed (explicit release or timeout); it is
**not** a test-pass assertion. Test success or failure comes from the test
process exit code and assertions. A failed test can still appear as `Finished`
after cleanup releases the group or its timeout expires. To surface the test
outcome on this page, report `result=passed|failed` on the release call — it
renders as a separate **PASSED**/**FAILED** badge.

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

Optionally report the test outcome with `result=passed|failed`; it is shown as
a **PASSED**/**FAILED** badge next to the status chip on the Builds page:

```bash
curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?group=GROUP_ID&result=passed"
```

Runs released without `result` (or closed by timeout) show no badge. The Ruby
examples report it automatically from the script outcome.

### Scenario results on the Builds page

Report per-scenario outcomes and they appear under the run (expandable list
with status, duration, and failure message). The list replaces the previous
one, so send the full set once at the end of the run (e.g. from a Cucumber
`at_exit`/after-suite hook):

```bash
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{"scenarios":[
    {"name":"Login with valid user","status":"passed","durationSec":12.4},
    {"name":"Checkout with voucher","status":"failed","error":"button not found"},
    {"name":"Guest flow","status":"skipped"}
  ]}' \
  "https://YOUR_DOMAIN/api/v1/builds/GROUP_ID/scenarios"
```

- `GROUP_ID` is the same id returned by the reserve call (max 500 scenarios per run).
- The run badge is derived automatically from the scenarios when `result` was not sent on release: any `failed` scenario → **FAILED**, otherwise **PASSED**.
- `GET /api/v1/builds/{id}` returns the full scenario list (owner or admin).
- Combined with `project`, this gives the hierarchy **project → runs per day → scenarios**.

### Python Android end-to-end example (both Appium topologies)

```python
import subprocess

import requests
from appium import webdriver
from appium.options.android import UiAutomator2Options

BASE = "https://YOUR_DOMAIN"          # Mercury API host (the UI lives at /#/)
APPIUM = "http://127.0.0.1:4723"       # Topology A: Appium on this machine
# APPIUM = "http://YOUR_DOMAIN:4723"  # Topology B: central Appium on the farm host
ADB_SSH = None                         # Topology A
# ADB_SSH = "user@YOUR_DOMAIN"        # Topology B: SSH target for Appium host
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

    # 3) Attach ADB — must run on the SAME machine as Appium. Register that
    #    machine's adbkey.pub under Settings -> Keys -> ADB Keys first.
    if ADB_SSH:
        subprocess.run(["ssh", ADB_SSH, "adb", "connect", remote], check=True)
    else:
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
    # 5) Release — flips the run to "Finished" on Builds. This means the
    #    reservation closed; test pass/fail still comes from assertions/exit.
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
- [examples/automation-ruby/test_mercury_client.rb](../examples/automation-ruby/test_mercury_client.rb) — local contract tests for API requests, platform detection, single/parallel flows, and cleanup (no farm/device required)
- [examples/automation-ruby/README.md](../examples/automation-ruby/README.md) — environment variables and quick start

```bash
export MERCURY_BASE_URL=https://YOUR_DOMAIN
export MERCURY_TOKEN=...              # keep it out of source control
export MERCURY_TYPE=android           # recommended for filtered platform-specific runs

ruby examples/automation-ruby/single_run.rb                       # single run
MERCURY_AMOUNT=2 ruby examples/automation-ruby/parallel_run.rb    # parallel run
# specific devices instead of filters:
MERCURY_SERIALS=SERIAL_A,SERIAL_B ruby examples/automation-ruby/parallel_run.rb
```

Both scripts print the `remoteConnectUrl` per device (Android: `adb connect`,
iOS: `appium:webDriverAgentUrl`), keep the run visible as `Running` on the
**Builds** page, and always release the group in an `ensure` block.
When `MERCURY_TYPE` is omitted (for example with `MERCURY_SERIALS`), the Ruby
scripts detect Android/iOS from the reserved device metadata.

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
  #   MERCURY_ADB_SSH: 'user@YOUR_DOMAIN'   # Android: run adb connect on Appium host

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
    APPIUM_URL: $(APPIUM_URL)
    # Topology B only:
    # MERCURY_ADB_SSH: $(MERCURY_ADB_SSH)
```

For multi-device pipelines switch the script to
[examples/automation-ruby/parallel_run.rb](../examples/automation-ruby/parallel_run.rb)
and set `MERCURY_AMOUNT` (or `MERCURY_SERIALS`).

Store `MERCURY_TOKEN` as a secret variable.

---

## Türkçe

### Genel resim

Mercury bir **cihaz broker'ıdır**. Appium ayrı bir WebDriver sunucusudur;
**test runner'ında** (Topoloji A) veya merkezi **farm/Appium sunucusunda**
(Topoloji B) çalışabilir. Test istemcisi ile Appium farklı makinelerde olabilir.

1. **Cihaz ayır**: `GET /api/v1/autotests?run=ISIM&...` — `run` adı **Builds** sayfasında görünen isimdir.
2. **Bağlan**: her cihaz için `POST /api/v1/autotests/useDevice` → `remoteConnectUrl` (Android'de `adb connect`, iOS'ta `appium:webDriverAgentUrl`).
3. **Testleri Appium üzerinden koştur** — runner'daki lokal Appium'u veya
  `APPIUM_URL` ile seçilen merkezi Appium'u kullan:

   ```bash
  # Yalnız Topoloji A; Topoloji B önceden çalışan merkezi Appium'u kullanır.
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

**Topoloji A — Appium test makinesinde (varsayılan)**

Appium ve test paketi kendi bilgisayarında veya CI runner'da çalışır; Mercury
cihazları aracılar. Appium platform driver'ını (`uiautomator2` veya `xcuitest`)
bu runner'a kur.

**Topoloji B — farm sunucusunda merkezi Appium (örn. `YOUR_DOMAIN`)**

Appium'u farm makinesinin üzerinde de başlatabilirsin; böylece diğer
makinelerdeki testçilere sadece bir WebDriver istemcisi yeter:

```bash
# farm sunucusunda (YOUR_DOMAIN)
appium --address 0.0.0.0 --port 4723 --allow-cors
```

- `--address 0.0.0.0` Appium'u diğer makinelerden erişilebilir yapar; firewall'da TCP `4723` portunu aç.
- Herhangi bir makinedeki test kodu, WebDriver/Appium URL'si olarak `http://YOUR_DOMAIN:4723` kullanır (düz HTTP, `/#/` yok).
- **Android'de dikkat:** Appium, üzerinde çalıştığı makinenin `adb`'sini kullanır; `adb connect $REMOTE_CONNECT_URL` bu nedenle **Appium hostunda** çalışmalıdır. Önce o hostun `~/.android/adbkey.pub` anahtarını **Settings → Keys → ADB Keys** altında kaydet. Ruby yardımcı, `MERCURY_ADB_SSH=user@YOUR_DOMAIN` verilirse komutu SSH ile çalıştırır; verilmezse bağlantı Appium hostunda önceden hazır olmalıdır. Java ve Playwright örneklerinde bu SSH yardımcısı yoktur.
- **iOS:** WDA adresini `appium:webDriverAgentUrl` olarak ver. Mercury çıplak `HOST:PORT` döndürebilir; yalnız şema yoksa `http://HOST:PORT` biçimine getir. Ruby yardımcı bunu otomatik yapar.
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
- `timeout` zorunlu, `60..10800` saniye
- `run` zorunlu (koşu adı/id) — **Builds sayfasında görünecek isim budur**; `nightly-regression-2026-07-19` veya CI build numarası gibi okunaklı bir değer seç
- `project` opsiyonel — koşumları Builds sayfasında proje başlığı altında gruplar; koştuğun projenin adını gönder (örn. `project=PROJE_ADIN`). Her koşum (bugünkü, yarınki) o başlık altında ayrı satır kalır
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

`Tamamlandı` yalnız rezervasyonun kapandığını (açık release veya timeout)
gösterir; test assertion'ının geçtiği anlamına **gelmez**. Test sonucu process
exit code'u ve assertion'lardan gelir. Başarısız test cleanup'ta grubu
bıraktığında veya timeout dolduğunda Builds kaydı yine `Tamamlandı` görünebilir.
Test sonucunu bu sayfada göstermek için release çağrısında
`result=passed|failed` raporla — ayrı bir **PASSED**/**FAILED** rozeti olarak
görünür.

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

İsteğe bağlı olarak test sonucunu `result=passed|failed` ile raporla; Builds
sayfasında durum rozetinin yanında **PASSED**/**FAILED** rozeti olarak görünür:

```bash
curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?group=GROUP_ID&result=passed"
```

`result` verilmeden bırakılan (veya timeout ile kapanan) koşumlarda rozet
görünmez. Ruby örnekleri sonucu script çıktısından otomatik raporlar.

### Builds sayfasında senaryo sonuçları

Senaryo bazında sonuç raporla; koşumun altında açılır liste olarak görünür
(durum, süre ve hata mesajıyla). Liste öncekini değiştirir; bu yüzden koşum
sonunda tam seti tek seferde gönder (örn. Cucumber `at_exit`/after-suite hook):

```bash
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{"scenarios":[
    {"name":"Geçerli kullanıcıyla giriş","status":"passed","durationSec":12.4},
    {"name":"Kuponla ödeme","status":"failed","error":"buton bulunamadı"},
    {"name":"Misafir akışı","status":"skipped"}
  ]}' \
  "https://YOUR_DOMAIN/api/v1/builds/GROUP_ID/scenarios"
```

- `GROUP_ID`, reserve çağrısının döndürdüğü id'dir (koşum başına en fazla 500 senaryo).
- Release'te `result` gönderilmediyse rozet senaryolardan otomatik türetilir: herhangi bir `failed` senaryo → **FAILED**, yoksa **PASSED**.
- `GET /api/v1/builds/{id}` tam senaryo listesini döndürür (sahibi veya admin).
- `project` ile birlikte hiyerarşi şöyle olur: **proje → günlük koşumlar → senaryolar**.

### Uçtan uca örnekler

İngilizce bölümdeki örnekler her iki topolojiyi de destekler; ortam değişkeniyle seçilir:

- **Python (Android)**: [Python end-to-end example](#python-android-end-to-end-example-both-appium-topologies) — `APPIUM` değişkenini `http://127.0.0.1:4723` (Topoloji A) veya `http://YOUR_DOMAIN:4723` (Topoloji B) yap; Topoloji B'de `ADB_SSH` değerini Appium hostuna ayarla.
- **Ruby (hazır script'ler)** — tıklayıp aç:
  - [examples/automation-ruby/single_run.rb](../examples/automation-ruby/single_run.rb) — **tekli koşum**: 1 cihaz ayır (filtreyle veya serial ile), bağlan, testi koştur, bırak
  - [examples/automation-ruby/parallel_run.rb](../examples/automation-ruby/parallel_run.rb) — **çoklu (paralel) koşum**: N cihazı tek grupta ayır, her cihazı ayrı thread'de koştur, tek sefer bırak
  - [examples/automation-ruby/settings_test_pass.rb](../examples/automation-ruby/settings_test_pass.rb) — **başarılı Appium senaryosu**: Ayarlar'ı aç, Genel'e tıkla, doğrula, PASS
  - [examples/automation-ruby/settings_test_fail.rb](../examples/automation-ruby/settings_test_fail.rb) — **başarısız Appium senaryosu**: olmayan menüyü arar, exit 1; cihaz yine bırakılır
  - [examples/automation-ruby/mercury_client.rb](../examples/automation-ruby/mercury_client.rb) — ortak istemci (`reserve` / `use_device` / `release`), ek gem gerekmez
  - [examples/automation-ruby/test_mercury_client.rb](../examples/automation-ruby/test_mercury_client.rb) — API istekleri, platform algılama, tekli/paralel akış ve cleanup için yerel kontrat testleri (farm/cihaz gerekmez)
  - Kurulum ve ortam değişkenleri: [examples/automation-ruby/README.md](../examples/automation-ruby/README.md)
- **Java (hazır proje)** — aynı akış Java 17 + Maven ile (Appium java-client): [examples/automation-java/README.md](../examples/automation-java/README.md) — tekli [SingleRun.java](../examples/automation-java/src/main/java/mercury/SingleRun.java), çoklu [ParallelRun.java](../examples/automation-java/src/main/java/mercury/ParallelRun.java), başarılı/başarısız senaryolar dahil.
- **Playwright (sadece Android)** — Appium'suz, adb üzerinden cihazdaki Chrome'u sürer: [examples/automation-playwright/README.md](../examples/automation-playwright/README.md) — tekli [single-run.mjs](../examples/automation-playwright/single-run.mjs), çoklu [parallel-run.mjs](../examples/automation-playwright/parallel-run.mjs), başarılı/başarısız web senaryoları dahil. iOS için Appium örneklerine bak.
- **Azure Pipelines**: [Azure Pipeline Example](#azure-pipeline-example-ruby--mercury) — Topoloji A'da Appium CI agent'ta kurulup başlatılır; Topoloji B'de Appium adımları kaldırılıp `APPIUM_URL` farm sunucusuna yönlendirilir.

Her örnekte akış aynıdır: ayır (`run` adı Builds'de görünür) → `useDevice` → Android'de `adb connect` (Appium'un çalıştığı makinede), iOS'ta normalize edilmiş WDA URL → Appium session → `finally` içinde release. Ruby'de `MERCURY_TYPE` verilmezse platform ayrılan cihazın metadata'sından algılanır.
