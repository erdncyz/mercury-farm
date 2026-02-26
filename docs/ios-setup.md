# iOS Setup (EN + TR)

This document focuses on iOS-specific setup and troubleshooting.

---

## English

### What runs where?

- Docker services: API/UI/WebSocket/provider (Android path)
- Host macOS service: iOS provider (`./scripts/start-ios-provider.sh`)
- Why host: iOS automation depends on Xcode tooling and USB access

### Minimum checks

```bash
xcodebuild -version
idevice_id -l
```

If no device appears, trust prompt and cable/hub quality are the first things to check.

### Start iOS provider (manual)

```bash
./scripts/start-ios-provider.sh
```

### Start iOS provider (persistent LaunchAgent)

```bash
./scripts/deploy-ios-provider-runtime.sh
```

### Useful runtime variables

- `IOS_PROVIDER_SHARD` (default: `0`)
- `IOS_PORT_STRIDE` (default: `1000`)
- `IOS_ALLOW_SIMULATORS` (default: `0`)
- `IOS_SERIALS` (comma-separated UDIDs)
- `IOS_WDA_REQUEST_TIMEOUT_MS`
- `IOS_WDA_SESSION_TIMEOUT_MS`
- `IOS_WDA_LEAN_MODE`

Example:

```bash
IOS_PROVIDER_SHARD=1 IOS_ALLOW_SIMULATORS=0 ./scripts/start-ios-provider.sh
```

### Common problems

Provider still auto-starts after Docker is stopped:

```bash
launchctl bootout gui/$(id -u)/com.mercury.ios-provider || true
launchctl disable gui/$(id -u)/com.mercury.ios-provider || true
rm -f "$HOME/Library/LaunchAgents/com.mercury.ios-provider.plist"
pkill -f "stf.mjs ios-provider" || true
pkill -f WebDriverAgentRunner || true
```

### Logs

```bash
tail -f "$HOME/.mercury-farm-runtime/ios-provider.launchd.out.log"
tail -f "$HOME/.mercury-farm-runtime/ios-provider.launchd.err.log"
```

---

## Türkçe

### Ne nerede çalışır?

- Docker servisleri: API/UI/WebSocket/provider (Android yolu)
- Host macOS servisi: iOS provider (`./scripts/start-ios-provider.sh`)
- Neden host: iOS otomasyonu Xcode araçları ve USB erişimi gerektirir

### Minimum kontroller

```bash
xcodebuild -version
idevice_id -l
```

Cihaz görünmüyorsa önce güven onayı ve kablo/hub kalitesini kontrol edin.

### iOS provider başlatma (manuel)

```bash
./scripts/start-ios-provider.sh
```

### iOS provider başlatma (kalıcı LaunchAgent)

```bash
./scripts/deploy-ios-provider-runtime.sh
```

### Önemli runtime değişkenleri

- `IOS_PROVIDER_SHARD` (varsayılan: `0`)
- `IOS_PORT_STRIDE` (varsayılan: `1000`)
- `IOS_ALLOW_SIMULATORS` (varsayılan: `0`)
- `IOS_SERIALS` (virgülle ayrılmış UDID)
- `IOS_WDA_REQUEST_TIMEOUT_MS`
- `IOS_WDA_SESSION_TIMEOUT_MS`
- `IOS_WDA_LEAN_MODE`

Örnek:

```bash
IOS_PROVIDER_SHARD=1 IOS_ALLOW_SIMULATORS=0 ./scripts/start-ios-provider.sh
```

### Sık sorun

Docker dursa da provider otomatik açılıyorsa:

```bash
launchctl bootout gui/$(id -u)/com.mercury.ios-provider || true
launchctl disable gui/$(id -u)/com.mercury.ios-provider || true
rm -f "$HOME/Library/LaunchAgents/com.mercury.ios-provider.plist"
pkill -f "stf.mjs ios-provider" || true
pkill -f WebDriverAgentRunner || true
```

### Loglar

```bash
tail -f "$HOME/.mercury-farm-runtime/ios-provider.launchd.out.log"
tail -f "$HOME/.mercury-farm-runtime/ios-provider.launchd.err.log"
```
