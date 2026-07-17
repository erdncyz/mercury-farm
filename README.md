# Mercury Device Farm (macOS)


Mercury is a browser-based real-device lab for Android and iOS.
This project is optimized for **macOS** because iOS automation requires Xcode tooling on host.

**Website:** [mercury-farm-brand.netlify.app](https://mercury-farm-brand.netlify.app/#top)

Logo: 
<img width="2036" height="1086" alt="image" src="https://github.com/user-attachments/assets/4a0ada3e-a56f-40c3-93e1-37306cbb1e41" />

Login Page: 
<img width="2036" height="1086" alt="image" src="https://github.com/user-attachments/assets/e4f7de0b-0cc7-40fa-9da5-a747b899bc11" />

Devices Page:
<img width="2036" height="1086" alt="image" src="https://github.com/user-attachments/assets/c3350673-3c2d-4643-a3be-e99c221b968f" />

Remote Controller For Android Page: 
<img width="2036" height="1086" alt="image" src="https://github.com/user-attachments/assets/0bcef877-8562-4bb2-aecc-c551098591cf" />

Remote Controller For iOS Page: 
<img width="2036" height="1086" alt="image" src="https://github.com/user-attachments/assets/71f660c3-7d50-4d08-b3b1-2b7768aa0c80" />

Settings Page: 
<img width="2036" height="1086" alt="image" src="https://github.com/user-attachments/assets/6ff69427-306e-4b6d-8862-c26a35ba3076" />

---

## Demo Video

[![Mercury Device Farm Demo](https://img.youtube.com/vi/ZHmtFVSZbqM/maxresdefault.jpg)](https://www.youtube.com/watch?v=ZHmtFVSZbqM)

---

## Quick Start (GitHub Release)

Public users do **not** need to clone this repository. A GitHub Release provides
the macOS launcher, Docker Compose files, and the host-side iOS provider. The
matching GHCR image contains all backend services and the compiled web UI.

### 1) Prerequisites (macOS)

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

### 2) Install the latest release

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash
```

For Android-only installations, skip the host iOS dependencies:

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash -s -- --android-only
```

The installer verifies the release archive checksum, installs it under
`~/.mercury-farm`, and pins the Docker image by its immutable release digest.
The UI source is not downloaded because the compiled UI is already in that image.

If iOS support is enabled, installer output can include npm deprecation warnings
from transitive dependencies. These warnings do not block installation.

### 3) Start Mercury

```bash
~/.mercury-farm/mercury up
```

The first run can take several minutes because Docker pulls the Mercury image
and base images. Progress lines like `[+] pull x/y` are expected.

For iOS, install the host provider as a LaunchAgent so it starts automatically:

```bash
~/.mercury-farm/mercury ios-auto
```

### 4) Verify

```bash
~/.mercury-farm/mercury status
```

### 5) Open UI

Mercury uses dynamic domain detection (`MERCURY_DOMAIN`).
Open with your detected host domain/IP:

- `https://<MERCURY_DOMAIN>`
- Example: `https://192.168.x.xxx`

---

## Build From Source (Maintainers Only)

Building the image from source requires access to the private `mercury-ui`
submodule. Authorized maintainers:

```bash
git clone --recurse-submodules https://github.com/erdncyz/mercury-farm.git
cd mercury-farm
npm ci
npm --prefix ./ui ci          # UI deps (private submodule)
npm run stack:up:macos        # builds the image locally (compiles the UI)
./scripts/start-ios-provider.sh
```

Commit UI changes and bump the submodule pointer in one step:

```bash
npm run ui:commit -- "your message"
```

### Publish a stable release

`package.json` is the release version source, but maintainers do not bump it
manually anymore. Push to `main` with Conventional Commit messages and Mercury
bumps the version automatically:

```bash
git push origin main
```

Version rules:

- `feat:` -> minor bump
- `type(scope)!:` or `BREAKING CHANGE` -> major bump
- all other commits -> patch bump

On push, the version workflow creates a `chore(release): vX.Y.Z` commit with
updated package files, then dispatches the release workflow for `main`. The
release workflow creates the Git tag, multi-architecture GHCR image, macOS
bundle, checksum, and GitHub Release together. Do not create release tags by hand.

---

## Admin Login (Mock Auth)

Use the following admin login:

- Name: `Mercury`
- Email: `mercury@test.com`

Notes:

- Mock form fields are empty by default; users fill their own values.
- In mock mode, first successful login is created as admin if no admin exists.

---

## Update and Roll Back

Update the host tools, Docker services, and UI together:

```bash
~/.mercury-farm/mercury update
```

The command downloads the latest GitHub Release, verifies its checksum, pins the
digest of the matching `ghcr.io/erdncyz/mercury-farm:vX.Y.Z` image, and refreshes the stack. It
also refreshes the iOS LaunchAgent when one is installed. Configuration and the
MongoDB Docker volume are preserved.

Mercury verifies every long-running service and the UI before completing an
update. If validation fails, it restores the previous host release, image
digest, Docker stack, and iOS provider. An interrupted update is recovered on
the next `mercury` command.

To install or roll back to an exact version:

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash -s -- --version v0.0.47
~/.mercury-farm/mercury up
~/.mercury-farm/mercury ios-auto  # when iOS support is enabled
```

For an Android-only install, add `--android-only` to the installer command and
omit `ios-auto`.

---

## Support

- In-app `Contact Support` points to: [GitHub Issues](https://github.com/erdncyz/mercury-farm/issues)

---

## Releases, Tags, and Packages

Each stable version has three matching parts:

- **GitHub Release**: the user-facing download with `install.sh`, the macOS host
    bundle, checksum, and release notes.
- **Git tag**: the immutable source marker for maintainers. Users do not need to
    clone or download a tag.
- **GHCR package**: `ghcr.io/erdncyz/mercury-farm:vX.Y.Z`, containing the backend
    and compiled UI. The installer pulls it automatically.

The release, tag, and package always use the same `vX.Y.Z`. `stable` and `latest`
point to the newest stable image, while normal installations pin the immutable
image digest to prevent host/UI version drift or tag mutation.

Manual image pull, normally not needed:

```bash
docker pull ghcr.io/erdncyz/mercury-farm:stable
```

---

## Documentation

- Smart TV detayli rehber kisayolu: [Smart TV (Tizen) Guide (EN + TR)](docs/smart-tv-tizen.md)
- [Documentation Index (EN + TR)](docs/index.md)
- [Getting Started (EN + TR)](docs/getting-started.md)
- [Architecture (EN)](docs/architecture.md)
- [Mimari (TR)](docs/mimari.md)
- [iOS Setup (EN + TR)](docs/ios-setup.md)
- [Parallel Execution (EN + TR)](docs/parallel-execution.md)
- [Appium Setup (EN + TR)](docs/appium-setup.md)
- [Appium Integration (EN + TR)](docs/appium-integration.md)
- [Automation API (EN + TR)](docs/automation-api.md)
- [API Reference (EN + TR)](docs/API.md)
- [ESP32 Notes (EN + TR)](docs/esp32.md)
- [Docker Services & Logs (EN + TR)](docs/docker-logs.md)
- [Troubleshooting (EN + TR)](docs/troubleshooting.md)

---

## Turkce Kurulum (Adim Adim)

Public kullanici repoyu clone etmez. GitHub Release, macOS host dosyalarini;
ayni surumdeki GHCR Package ise backend ile derlenmis UI'yi getirir.

### 1) Homebrew'u kontrol et

```bash
brew --version
```

Homebrew kurulu degilse once [brew.sh](https://brew.sh/) uzerinden kurun.

### 2) Android ve Docker gereksinimlerini kur

```bash
brew install --cask docker
brew install --cask android-platform-tools
```

Docker Desktop'i bir kez acin ve tamamen baslamasini bekleyin:

```bash
open -a Docker
```

### 3) iOS kullanacaksan ek gereksinimleri kur

Bu adim yalnizca iPhone, iPad veya Apple TV yonetecekseniz gereklidir:

```bash
brew install node
brew install libimobiledevice usbmuxd
xcode-select --install
```

Xcode'u en az bir kez acin ve lisans/ilk kurulum adimlarini tamamlayin.

### 4) Mercury'yi kur

Android ve iOS destekli tam kurulum:

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash
```

Yalnizca Android kullanacaksaniz Node ve Xcode gerekmez:

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash -s -- --android-only
```

Kurucu arsiv checksum degerini dogrular ve Mercury'yi
`~/.mercury-farm` dizinine kurar.

### 5) Mercury servislerini baslat

```bash
~/.mercury-farm/mercury up
```

Bu komut Release'e ait degismez Docker image digest'ini ceker, servisleri
baslatir ve saglik kontrollerini yapar.

### 6) iOS provider'i otomatik baslat

iOS kullanacaksaniz:

```bash
~/.mercury-farm/mercury ios-auto
```

Bu komut iOS provider'i macOS LaunchAgent olarak kurar. Mac yeniden basladiginda
iOS provider otomatik olarak yeniden baslar.

### 7) Kurulumu dogrula

```bash
~/.mercury-farm/mercury status
```

### 8) Arayuzu ac

Terminalde yazan adresi tarayicida acin:

- `https://<MERCURY_DOMAIN>`
- Ornek: `https://192.168.1.100`

Sertifika yerel olarak olusturuldugu icin tarayici ilk acilista guvenlik
uyarisi gosterebilir.

### 9) Admin girisi yap

- Name: `Mercury`
- Email: `mercury@test.com`

Mock auth modunda ilk basarili giris yapan kullanici admin olarak olusturulur.

### 10) Yeni surume guncelle

```bash
~/.mercury-farm/mercury update
```

Guncelleme; host dosyalarini, backend'i ve UI'yi birlikte yeniler. Ayarlar ve
MongoDB verileri korunur. Saglik kontrolu basarisiz olursa onceki surum otomatik
geri yuklenir.

### 11) Belirli bir surume geri don

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash -s -- --version v0.0.47
~/.mercury-farm/mercury up
~/.mercury-farm/mercury ios-auto  # iOS kullaniyorsaniz
```

### 12) Loglari goruntule

```bash
~/.mercury-farm/mercury logs
```

### Sorun/Yardim

- [Issue ac](https://github.com/erdncyz/mercury-farm/issues)
- [Troubleshooting](docs/troubleshooting.md)

---

## License

Copyright 2026 Erdinc Yilmaz

The backend and CLI in this repository are licensed under the Apache License,
Version 2.0 (below). The web UI (`ui/`) is **proprietary** and is maintained in
a separate **private** repository, referenced here as a git submodule. Its
source is **not** publicly available and access requires authorization. Public
users should run Mercury via the prebuilt Docker image. All rights to the UI are
reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

BSD 3-Clause: https://opensource.org/license/bsd-3-clause
