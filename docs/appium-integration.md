# Appium Integration (EN + TR)

This guide explains how to run Appium with Mercury and how to open Appium Inspector after a device is put in `use` mode.

---

## English

## Core idea

Mercury is the device broker/control plane.
Appium still runs on your own machine/runner.

Flow:

1. Reserve device from Mercury
2. Put device in use / enable remote connect
3. Get `remoteConnectUrl`
4. Connect Appium (and Inspector) using that URL
5. Release device group when tests end

---

## 1) Get token

Create token from UI:

- `Settings -> Keys`

Use it as:

```bash
export MERCURY_BASE_URL="https://YOUR_DOMAIN"
export MERCURY_TOKEN="YOUR_TOKEN"
```

---

## 2) Reserve device for automation

```bash
curl -sS -H "Authorization: Bearer $MERCURY_TOKEN" \
  "$MERCURY_BASE_URL/api/v1/autotests?amount=1&timeout=600&run=inspector-run&type=android&need_amount=true"
```

Save:

- `group.id`
- `group.devices[0].serial`

---

## 3) Put device in use and get remoteConnectUrl

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $MERCURY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serial":"DEVICE_SERIAL"}' \
  "$MERCURY_BASE_URL/api/v1/autotests/useDevice"
```

Response includes:

- `remoteConnectUrl`

---

## 4A) Android + Appium Inspector

First connect ADB through Mercury bridge:

```bash
adb connect <remoteConnectUrl>
adb devices
```

Start Appium server locally:

```bash
appium
```

In Appium Inspector:

- Remote Host: `127.0.0.1`
- Port: `4723`
- Path: `/` (if needed, try `/wd/hub`)

Capabilities example:

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:udid": "<ADB_SERIAL_FROM_adb_devices>",
  "appium:newCommandTimeout": 120
}
```

Notes:

- `udid` should match exact serial visible in `adb devices`.
- If your app is not preinstalled, add `appium:app` or `appium:appPackage`/`appium:appActivity`.

---

## 4B) iOS + Appium Inspector

For iOS, Mercury provides a WDA proxy URL via `remoteConnectUrl`.

Start Appium server locally:

```bash
appium
```

In Appium Inspector:

- Remote Host: `127.0.0.1`
- Port: `4723`
- Path: `/` (if needed, try `/wd/hub`)

Capabilities example:

```json
{
  "platformName": "iOS",
  "appium:automationName": "XCUITest",
  "appium:webDriverAgentUrl": "http://<remoteConnectUrl>",
  "appium:newCommandTimeout": 120
}
```

Optional:

- `appium:bundleId`
- `appium:app`

---

## 5) Release devices after session/tests

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $MERCURY_TOKEN" \
  "$MERCURY_BASE_URL/api/v1/autotests?group=GROUP_ID"
```

Always do this in CI `finally/cleanup` step.

---

## Troubleshooting

1. `Device is not responding`

- Ensure provider services are healthy:
  - `mercury-provider`
  - `mercury-websocket`
  - host iOS provider (for iOS)

2. Inspector cannot create session (Android)

- Re-check `adb connect <remoteConnectUrl>`
- Confirm device appears in `adb devices`
- Ensure correct `udid` is used

3. Inspector cannot create session (iOS)

- Verify iOS provider is running on host
- Confirm `remoteConnectUrl` is reachable from runner machine
- Check WDA health on device side

4. Session starts then drops quickly

- Increase `appium:newCommandTimeout`
- Check Mercury logs (`mercury-websocket`, `mercury-provider`, iOS provider logs)

---

## Türkçe

## Temel mantık

Mercury cihaz yönetim katmanıdır.
Appium yine senin kendi makinen/runner üzerinde çalışır.

Akış:

1. Mercury’den cihaz ayır
2. Cihazı `use` moduna al
3. `remoteConnectUrl` al
4. Appium + Inspector ile bu URL’yi kullan
5. Test bitince cihazları bırak

---

## 1) Token al

UI’dan token üret:

- `Settings -> Keys`

Kullanım:

```bash
export MERCURY_BASE_URL="https://YOUR_DOMAIN"
export MERCURY_TOKEN="YOUR_TOKEN"
```

---

## 2) Otomasyon için cihaz ayır

```bash
curl -sS -H "Authorization: Bearer $MERCURY_TOKEN" \
  "$MERCURY_BASE_URL/api/v1/autotests?amount=1&timeout=600&run=inspector-run&type=android&need_amount=true"
```

Şunları sakla:

- `group.id`
- `group.devices[0].serial`

---

## 3) Cihazı use et ve remoteConnectUrl al

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $MERCURY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serial":"DEVICE_SERIAL"}' \
  "$MERCURY_BASE_URL/api/v1/autotests/useDevice"
```

Yanıtta:

- `remoteConnectUrl`

---

## 4A) Android + Appium Inspector

Önce Mercury köprüsünden ADB bağla:

```bash
adb connect <remoteConnectUrl>
adb devices
```

Lokal Appium server aç:

```bash
appium
```

Appium Inspector ayarları:

- Remote Host: `127.0.0.1`
- Port: `4723`
- Path: `/` (olmazsa `/wd/hub`)

Capability örneği:

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:udid": "<adb devices CIKTISINDAKI SERIAL>",
  "appium:newCommandTimeout": 120
}
```

Not:

- `udid`, `adb devices` çıktısıyla birebir aynı olmalı.
- Uygulama yoksa `appium:app` veya `appium:appPackage`/`appium:appActivity` ekle.

---

## 4B) iOS + Appium Inspector

iOS tarafında `remoteConnectUrl`, WDA proxy adresidir.

Lokal Appium server aç:

```bash
appium
```

Appium Inspector ayarları:

- Remote Host: `127.0.0.1`
- Port: `4723`
- Path: `/` (olmazsa `/wd/hub`)

Capability örneği:

```json
{
  "platformName": "iOS",
  "appium:automationName": "XCUITest",
  "appium:webDriverAgentUrl": "http://<remoteConnectUrl>",
  "appium:newCommandTimeout": 120
}
```

Opsiyonel:

- `appium:bundleId`
- `appium:app`

---

## 5) Test sonunda cihazları bırak

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $MERCURY_TOKEN" \
  "$MERCURY_BASE_URL/api/v1/autotests?group=GROUP_ID"
```

CI tarafında bu adımı mutlaka `cleanup/finally` içine koy.

---

## Sorun giderme

1. `Device is not responding`

- Şu servisleri kontrol et:
  - `mercury-provider`
  - `mercury-websocket`
  - iOS için host iOS provider

2. Inspector session açamıyor (Android)

- `adb connect <remoteConnectUrl>` tekrar dene
- `adb devices` içinde cihaz görünüyor mu kontrol et
- `udid` değerini doğrula

3. Inspector session açamıyor (iOS)

- Host iOS provider çalışıyor mu kontrol et
- `remoteConnectUrl` erişilebilir mi test et
- WDA durumunu kontrol et

4. Session açılıyor ama hemen düşüyor

- `appium:newCommandTimeout` artır
- Mercury ve iOS provider loglarını kontrol et
