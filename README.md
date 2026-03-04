# Mercury Device Farm (macOS)

Mercury is a browser-based real-device lab for Android and iOS.
This project is optimized for **macOS** because iOS automation requires Xcode tooling on host.

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
pgrep -af "stf.mjs ios-provider|mercury-ios-provider|lib/cli ios-device"
```

### 5) Open UI

Mercury uses dynamic domain detection (`STF_DOMAIN`).
Open with your detected host domain/IP:

- `https://<STF_DOMAIN>`
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

- [Getting Started (EN + TR)](docs/getting-started.md)
- [Troubleshooting (EN + TR)](docs/troubleshooting.md)
- [iOS Setup (EN + TR)](docs/ios-setup.md)
- [Scaling Guide (EN + TR)](docs/scaling.md)
- [Automation API (EN + TR)](docs/automation-api.md)
- [API Reference (EN + TR)](docs/API.md)
- [ESP32 Notes (EN + TR)](docs/esp32.md)

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

- `https://<STF_DOMAIN>` (ornek: `https://192.168.x.xxx`)

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
