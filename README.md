# Mercury Device Farm (macOS)


Mercury is a browser-based real-device lab for Android and iOS.
This project is optimized for **macOS** because iOS automation requires Xcode tooling on host.

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

## Documentation

- [Architecture Document (EN)](docs/architecture.md)
- [Mimari Dokümanı (TR)](docs/mimari.md)

---

## Quick Start (Source Install)

### 1) Prerequisites (macOS)

```bash
brew install --cask docker
brew install node
brew install android-platform-tools
brew install libimobiledevice usbmuxd
xcode-select --install
```

Open Docker Desktop and Xcode at least once after installation.

### 2) Clone and install

```bash
git clone https://github.com/erdncyz/mercury-farm.git
cd mercury-farm
npm ci
```

### 3) Start stack

```bash
npm run stack:up:macos
./scripts/start-ios-provider.sh
```

### 4) Verify

```bash
npm run stack:ps:macos
pgrep -af "mercury.mjs ios-provider|mercury-ios-provider|lib/cli ios-device"
```

### 5) Open UI

Mercury uses dynamic domain detection (`MERCURY_DOMAIN`).
Open with your detected host domain/IP:

- `https://<MERCURY_DOMAIN>`
- Example: `https://192.168.x.xxx`

---

## Admin Login (Mock Auth)

Use the following admin login:

- Name: `Mercury`
- Email: `mercury@test.com`

Notes:

- Mock form fields are empty by default; users fill their own values.
- In mock mode, first successful login is created as admin if no admin exists.

---

## Update After New Commits

When users pull new code, run:

```bash
git pull --rebase
npm ci
npm run stack:up:macos
./scripts/start-ios-provider.sh
```

`npm run stack:up:macos` already runs `docker compose ... up -d --build`, so containers are rebuilt automatically.

If iOS provider is managed by LaunchAgent:

```bash
launchctl kickstart -k gui/$(id -u)/com.mercury.ios-provider
```

---

## Support

- In-app `Contact Support` points to: [GitHub Issues](https://github.com/erdncyz/mercury-farm/issues)

---

## Package (GHCR)

This repo publishes Docker images to GHCR:

- Image: `ghcr.io/erdncyz/mercury-farm:<tag>`
- `main` pushes create automatic patch tags (`vX.Y.Z`) and publish image.

Pull example:

```bash
docker pull ghcr.io/erdncyz/mercury-farm:latest
```

Important:

- For full Mercury usage on macOS (especially iOS), use source install + compose + host iOS provider.
- Pulling GHCR image alone is not a complete one-command setup for iOS host flows.

---

## Documentation

- Smart TV detayli rehber kisayolu: [Smart TV (Tizen) Guide (EN + TR)](docs/smart-tv-tizen.md)
- [Documentation Index (EN + TR)](docs/index.md)
- [Getting Started (EN + TR)](docs/getting-started.md)
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

## Turkce Ozet

### Kurulum

```bash
git clone https://github.com/erdncyz/mercury-farm.git
cd mercury-farm
npm ci
npm run stack:up:macos
./scripts/start-ios-provider.sh
```

### Arayuz

- `https://<MERCURY_DOMAIN>` (ornek: `https://192.168.x.xxx`)

### Admin Girisi (Mock)

- Name: `Mercury`
- Email: `mercury@test.com`

### Guncelleme (pull sonrasi)

```bash
git pull --rebase
npm ci
npm run stack:up:macos
./scripts/start-ios-provider.sh
```

`npm run stack:up:macos` komutu zaten `docker compose ... up -d --build` calistirir; container rebuild otomatik yapilir.

### Sorun/Yardim

- [Issue ac](https://github.com/erdncyz/mercury-farm/issues)
- [Troubleshooting](docs/troubleshooting.md)

---

## License

Copyright 2026 Erdinc Yilmaz

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
