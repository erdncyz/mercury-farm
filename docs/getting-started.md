# Getting Started (EN + TR)

This is the canonical runbook to bring Mercury up on macOS.

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

Open Docker Desktop and Xcode at least once after installation.

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
npm run stack:up:macos
./scripts/start-ios-provider.sh
```

Docker services only:

```bash
docker restart mercury-provider mercury-websocket mercury-nginx
```

### Update After New Commits (pull and re-run)

When new code is pushed to your branch/repo, run:

```bash
git pull --rebase
npm ci
npm run stack:up:macos
./scripts/start-ios-provider.sh
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

### 1) On Kosullar

```bash
brew install --cask docker
brew install node
brew install android-platform-tools
brew install libimobiledevice usbmuxd
xcode-select --install
```

Kurulumdan sonra Docker Desktop ve Xcode'u en az bir kez acin.

### 2) Bagimliliklari Kur

```bash
npm ci
```

### 3) Cekirdek Stack'i Baslat (Docker)

```bash
npm run stack:up:macos
```

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
npm run stack:up:macos
./scripts/start-ios-provider.sh
```

Sadece Docker servisleri:

```bash
docker restart mercury-provider mercury-websocket mercury-nginx
```

### Yeni commit/push sonrasi guncelleme (cekip tekrar calistirma)

Repo'ya yeni kod geldiginde su adimlari calistirin:

```bash
git pull --rebase
npm ci
npm run stack:up:macos
./scripts/start-ios-provider.sh
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
