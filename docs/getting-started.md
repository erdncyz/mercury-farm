# Getting Started (EN + TR)

This is the canonical runbook to bring Mercury up on macOS.

---

## English

### How it works

Mercury runs in two parts:

- **Docker stack** (all backend services + the **Android** provider) — started
  with `~/.mercury-farm/mercury up`, using the prebuilt image from GHCR.
- **iOS provider on the host** — installed with
  `~/.mercury-farm/mercury ios-auto`.
  It must run outside Docker because iOS automation needs Xcode / WebDriverAgent
  on the Mac.

The GitHub Release supplies host files. Its matching `vX.Y.Z` GHCR image supplies
the backend and compiled UI. The installer keeps both parts on the same version.

### 1) Prerequisites

```bash
brew install --cask docker
brew install --cask android-platform-tools
```

For iOS support, also install:

```bash
brew install node
brew install libimobiledevice usbmuxd
xcode-select --install
```

Open Docker Desktop and Xcode at least once after installation.

### 2) Install Mercury

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash
```

For Android only:

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash -s -- --android-only
```

The installer verifies the release archive checksum and installs versioned host
files under `~/.mercury-farm`. No repository clone or UI source is needed.

### 3) Start Core Stack (prebuilt Docker image)

```bash
~/.mercury-farm/mercury up
```

This detects your domain, pulls the exact image selected by the release, and
starts all containers without a local build.

### 4) Start iOS Provider (Host)

```bash
~/.mercury-farm/mercury ios-auto
```

Use `~/.mercury-farm/mercury ios` instead to run it in the foreground.

### 5) Verify

```bash
~/.mercury-farm/mercury status
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
~/.mercury-farm/mercury up
```

Docker services only:

```bash
docker restart mercury-provider mercury-websocket mercury-nginx
```

### Update

When a new stable version is released, run:

```bash
~/.mercury-farm/mercury update
```

This updates the release files, backend, and compiled UI together. It preserves
configuration and Docker volumes. An installed iOS LaunchAgent is refreshed too.
Mercury completes the update only after all long-running services and the UI
are healthy. A failed update is rolled back; an interrupted update is recovered
on the next `mercury` command.

### Install or Roll Back to an Exact Version

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash -s -- --version v0.0.47
~/.mercury-farm/mercury up
~/.mercury-farm/mercury ios-auto  # when iOS support is enabled
```

For an Android-only rollback, add `--android-only` to the installer command and
omit `ios-auto`.

### Release Channels

- GitHub Releases are the user-facing downloads.
- Git tags identify immutable source revisions.
- GHCR packages contain the backend and compiled UI.
- `stable` and `latest` point to the newest stable image, but the installer pins
  that release's immutable image digest for reproducible updates.

### Logs and Troubleshooting

See dedicated guide:

- [Troubleshooting (EN + TR)](./troubleshooting.md)

---

## Turkce

Bu dokuman, Mercury'yi macOS ortaminda ayaga kaldirmak icin ana calistirma rehberidir.

### Nasil calisir

Mercury iki parcadan olusur:

- **Docker stack** (tum backend servisleri + **Android** provider) —
  `~/.mercury-farm/mercury up` ile baslar; GHCR'daki hazir imaji kullanir.
- **Host uzerinde iOS provider** —
  `~/.mercury-farm/mercury ios-auto` ile kurulur.
  Docker disinda calismak zorundadir cunku iOS otomasyonu Mac uzerinde
  Xcode / WebDriverAgent gerektirir.

GitHub Release host dosyalarini, ayni `vX.Y.Z` etiketli GHCR image ise backend
ile derlenmis UI'yi saglar. Kurucu iki parcayi ayni surumde tutar.

### 1) On Kosullar

```bash
brew install --cask docker
brew install --cask android-platform-tools
```

iOS destegi icin ek olarak:

```bash
brew install node
brew install libimobiledevice usbmuxd
xcode-select --install
```

Kurulumdan sonra Docker Desktop ve Xcode'u en az bir kez acin.

### 2) Mercury'yi Kur

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash
```

Yalnizca Android icin:

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash -s -- --android-only
```

Kurucu release arsivinin checksum degerini dogrular ve surumlu host dosyalarini
`~/.mercury-farm` altina kurar. Repo clone etmek veya UI kaynagini indirmek gerekmez.

### 3) Cekirdek Stack'i Baslat (hazir Docker imaji)

```bash
~/.mercury-farm/mercury up
```

Bu komut domain'i tespit eder, release'in sabitledigi image digest'ini ceker ve
yerel build yapmadan tum container'lari baslatir.

### 4) iOS Provider'i Baslat (Host)

```bash
~/.mercury-farm/mercury ios-auto
```

On planda calistirmak icin `~/.mercury-farm/mercury ios` kullanin.

### 5) Dogrula

```bash
~/.mercury-farm/mercury status
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
~/.mercury-farm/mercury up
```

Sadece Docker servisleri:

```bash
docker restart mercury-provider mercury-websocket mercury-nginx
```

### Guncelleme

Yeni stabil surum yayinlandiginda:

```bash
~/.mercury-farm/mercury update
```

Bu komut release dosyalarini, backend'i ve derlenmis UI'yi birlikte gunceller.
Ayarlar ile Docker volume'lari korunur. Kurulu iOS LaunchAgent da yenilenir.
Mercury ancak tum kalici servisler ve UI saglikliysa guncellemeyi tamamlar.
Basarisiz guncelleme geri alinir; yarida kesilen guncelleme sonraki `mercury`
komutunda kurtarilir.

### Tam Bir Surumu Kurma veya Geri Donme

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash -s -- --version v0.0.47
~/.mercury-farm/mercury up
~/.mercury-farm/mercury ios-auto  # iOS destegi aciksa
```

Yalnizca Android geri donusu icin installer komutuna `--android-only` ekleyin ve
`ios-auto` adimini calistirmayin.

### Yayin Kanallari

- GitHub Release kullanicinin indirdigi kurulum paketidir.
- Git tag degismez kaynak surumunu isaretler.
- GHCR package backend ile derlenmis UI'yi icerir.
- `stable` ve `latest` en yeni stabil image'i gosterir; kurucu ise tekrarlanabilir
  guncelleme icin o surumun degismez image digest'ini sabitler.

### Loglar ve Sorun Giderme

Ayrintili hata/cozum rehberi:

- [Troubleshooting (EN + TR)](./troubleshooting.md)
