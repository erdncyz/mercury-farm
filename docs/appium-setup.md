# Appium Setup (EN + TR)

Step-by-step Appium host setup for Android and iOS on macOS. Install Appium and
its platform drivers only on the machine that will run the Appium **server**.
A client using central Appium does not need a local Appium installation.

---

## English

## 1) Prerequisites

Run the installation and health-check commands in this guide on the **Appium
host**. In Topology A that is the test runner; in Topology B it is the central
farm/Appium machine.

Install base tools:

```bash
brew install node
brew install --cask android-platform-tools
brew install --cask temurin
brew install libimobiledevice usbmuxd
xcode-select --install
```

Check versions:

```bash
node -v
npm -v
java -version
adb version
xcodebuild -version
```

---

## 2) Install Appium

```bash
npm install -g appium
appium -v
```

Install Appium Inspector:

- Download **Appium Inspector** from the [official release page](https://github.com/appium/appium-inspector/releases).
- Inspector is only the client UI. It may connect to local Appium at `127.0.0.1:4723` or central Appium at `APPIUM_HOST:4723`.
- When central Appium is used, do not install/start another Appium server or platform driver on the Inspector/test machine.
- Follow [Appium Integration](./appium-integration.md) for the exact Android and iOS Inspector fields and capabilities.

---

## 3) Install Appium drivers

### Android (UiAutomator2)

```bash
appium driver install uiautomator2
```

### iOS (XCUITest)

```bash
appium driver install xcuitest
```

Verify:

```bash
appium driver list --installed
```

---

## 4) Android setup details

These USB steps validate a directly connected local device. For a Mercury
device, reserve it first and run `adb connect <remoteConnectUrl>` on the
**Appium host** as described in [Appium Integration](./appium-integration.md).
Register that host's `~/.android/adbkey.pub` under **Settings → Keys → ADB
Keys**; otherwise ADB can fail with `failed to authenticate`/`unauthorized`.

1. Enable Developer Options + USB Debugging on device.
2. Connect device by USB.
3. Verify:

```bash
adb devices
```

You should see a device in `device` state.

---

## 5) iOS setup details

1. Open Xcode once and accept license:

```bash
sudo xcodebuild -license accept
```

2. Connect iPhone/iPad and trust the computer.
3. Verify device visibility:

```bash
idevice_id -l
```

4. For simulators:

```bash
xcrun simctl list devices
```

Notes:

- Real iOS automation requires proper signing/provisioning through Xcode/WebDriverAgent flow.
- In Mercury flow, host iOS provider handles WDA lifecycle.
- A remote Appium/Inspector runner validates the WDA proxy URL instead of expecting the Mercury iOS device to appear over local USB.

---

## 6) Start Appium server

Run this only on the selected Appium host.

```bash
appium
```

Default URL:

- `http://127.0.0.1:4723`

If needed:

```bash
appium --address 0.0.0.0 --port 4723
```

Use `127.0.0.1` for local-only Appium. A central Appium must listen on a
reachable interface such as `0.0.0.0`; restrict TCP `4723` to your internal
network/VPN because Appium has no built-in authentication. From a client,
verify it with `curl http://APPIUM_HOST:4723/status`.

---

## 7) Minimum capability templates

### Android

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:udid": "ANDROID_SERIAL",
  "appium:newCommandTimeout": 120
}
```

### iOS

```json
{
  "platformName": "iOS",
  "appium:automationName": "XCUITest",
  "appium:udid": "IOS_UDID",
  "appium:newCommandTimeout": 120
}
```

For Mercury remote flow, see:

- [Appium Integration](./appium-integration.md)

---

## 8) Quick health checks

Run these on the Appium host (only the checks relevant to its platform):

```bash
/bin/bash ~/.mercury-farm/current/scripts/check-appium-setup.sh
appium -v
appium driver list --installed
adb devices
idevice_id -l
```

---

## 9) Common errors

1. `Could not find a driver for automationName`

- Driver is not installed. Run:
  - `appium driver install uiautomator2`
  - `appium driver install xcuitest`

2. Android device not visible

- For USB, reconnect the cable and run `adb kill-server && adb start-server`.
- For Mercury, run `adb connect <remoteConnectUrl>` on the Appium host and check `adb devices -l` there.
- For `failed to authenticate`/`unauthorized`, register the Appium host's `~/.android/adbkey.pub` in **Settings → Keys → ADB Keys**, then reconnect.

3. iOS device not visible

- Re-check trust prompt, cable/hub quality, and Xcode device visibility.

4. Session created then closed

- Increase `appium:newCommandTimeout` and review Appium server logs.

---

## Türkçe

## 1) Ön koşullar

Bu rehberdeki kurulum ve sağlık kontrolü komutlarını **Appium hostunda**
çalıştır. Topoloji A'da bu test runner'ı, Topoloji B'de merkezi farm/Appium
makinesidir. Merkezi Appium kullanan istemci makineye lokal Appium kurulmaz.

Temel araçları kur:

```bash
brew install node
brew install --cask android-platform-tools
brew install --cask temurin
brew install libimobiledevice usbmuxd
xcode-select --install
```

Sürümleri doğrula:

```bash
node -v
npm -v
java -version
adb version
xcodebuild -version
```

---

## 2) Appium kurulumu

```bash
npm install -g appium
appium -v
```

Appium Inspector’ı kur:

- **Appium Inspector** uygulamasını [resmî sürüm sayfasından](https://github.com/appium/appium-inspector/releases) indir.
- Inspector yalnızca istemci arayüzüdür; lokal `127.0.0.1:4723` veya merkezi `APPIUM_HOST:4723` Appium'a bağlanabilir.
- Merkezi Appium kullanırken Inspector/test makinesine ayrıca Appium server veya platform driver kurma.
- Android ve iOS için kullanılacak Inspector alanları ve capability değerleri [Appium Integration](./appium-integration.md) dokümanında bulunur.

---

## 3) Appium driver kurulumu

### Android (UiAutomator2)

```bash
appium driver install uiautomator2
```

### iOS (XCUITest)

```bash
appium driver install xcuitest
```

Doğrulama:

```bash
appium driver list --installed
```

---

## 4) Android kurulum detayları

Bu USB adımları doğrudan bağlı lokal cihazı doğrular. Mercury cihazı için önce
rezervasyon yap ve [Appium Integration](./appium-integration.md) dokümanındaki
`adb connect <remoteConnectUrl>` adımını **Appium hostunda** çalıştır. O hostun
`~/.android/adbkey.pub` anahtarını **Settings → Keys → ADB Keys** altında
kaydet; aksi halde ADB `failed to authenticate`/`unauthorized` dönebilir.

1. Cihazda Developer Options + USB Debugging aç.
2. Cihazı USB ile bağla.
3. Doğrula:

```bash
adb devices
```

Durum `device` olmalı.

---

## 5) iOS kurulum detayları

1. Xcode’u bir kez aç ve lisansı kabul et:

```bash
sudo xcodebuild -license accept
```

2. iPhone/iPad’i bağla ve güven onayını ver.
3. Cihaz görünürlüğünü kontrol et:

```bash
idevice_id -l
```

4. Simulator için:

```bash
xcrun simctl list devices
```

Not:

- Gerçek iOS otomasyonu için Xcode/WebDriverAgent signing süreci gerekir.
- Mercury akışında WDA yaşam döngüsünü host iOS provider yönetir.
- Uzak Appium/Inspector runner, Mercury iOS cihazının lokal USB’de görünmesini beklemek yerine WDA proxy URL’sini doğrular.

---

## 6) Appium server başlatma

Bu komutu yalnız seçilen Appium hostunda çalıştır.

```bash
appium
```

Varsayılan adres:

- `http://127.0.0.1:4723`

Gerekirse:

```bash
appium --address 0.0.0.0 --port 4723
```

Yalnız lokal erişim için `127.0.0.1` kullan. Merkezi Appium erişilebilir bir
arayüzde (`0.0.0.0` gibi) dinlemelidir; Appium'da yerleşik kimlik doğrulama
olmadığı için TCP `4723` portunu iç ağ/VPN ile sınırla. İstemciden
`curl http://APPIUM_HOST:4723/status` ile doğrula.

---

## 7) Minimum capability şablonları

### Android

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:udid": "ANDROID_SERIAL",
  "appium:newCommandTimeout": 120
}
```

### iOS

```json
{
  "platformName": "iOS",
  "appium:automationName": "XCUITest",
  "appium:udid": "IOS_UDID",
  "appium:newCommandTimeout": 120
}
```

Mercury remote akışı için:

- [Appium Integration](./appium-integration.md)

---

## 8) Hızlı sağlık kontrolleri

Bu kontrolleri Appium hostunda (yalnız ilgili platform için) çalıştır:

```bash
/bin/bash ~/.mercury-farm/current/scripts/check-appium-setup.sh
appium -v
appium driver list --installed
adb devices
idevice_id -l
```

---

## 9) Sık hatalar

1. `Could not find a driver for automationName`

- Driver eksik:
  - `appium driver install uiautomator2`
  - `appium driver install xcuitest`

2. Android cihaz görünmüyor

- USB için kabloyu kontrol et, `adb kill-server && adb start-server` dene.
- Mercury için `adb connect <remoteConnectUrl>` komutunu Appium hostunda çalıştır ve oradaki `adb devices -l` çıktısını kontrol et.
- `failed to authenticate`/`unauthorized` için Appium hostunun `~/.android/adbkey.pub` anahtarını **Settings → Keys → ADB Keys** altında kaydet, sonra tekrar bağlan.

3. iOS cihaz görünmüyor

- Trust onayı, kablo/hub kalitesi ve Xcode tarafını kontrol et.

4. Session açılıp hemen kapanıyor

- `appium:newCommandTimeout` artır, Appium loglarını incele.
