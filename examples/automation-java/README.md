# Mercury Java Automation Examples / Örnekleri

Java 17 + Maven. Appium testleri için `io.appium:java-client`, REST istemcisi için `gson`.
Ruby eşleniği / Ruby counterpart: [examples/automation-ruby](../automation-ruby/README.md) ·
Detaylı API dokümanı / Full API docs: [docs/automation-api.md](../../docs/automation-api.md)

| Dosya | Ne için? |
| --- | --- |
| [MercuryClient.java](./src/main/java/mercury/MercuryClient.java) | Ortak istemci: `reserve` / `useDevice` / `release` |
| [SingleRun.java](./src/main/java/mercury/SingleRun.java) | **Tekli koşum** — 1 cihaz ayır, bağlan, test koştur, bırak |
| [ParallelRun.java](./src/main/java/mercury/ParallelRun.java) | **Çoklu (paralel) koşum** — N cihazı tek grupta ayır, thread pool ile paralel koştur |
| [AppiumSession.java](./src/main/java/mercury/AppiumSession.java) | Örnek testler için yardımcı: ayır + Appium session aç + her durumda bırak |
| [SettingsTestPass.java](./src/main/java/mercury/SettingsTestPass.java) | **✅ Başarılı senaryo** — Ayarlar'ı aç, "Genel"e tıkla, doğrula, PASS |
| [SettingsTestFail.java](./src/main/java/mercury/SettingsTestFail.java) | **❌ Başarısız senaryo** — olmayan menüyü arar, exit 1; cihaz yine bırakılır |
| [Adb.java](./src/main/java/mercury/Adb.java) | `adb connect` yardımcısı |

## Hızlı başlangıç / Quick start

```bash
export MERCURY_BASE_URL=https://YOUR_DOMAIN   # UI'daki /#/ olmadan
export MERCURY_TOKEN=...                      # UI > Settings > Keys > Access Tokens
export MERCURY_TYPE=android                   # android | ios — platforma özel koşularda şart!

mvn -q compile exec:java -Dexec.mainClass=mercury.SingleRun                       # tekli koşum / single run
MERCURY_AMOUNT=2 mvn -q compile exec:java -Dexec.mainClass=mercury.ParallelRun    # çoklu koşum / parallel run
```

## Örnek Appium test senaryoları / Example Appium test scenarios

```bash
appium --address 127.0.0.1 --port 4723 &      # UiAutomator2/XCUITest driver kurulu olmalı

mvn -q compile exec:java -Dexec.mainClass=mercury.SettingsTestPass   # ✅ PASS (exit 0)
mvn -q compile exec:java -Dexec.mainClass=mercury.SettingsTestFail   # ❌ FAIL (exit 1, cihaz yine bırakılır)
```

Merkezi Appium kullanmak için `APPIUM_URL=http://APPIUM_HOST:4723` ver. Android
`adb connect` komutu Appium ile aynı makinede çalışmalıdır; Java yardımcı SSH
otomasyonu yapmaz, bu nedenle merkezi Appium hostunda bağlantıyı testten önce
hazırla. O hostun `~/.android/adbkey.pub` anahtarını Mercury'de **Settings →
Keys → ADB Keys** altında kaydet.

For central Appium, set `APPIUM_URL=http://APPIUM_HOST:4723`. Android
`adb connect` must run on the same machine as Appium; the Java helper does not
automate SSH, so prepare the connection on the central Appium host before the
test. Register that host's `~/.android/adbkey.pub` under Mercury **Settings →
Keys → ADB Keys**.

iOS'ta/On iOS, Mercury'nin döndürdüğü şemasız `HOST:PORT` WDA adresi Java
helper tarafından otomatik olarak `http://HOST:PORT` biçimine getirilir / the
Java helper automatically normalizes Mercury's bare `HOST:PORT` WDA endpoint
to `http://HOST:PORT`.

## Ortam değişkenleri / Environment variables

[Ruby örnekleriyle aynı / same as the Ruby examples](../automation-ruby/README.md#ortam-değişkenleri):
`MERCURY_BASE_URL`, `MERCURY_TOKEN`, `MERCURY_TYPE`, `MERCURY_SERIALS`,
`MERCURY_AMOUNT`, `MERCURY_TIMEOUT`, `MERCURY_RUN`, `CI_JOB_URL`,
`MERCURY_HOLD_SECONDS`, `APPIUM_URL`.

## Akış / Workflow

Temel akış Ruby örnekleriyle aynıdır (reserve → useDevice → adb connect/WDA →
test → release), ancak Java yardımcı Ruby'deki `MERCURY_ADB_SSH` ve platform
auto-detect kolaylıklarını içermez; `MERCURY_TYPE` değerini açıkça ver.
Diyagramlar için: [automation-ruby/README.md](../automation-ruby/README.md#akış--workflow)

The core flow matches the Ruby examples (reserve → useDevice → adb connect/WDA
→ test → release), but the Java helper does not implement Ruby's
`MERCURY_ADB_SSH` or platform auto-detection; set `MERCURY_TYPE` explicitly.
See the diagrams in
[automation-ruby/README.md](../automation-ruby/README.md#akış--workflow).
