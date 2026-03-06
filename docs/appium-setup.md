# Appium Setup (EN + TR)

Step-by-step Appium installation guide for Android and iOS on macOS (recommended for Mercury).

---

## English

## 1) Prerequisites

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

## 2) Install Appium 2

```bash
npm install -g appium
appium -v
```

Optional (Inspector):

- Install **Appium Inspector** desktop app from the official release page.

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

---

## 6) Start Appium server

```bash
appium
```

Default URL:

- `http://127.0.0.1:4723`

If needed:

```bash
appium --address 0.0.0.0 --port 4723
```

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

```bash
./scripts/check-appium-setup.sh
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

- Reconnect USB, check cable, run `adb kill-server && adb start-server`.

3. iOS device not visible

- Re-check trust prompt, cable/hub quality, and Xcode device visibility.

4. Session created then closed

- Increase `appium:newCommandTimeout` and review Appium server logs.

---

## Türkçe

## 1) Ön koşullar

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

## 2) Appium 2 kurulumu

```bash
npm install -g appium
appium -v
```

Opsiyonel (Inspector):

- **Appium Inspector** masaüstü uygulamasını resmi sürüm sayfasından kur.

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

---

## 6) Appium server başlatma

```bash
appium
```

Varsayılan adres:

- `http://127.0.0.1:4723`

Gerekirse:

```bash
appium --address 0.0.0.0 --port 4723
```

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

```bash
./scripts/check-appium-setup.sh
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

- USB/cable kontrol et, `adb kill-server && adb start-server` dene.

3. iOS cihaz görünmüyor

- Trust onayı, kablo/hub kalitesi ve Xcode tarafını kontrol et.

4. Session açılıp hemen kapanıyor

- `appium:newCommandTimeout` artır, Appium loglarını incele.
