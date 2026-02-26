# Getting Started (EN + TR)

This guide is the fastest path to run Mercury on macOS.

---

## English

### 1) Prerequisites

```bash
brew install --cask docker
brew install node
brew install android-platform-tools
brew install libimobiledevice usbmuxd
xcode-select --install
```

Open Docker Desktop and Xcode once after installation.

### 2) Install Dependencies

```bash
npm ci
```

### 3) Start Core Stack (Docker)

```bash
npm run stack:up:macos
```

### 4) Start iOS Provider (Host)

```bash
./scripts/start-ios-provider.sh
```

### 5) Verify

```bash
npm run stack:ps:macos
```

Open UI:

- `https://localhost`

### Restart Commands

Full stack:

```bash
npm run stack:up:macos
```

Android path only:

```bash
docker restart mercury-provider mercury-websocket
```

iOS provider (host):

```bash
./scripts/start-ios-provider.sh
```

### Optional: Auto-start iOS provider with LaunchAgent

```bash
./scripts/deploy-ios-provider-runtime.sh
```

This installs `com.mercury.ios-provider` under `~/Library/LaunchAgents` with keep-alive behavior.

### Disable Host iOS Auto-Start

```bash
launchctl bootout gui/$(id -u)/com.mercury.ios-provider || true
launchctl disable gui/$(id -u)/com.mercury.ios-provider || true
rm -f "$HOME/Library/LaunchAgents/com.mercury.ios-provider.plist"
pkill -f "stf.mjs ios-provider" || true
pkill -f WebDriverAgentRunner || true
```

### Logs / Troubleshooting

```bash
docker logs -f mercury-api
docker logs -f mercury-provider
docker logs -f mercury-websocket
docker logs -f mercury-nginx
tail -f "$HOME/.mercury-farm-runtime/ios-provider.launchd.out.log"
tail -f "$HOME/.mercury-farm-runtime/ios-provider.launchd.err.log"
```

---

## Türkçe

### 1) Ön Koşullar

```bash
brew install --cask docker
brew install node
brew install android-platform-tools
brew install libimobiledevice usbmuxd
xcode-select --install
```

Kurulumdan sonra Docker Desktop ve Xcode'u en az bir kez açın.

### 2) Bağımlılıkları Kur

```bash
npm ci
```

### 3) Çekirdek Stack'i Başlat (Docker)

```bash
npm run stack:up:macos
```

### 4) iOS Provider'ı Başlat (Host)

```bash
./scripts/start-ios-provider.sh
```

### 5) Doğrulama

```bash
npm run stack:ps:macos
```

Arayüz:

- `https://localhost`

### Yeniden Başlatma Komutları

Tam stack:

```bash
npm run stack:up:macos
```

Sadece Android yolu:

```bash
docker restart mercury-provider mercury-websocket
```

iOS provider (host):

```bash
./scripts/start-ios-provider.sh
```

### Opsiyonel: LaunchAgent ile iOS provider otomatik başlatma

```bash
./scripts/deploy-ios-provider-runtime.sh
```

Bu komut, `~/Library/LaunchAgents` altında `com.mercury.ios-provider` kaydını `keep-alive` ile kurar.

### Host iOS Otomatik Başlatmayı Kapatma

```bash
launchctl bootout gui/$(id -u)/com.mercury.ios-provider || true
launchctl disable gui/$(id -u)/com.mercury.ios-provider || true
rm -f "$HOME/Library/LaunchAgents/com.mercury.ios-provider.plist"
pkill -f "stf.mjs ios-provider" || true
pkill -f WebDriverAgentRunner || true
```

### Log / Sorun Giderme

```bash
docker logs -f mercury-api
docker logs -f mercury-provider
docker logs -f mercury-websocket
docker logs -f mercury-nginx
tail -f "$HOME/.mercury-farm-runtime/ios-provider.launchd.out.log"
tail -f "$HOME/.mercury-farm-runtime/ios-provider.launchd.err.log"
```
