# Getting Started (EN + TR)

Mercury Device Farm in this repository is maintained as a **macOS-focused setup**.

---

## English

### 1) Prerequisites

Install required tools:

```bash
brew install --cask docker
brew install node
brew install android-platform-tools
brew install libimobiledevice usbmuxd
xcode-select --install
```

Open Docker Desktop and Xcode at least once after installation.

### 2) Install Project

```bash
git clone https://github.com/erdncyz/mercury.git
cd mercury
npm ci
```

### 3) Start the System

```bash
npm run stack:up:macos
```

### 4) Verify Services

```bash
npm run stack:ps:macos
```

All core services should show `Up`.

### 5) Open Web UI

- `https://localhost`

### 6) Connect Devices

Android:
1. Enable Developer Options and USB Debugging.
2. Connect device via USB.
3. Accept RSA prompt on the device.

iOS:
1. Connect iPhone/iPad via USB.
2. Tap **Trust This Computer**.
3. Make sure Xcode signing for WDA is configured.

### Restart Commands

Full stack restart:

```bash
npm run stack:up:macos
```

Restart Android provider path:

```bash
docker restart mercury-provider mercury-websocket
```

Restart iOS provider runtime:

```bash
$HOME/.mercury-farm-runtime/scripts/start-ios-provider.sh
```

Restart specific stack services:

```bash
docker compose -f docker-compose-macos.yaml up -d mercury-provider mercury-websocket mercury-app
```

### Logs / Troubleshooting

```bash
docker logs -f mercury-provider
docker logs -f mercury-websocket
docker logs -f mercury-nginx
```

---

## Türkçe

### 1) Ön Koşullar

Gerekli araçları kurun:

```bash
brew install --cask docker
brew install node
brew install android-platform-tools
brew install libimobiledevice usbmuxd
xcode-select --install
```

Kurulumdan sonra Docker Desktop ve Xcode'u en az bir kez açın.

### 2) Projeyi Kur

```bash
git clone https://github.com/erdncyz/mercury.git
cd mercury
npm ci
```

### 3) Sistemi Ayağa Kaldır

```bash
npm run stack:up:macos
```

### 4) Servisleri Kontrol Et

```bash
npm run stack:ps:macos
```

Temel servislerin `Up` durumda olması gerekir.

### 5) Web Arayüzünü Aç

- `https://localhost`

### 6) Cihazları Bağla

Android:
1. Geliştirici seçenekleri ve USB hata ayıklamayı aç.
2. Cihazı USB ile bağla.
3. Cihazdaki RSA onayını kabul et.

iOS:
1. iPhone/iPad'i USB ile bağla.
2. **Bu Bilgisayara Güven** onayını ver.
3. WDA için Xcode signing ayarlarının doğru olduğundan emin ol.

### Restart Komutları

Tüm sistemi yeniden başlat:

```bash
npm run stack:up:macos
```

Android provider tarafını yeniden başlat:

```bash
docker restart mercury-provider mercury-websocket
```

iOS provider runtime'ını yeniden başlat:

```bash
$HOME/.mercury-farm-runtime/scripts/start-ios-provider.sh
```

Belirli servisleri yeniden başlat:

```bash
docker compose -f docker-compose-macos.yaml up -d mercury-provider mercury-websocket mercury-app
```

### Log / Sorun Giderme

```bash
docker logs -f mercury-provider
docker logs -f mercury-websocket
docker logs -f mercury-nginx
```
