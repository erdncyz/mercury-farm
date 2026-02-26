# Mercury Device Farm (macOS)

Mercury is a browser-based real-device lab for Android and iOS.
This repository is optimized for **macOS** because iOS automation requires Xcode tooling on host.

## Quick Start

```bash
npm ci
npm run stack:up:macos
./scripts/start-ios-provider.sh
```

Open UI:

- `https://localhost`

## Documentation

- [Getting Started (EN + TR)](docs/getting-started.md)
- [iOS Setup (EN + TR)](docs/ios-setup.md)
- [Scaling Guide (EN + TR)](docs/scaling.md)
- [Automation API (EN + TR)](docs/automation-api.md)
- [API Reference (EN + TR)](docs/API.md)
- [ESP32 Notes (EN + TR)](docs/esp32.md)

## Common Issue: iOS switches to Automation after Docker is stopped

If containers are removed but plugging an iOS device still triggers automation mode, a host LaunchAgent is likely still active.

```bash
launchctl bootout gui/$(id -u)/com.mercury.ios-provider || true
launchctl disable gui/$(id -u)/com.mercury.ios-provider || true
rm -f "$HOME/Library/LaunchAgents/com.mercury.ios-provider.plist"
pkill -f "stf.mjs ios-provider" || true
pkill -f WebDriverAgentRunner || true
```

Verification:

```bash
launchctl print gui/$(id -u)/com.mercury.ios-provider
```

Expected output: `Could not find service "com.mercury.ios-provider"`.

---

# Mercury Device Farm (macOS) [Türkçe]

Mercury, Android ve iOS için tarayıcı tabanlı gerçek cihaz laboratuvarıdır.
Bu repo iOS tarafı için Xcode gerektiğinden **macOS odaklıdır**.

## Hızlı Başlangıç

```bash
npm ci
npm run stack:up:macos
./scripts/start-ios-provider.sh
```

Arayüz:

- `https://localhost`

## Dokümanlar

- [Başlangıç Rehberi (EN + TR)](docs/getting-started.md)
- [iOS Kurulumu (EN + TR)](docs/ios-setup.md)
- [Ölçekleme Rehberi (EN + TR)](docs/scaling.md)
- [Otomasyon API (EN + TR)](docs/automation-api.md)
- [API Referansı (EN + TR)](docs/API.md)
- [ESP32 Notları (EN + TR)](docs/esp32.md)

## Sık Karşılaşılan Durum: Docker kapalıyken iOS yine Automation moduna geçiyor

Container'lar silinse bile host üzerinde LaunchAgent çalışıyorsa iOS provider tekrar devreye girebilir.

```bash
launchctl bootout gui/$(id -u)/com.mercury.ios-provider || true
launchctl disable gui/$(id -u)/com.mercury.ios-provider || true
rm -f "$HOME/Library/LaunchAgents/com.mercury.ios-provider.plist"
pkill -f "stf.mjs ios-provider" || true
pkill -f WebDriverAgentRunner || true
```

Doğrulama:

```bash
launchctl print gui/$(id -u)/com.mercury.ios-provider
```

Beklenen çıktı: `Could not find service "com.mercury.ios-provider"`.

## License

Apache License 2.0.
