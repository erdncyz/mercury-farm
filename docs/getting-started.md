# Getting Started (EN + TR)

This is the canonical runbook to bring Mercury up on macOS.

---

## English

### How it works

Mercury runs in two parts:

- **Docker stack** (all backend services + the **Android** provider) — started
  with `npm run stack:up:image:macos`, using the prebuilt image from GHCR.
- **iOS provider on the host** — started with `./scripts/start-ios-provider.sh`.
  It must run outside Docker because iOS automation needs Xcode / WebDriverAgent
  on the Mac.

For Android-only you just need the Docker stack; add the host iOS provider for iOS.

### 1) Prerequisites

```bash
brew install --cask docker
brew install node
brew install android-platform-tools
brew install libimobiledevice usbmuxd
xcode-select --install
```

Open Docker Desktop and Xcode at least once after installation.

### 2) Get the Code

```bash
git clone https://github.com/erdncyz/mercury-farm.git
cd mercury-farm
npm ci
```

> The web UI is a private submodule and is **not** needed locally — the prebuilt
> image already contains it. `npm ci` only installs host tools for the iOS provider.

### 3) Start Core Stack (prebuilt Docker image)

```bash
npm run stack:up:image:macos
```

This detects your domain, pulls `ghcr.io/erdncyz/mercury-farm:latest`, and starts
all containers — no local build.

### 4) Start iOS Provider (Host)

```bash
./scripts/start-ios-provider.sh
```

### 5) Verify

```bash
npm run stack:ps:macos
pgrep -af "mercury.mjs ios-provider|mercury-ios-provider|lib/cli ios-device"
```

### 6) Open UI

Mercury is configured with dynamic domain detection (`MERCURY_DOMAIN`).
Open with your detected host IP/domain (not only localhost):

- `https://<MERCURY_DOMAIN>`

Example:

- `https://192.168.x.xxx`

Note:

- In Mock auth mode, `Name` and `Email` fields are empty by default.
- Each user should fill their own values.
- There is no fixed admin account in Mock auth; the first logged-in user is created as admin.

### Restart Commands

Full stack:

```bash
npm run stack:up:image:macos
./scripts/start-ios-provider.sh
```

Docker services only:

```bash
docker restart mercury-provider mercury-websocket mercury-nginx
```

### Update After New Commits (pull and re-run)

When a new version is released (a new image is published) or scripts change, run:

```bash
git pull --rebase                 # updated compose files and scripts
npm ci                            # updated host tools
npm run stack:up:image:macos      # pulls the newest image, recreates containers
./scripts/start-ios-provider.sh   # restart host iOS provider
```

If you use LaunchAgent for iOS provider, reload it:

```bash
launchctl kickstart -k gui/$(id -u)/com.mercury.ios-provider
```

### Optional: Auto-start iOS Provider with LaunchAgent

```bash
./scripts/deploy-ios-provider-runtime.sh
```

### Logs and Troubleshooting

See dedicated guide:

- [Troubleshooting (EN + TR)](./troubleshooting.md)

---

## Turkce

Bu dokuman, Mercury'yi macOS ortaminda ayaga kaldirmak icin ana calistirma rehberidir.

### Nasil calisir

Mercury iki parcadan olusur:

- **Docker stack** (tum backend servisleri + **Android** provider) —
  `npm run stack:up:image:macos` ile baslar; GHCR'daki hazir imaji kullanir.
- **Host uzerinde iOS provider** — `./scripts/start-ios-provider.sh` ile baslar.
  Docker disinda calismak zorundadir cunku iOS otomasyonu Mac uzerinde
  Xcode / WebDriverAgent gerektirir.

Sadece Android icin Docker stack yeterli; iOS icin host iOS provider'i ekleyin.

### 1) On Kosullar

```bash
brew install --cask docker
brew install node
brew install android-platform-tools
brew install libimobiledevice usbmuxd
xcode-select --install
```

Kurulumdan sonra Docker Desktop ve Xcode'u en az bir kez acin.

### 2) Kodu Al

```bash
git clone https://github.com/erdncyz/mercury-farm.git
cd mercury-farm
npm ci
```

> Arayuz (UI) private bir submodule'dur ve yerelde gerekmez — hazir imaj UI'yi
> zaten icerir. `npm ci` yalnizca iOS provider icin host araclarini kurar.

### 3) Cekirdek Stack'i Baslat (hazir Docker imaji)

```bash
npm run stack:up:image:macos
```

Bu komut domain'i tespit eder, `ghcr.io/erdncyz/mercury-farm:latest` imajini
ceker ve tum container'lari baslatir — yerel build yapmadan.

### 4) iOS Provider'i Baslat (Host)

```bash
./scripts/start-ios-provider.sh
```

### 5) Dogrula

```bash
npm run stack:ps:macos
pgrep -af "mercury.mjs ios-provider|mercury-ios-provider|lib/cli ios-device"
```

### 6) Arayuzu Ac

Mercury, domain'i dinamik belirler (`MERCURY_DOMAIN`).
Sadece localhost degil, tespit edilen host IP/domain ile acin:

- `https://<MERCURY_DOMAIN>`

Ornek:

- `https://192.168.1.103`

Not:

- Mock auth modunda `Name` ve `Email` alanlari varsayilan olarak bos gelir.
- Her kullanici kendi bilgilerini doldurmalidir.
- Mock auth modunda sabit bir admin hesabi yoktur; ilk giris yapan kullanici admin olarak olusur.

### Yeniden Baslatma Komutlari

Tum stack:

```bash
npm run stack:up:image:macos
./scripts/start-ios-provider.sh
```

Sadece Docker servisleri:

```bash
docker restart mercury-provider mercury-websocket mercury-nginx
```

### Yeni commit/push sonrasi guncelleme (cekip tekrar calistirma)

Yeni bir surum yayinlandiginda (yeni imaj cikinca) veya scriptler degisince su adimlari calistirin:

```bash
git pull --rebase                 # guncel compose ve scriptler
npm ci                            # guncel host araclari
npm run stack:up:image:macos      # en yeni imaji ceker, container'lari yeniler
./scripts/start-ios-provider.sh   # host iOS provider'i yeniden baslat
```

Eger iOS provider LaunchAgent ile calisiyorsa su komutla yeniden yukleyin:

```bash
launchctl kickstart -k gui/$(id -u)/com.mercury.ios-provider
```

### Opsiyonel: LaunchAgent ile iOS Provider otomatik baslatma

```bash
./scripts/deploy-ios-provider-runtime.sh
```

### Loglar ve Sorun Giderme

Ayrintili hata/cozum rehberi:

- [Troubleshooting (EN + TR)](./troubleshooting.md)
