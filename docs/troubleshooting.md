# Troubleshooting (EN + TR)

Common startup/runtime problems and quick fixes for Mercury on macOS.

---

## English

### 1) Docker daemon is not running

Symptom:

- `Cannot connect to the Docker daemon...`

Fix:

```bash
open -a Docker
npm run stack:up:macos
```

### 2) Stack is up but UI is unreachable on `https://localhost`

Why:

- Mercury commonly runs with detected `MERCURY_DOMAIN` (host IP/domain), not strict localhost routing.

Fix:

```bash
npm run -s mercury:domain:auto
```

Open:

- `https://<MERCURY_DOMAIN>`

Example:

- `https://192.168.1.103`

### 3) iOS provider not running

Check:

```bash
pgrep -af "mercury.mjs ios-provider|mercury-ios-provider|lib/cli ios-device"
```

Start:

```bash
./scripts/start-ios-provider.sh
```

### 4) iOS still enters automation mode after Docker stop

Cause:

- Host LaunchAgent still starts provider automatically.

Fix:

```bash
launchctl bootout gui/$(id -u)/com.mercury.ios-provider || true
launchctl disable gui/$(id -u)/com.mercury.ios-provider || true
rm -f "$HOME/Library/LaunchAgents/com.mercury.ios-provider.plist"
pkill -f "mercury.mjs ios-provider" || true
pkill -f WebDriverAgentRunner || true
```

Verify:

```bash
launchctl print gui/$(id -u)/com.mercury.ios-provider
```

Expected:

- `Could not find service "com.mercury.ios-provider"`

### 5) Useful logs

```bash
npm run stack:ps:macos
docker logs -f mercury-nginx
docker logs -f mercury-api
docker logs -f mercury-provider
docker logs -f mercury-websocket
tail -f /tmp/mercury-ios-provider.log
```

---

## Turkce

### 1) Docker daemon calismiyor

Belirti:

- `Cannot connect to the Docker daemon...`

Cozum:

```bash
open -a Docker
npm run stack:up:macos
```

### 2) Stack calisiyor ama `https://localhost` acilmiyor

Neden:

- Mercury cogunlukla `MERCURY_DOMAIN` (host IP/domain) ile calisir.

Cozum:

```bash
npm run -s mercury:domain:auto
```

Sunu acin:

- `https://<MERCURY_DOMAIN>`

Ornek:

- `https://192.168.1.103`

### 3) iOS provider calismiyor

Kontrol:

```bash
pgrep -af "mercury.mjs ios-provider|mercury-ios-provider|lib/cli ios-device"
```

Baslat:

```bash
./scripts/start-ios-provider.sh
```

### 4) Docker kapaliyken iOS yine automation moduna geciyor

Neden:

- Host LaunchAgent provider'i otomatik baslatmaya devam ediyor.

Cozum:

```bash
launchctl bootout gui/$(id -u)/com.mercury.ios-provider || true
launchctl disable gui/$(id -u)/com.mercury.ios-provider || true
rm -f "$HOME/Library/LaunchAgents/com.mercury.ios-provider.plist"
pkill -f "mercury.mjs ios-provider" || true
pkill -f WebDriverAgentRunner || true
```

Dogrulama:

```bash
launchctl print gui/$(id -u)/com.mercury.ios-provider
```

Beklenen:

- `Could not find service "com.mercury.ios-provider"`

### 5) Faydali loglar

```bash
npm run stack:ps:macos
docker logs -f mercury-nginx
docker logs -f mercury-api
docker logs -f mercury-provider
docker logs -f mercury-websocket
tail -f /tmp/mercury-ios-provider.log
```
