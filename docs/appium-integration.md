# Appium Integration (EN + TR)

This guide explains how to run Appium with Mercury and how to open Appium Inspector after a device is put in `use` mode.

> **Important / Önemli:** Appium Inspector always connects to the Appium server running on your machine at `http://127.0.0.1:4723`. Mercury's `remoteConnectUrl` is an ADB endpoint on Android and a WebDriverAgent (WDA) proxy endpoint on iOS; it is not the Inspector server address.

Quick navigation / Hızlı erişim:

- [English: Android + Appium Inspector](#4a-android--appium-inspector)
- [English: iOS + Appium Inspector](#4b-ios--appium-inspector)
- [Türkçe: Android + Appium Inspector](#4a-android--appium-inspector-1)
- [Türkçe: iOS + Appium Inspector](#4b-ios--appium-inspector-1)

---

## English

## Core idea

Mercury is the device broker and control plane. Appium and Appium Inspector run on your developer machine or CI runner.

| Connection | Android | iOS |
| --- | --- | --- |
| Inspector connects to | Local Appium at `127.0.0.1:4723` | Local Appium at `127.0.0.1:4723` |
| Mercury returns | ADB endpoint, normally `HOST:PORT` | WDA proxy endpoint, normally `HOST:PORT` |
| `remoteConnectUrl` is used by | `adb connect` and `appium:udid` | `appium:webDriverAgentUrl` |

Flow:

1. Reserve device from Mercury
2. Put device in use / enable remote connect
3. Get `remoteConnectUrl`
4. Prepare the ADB connection (Android) or WDA URL (iOS)
5. Start Appium locally and create the session from Inspector
6. Delete the Inspector session and release the Mercury group

Prerequisites:

- `curl` and `jq`
- Appium Inspector from the [official releases](https://github.com/appium/appium-inspector/releases)
- Appium with `uiautomator2` for Android or `xcuitest` for iOS
- ADB, Java, and Android platform tools for Android
- macOS, Xcode, and a healthy Mercury iOS provider for iOS

See [Appium Setup](./appium-setup.md) for installation instructions.

---

## 1) Get token

Create token from UI:

- `Settings -> Keys`

Use it as:

```bash
export MERCURY_BASE_URL="https://YOUR_DOMAIN"
export MERCURY_TOKEN="YOUR_TOKEN"
export PLATFORM="android" # android or ios
export RUN_ID="inspector-$(date +%s)"
```

---

## 2) Reserve device for automation

```bash
CAPTURE_RESPONSE="$(curl -sS \
  -H "Authorization: Bearer $MERCURY_TOKEN" \
  "$MERCURY_BASE_URL/api/v1/autotests?amount=1&timeout=1800&run=$RUN_ID&type=$PLATFORM&need_amount=true")"

printf '%s\n' "$CAPTURE_RESPONSE" | jq .

GROUP_ID="$(printf '%s' "$CAPTURE_RESPONSE" | jq -r '.group.id')"
DEVICE_SERIAL="$(printf '%s' "$CAPTURE_RESPONSE" | jq -r '.group.devices[0].serial')"

printf 'group=%s\nserial=%s\n' "$GROUP_ID" "$DEVICE_SERIAL"
```

Save `GROUP_ID`; it is required for cleanup. `timeout=1800` reserves the device for 30 minutes. Adjust it to the expected session duration.

---

## 3) Put device in use and get remoteConnectUrl

```bash
USE_RESPONSE="$(curl -sS -X POST \
  -H "Authorization: Bearer $MERCURY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"serial\":\"$DEVICE_SERIAL\"}" \
  "$MERCURY_BASE_URL/api/v1/autotests/useDevice")"

printf '%s\n' "$USE_RESPONSE" | jq .

REMOTE_CONNECT_URL="$(printf '%s' "$USE_RESPONSE" | jq -r '.remoteConnectUrl')"
printf 'remoteConnectUrl=%s\n' "$REMOTE_CONNECT_URL"
```

The Appium machine must be able to reach this address. Do not paste it into Inspector's **Remote Host** field.

---

## 4A) Android + Appium Inspector

For Android, `remoteConnectUrl` is the Mercury ADB endpoint. It is normally returned as `HOST:ADB_PORT` without `http://`.

Connect ADB through Mercury:

```bash
adb connect "$REMOTE_CONNECT_URL"
adb devices -l
adb -s "$REMOTE_CONNECT_URL" get-state
```

The exact first-column value shown by `adb devices -l` is the Appium `udid`. The state must be `device`, not `offline` or `unauthorized`.

Start Appium in a separate terminal and leave it running:

```bash
appium --address 127.0.0.1 --port 4723
```

Open **New Session** in Appium Inspector and configure the local Appium server:

| Inspector field | Value |
| --- | --- |
| Remote Host | `127.0.0.1` |
| Remote Port | `4723` |
| Remote Path | `/` |
| SSL | Disabled |

Appium 2 and 3 use `/` by default. Use `/wd/hub` only when Appium was explicitly started with `--base-path /wd/hub`.

Paste this into Inspector's JSON capability editor:

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:udid": "devicefarm.example:12010",
  "appium:newCommandTimeout": 300,
  "appium:noReset": true
}
```

Replace `devicefarm.example:12010` with the exact serial from `adb devices -l`. To launch an installed app immediately, add its package and activity:

```json
{
  "appium:appPackage": "com.example.app",
  "appium:appActivity": ".MainActivity"
}
```

Click **Start Session**. Inspector should show the Android screenshot and page source.

---

## 4B) iOS + Appium Inspector

For iOS, `remoteConnectUrl` is Mercury's WebDriverAgent proxy endpoint. Add `http://` only when the API response does not already include a scheme:

```bash
case "$REMOTE_CONNECT_URL" in
  http://*|https://*) WDA_URL="$REMOTE_CONNECT_URL" ;;
  *) WDA_URL="http://$REMOTE_CONNECT_URL" ;;
esac

printf 'WDA URL=%s\n' "$WDA_URL"
curl -sS "${WDA_URL%/}/status" | jq .
```

The status request must return a WDA response. A timeout means routing, firewall, WDA, or the Mercury iOS provider must be fixed first.

Start Appium in a separate terminal and leave it running:

```bash
appium --address 127.0.0.1 --port 4723
```

Open **New Session** in Appium Inspector and configure the local Appium server:

| Inspector field | Value |
| --- | --- |
| Remote Host | `127.0.0.1` |
| Remote Port | `4723` |
| Remote Path | `/` |
| SSL | Disabled |

Paste this into Inspector's JSON capability editor:

```json
{
  "platformName": "iOS",
  "appium:automationName": "XCUITest",
  "appium:webDriverAgentUrl": "http://devicefarm.example:18200",
  "appium:useNewWDA": false,
  "appium:newCommandTimeout": 300,
  "appium:noReset": true
}
```

Replace `http://devicefarm.example:18200` with `WDA_URL`. To launch an installed app, add its bundle identifier:

```json
{
  "appium:bundleId": "com.example.app"
}
```

Mercury's iOS provider owns the WDA lifecycle. `appium:webDriverAgentUrl` tells XCUITest to use that existing WDA endpoint. Click **Start Session**; Inspector should show the iOS screenshot and page source.

---

## 5) Release devices after session/tests

First click **Delete Session** in Appium Inspector. For Android, you may then close the ADB bridge:

```bash
adb disconnect "$REMOTE_CONNECT_URL"
```

Finally release the Mercury group:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $MERCURY_TOKEN" \
  "$MERCURY_BASE_URL/api/v1/autotests?group=$GROUP_ID"
```

Always put group release in the CI `finally`/cleanup step. Closing Inspector or deleting only the Appium session does not release the Mercury reservation.

---

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Inspector cannot connect to `127.0.0.1:4723` | Confirm the local Appium process is running and Inspector SSL is disabled. |
| Inspector returns `404` or unknown route | Use Remote Path `/`; use `/wd/hub` only with a matching Appium `--base-path`. |
| `Could not find a driver for automationName` | Run `appium driver list --installed` and install `uiautomator2` or `xcuitest`. |
| Android is missing or `offline` | Repeat `adb connect`, inspect `adb devices -l`, and use its exact first-column value as `appium:udid`. |
| iOS WDA status is unreachable | Check the host iOS provider, WDA logs, firewall, and reachability from the Appium machine. |
| XCUITest attempts to build another WDA | Verify `appium:webDriverAgentUrl` and `appium:useNewWDA: false`. |
| Session drops quickly | Increase `appium:newCommandTimeout`, confirm the Mercury group has not expired, and inspect Appium/provider logs. |
| Mercury reports `Device is not responding` | Check `mercury-provider`, `mercury-websocket`, and the host iOS provider when applicable. |

---

## Türkçe

## Temel mantık

Mercury cihaz rezervasyonunu ve erişim köprüsünü yönetir. Appium ile Appium Inspector geliştirici bilgisayarında veya CI runner üzerinde çalışır.

| Bağlantı | Android | iOS |
| --- | --- | --- |
| Inspector nereye bağlanır? | Lokal Appium: `127.0.0.1:4723` | Lokal Appium: `127.0.0.1:4723` |
| Mercury ne döndürür? | Genellikle `HOST:PORT` biçiminde ADB adresi | Genellikle `HOST:PORT` biçiminde WDA proxy adresi |
| `remoteConnectUrl` nerede kullanılır? | `adb connect` ve `appium:udid` | `appium:webDriverAgentUrl` |

Akış:

1. Mercury’den cihaz ayır
2. Cihazı `use` moduna al
3. `remoteConnectUrl` al
4. Android için ADB bağlantısını veya iOS için WDA URL’sini hazırla
5. Lokal Appium’u başlat ve Inspector’dan session oluştur
6. Inspector session’ını sil ve Mercury grubunu serbest bırak

Ön koşullar:

- `curl` ve `jq`
- [Resmî sürümler](https://github.com/appium/appium-inspector/releases) sayfasından Appium Inspector
- Android için `uiautomator2`, iOS için `xcuitest` driver’ı kurulmuş Appium
- Android için ADB, Java ve Android platform tools
- iOS için macOS, Xcode ve çalışan Mercury iOS provider

Kurulum adımları için [Appium Setup](./appium-setup.md) dokümanına bak.

---

## 1) Token al

UI’dan token üret:

- `Settings -> Keys`

Kullanım:

```bash
export MERCURY_BASE_URL="https://YOUR_DOMAIN"
export MERCURY_TOKEN="YOUR_TOKEN"
export PLATFORM="android" # android veya ios
export RUN_ID="inspector-$(date +%s)"
```

---

## 2) Otomasyon için cihaz ayır

```bash
CAPTURE_RESPONSE="$(curl -sS \
  -H "Authorization: Bearer $MERCURY_TOKEN" \
  "$MERCURY_BASE_URL/api/v1/autotests?amount=1&timeout=1800&run=$RUN_ID&type=$PLATFORM&need_amount=true")"

printf '%s\n' "$CAPTURE_RESPONSE" | jq .

GROUP_ID="$(printf '%s' "$CAPTURE_RESPONSE" | jq -r '.group.id')"
DEVICE_SERIAL="$(printf '%s' "$CAPTURE_RESPONSE" | jq -r '.group.devices[0].serial')"

printf 'group=%s\nserial=%s\n' "$GROUP_ID" "$DEVICE_SERIAL"
```

`GROUP_ID` değerini sakla; cihazı serbest bırakırken gerekecek. `timeout=1800`, cihazı 30 dakika ayırır. Bu değeri beklenen session süresine göre değiştir.

---

## 3) Cihazı use et ve remoteConnectUrl al

```bash
USE_RESPONSE="$(curl -sS -X POST \
  -H "Authorization: Bearer $MERCURY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"serial\":\"$DEVICE_SERIAL\"}" \
  "$MERCURY_BASE_URL/api/v1/autotests/useDevice")"

printf '%s\n' "$USE_RESPONSE" | jq .

REMOTE_CONNECT_URL="$(printf '%s' "$USE_RESPONSE" | jq -r '.remoteConnectUrl')"
printf 'remoteConnectUrl=%s\n' "$REMOTE_CONNECT_URL"
```

Appium’un çalıştığı makine bu adrese erişebilmelidir. Bu değeri Inspector’daki **Remote Host** alanına yazma.

---

## 4A) Android + Appium Inspector

Android’de `remoteConnectUrl`, Mercury ADB adresidir. Normalde `http://` olmadan `HOST:ADB_PORT` biçiminde döner.

Mercury üzerinden ADB bağlantısı kur:

```bash
adb connect "$REMOTE_CONNECT_URL"
adb devices -l
adb -s "$REMOTE_CONNECT_URL" get-state
```

`adb devices -l` çıktısının ilk sütunundaki değer Appium `udid` değeridir. Durum `offline` veya `unauthorized` değil, `device` olmalıdır.

Appium’u ayrı bir terminalde başlat ve çalışır durumda bırak:

```bash
appium --address 127.0.0.1 --port 4723
```

Appium Inspector’da **New Session** ekranını aç ve lokal Appium server alanlarını doldur:

| Inspector alanı | Değer |
| --- | --- |
| Remote Host | `127.0.0.1` |
| Remote Port | `4723` |
| Remote Path | `/` |
| SSL | Kapalı |

Appium 2 ve 3 varsayılan olarak `/` kullanır. `/wd/hub` yalnızca Appium açıkça `--base-path /wd/hub` ile başlatıldıysa kullanılmalıdır.

Inspector’ın JSON capability editor’üne şunu yapıştır:

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:udid": "devicefarm.example:12010",
  "appium:newCommandTimeout": 300,
  "appium:noReset": true
}
```

`devicefarm.example:12010` yerine `adb devices -l` çıktısındaki serial değerini aynen yaz. Kurulu bir uygulamayı doğrudan açmak için package ve activity bilgilerini ekle:

```json
{
  "appium:appPackage": "com.example.app",
  "appium:appActivity": ".MainActivity"
}
```

**Start Session** butonuna bas. Inspector Android ekran görüntüsünü ve page source’u göstermelidir.

---

## 4B) iOS + Appium Inspector

iOS’ta `remoteConnectUrl`, Mercury WebDriverAgent proxy adresidir. API yanıtında protokol yoksa `http://` ekle; zaten varsa tekrar ekleme:

```bash
case "$REMOTE_CONNECT_URL" in
  http://*|https://*) WDA_URL="$REMOTE_CONNECT_URL" ;;
  *) WDA_URL="http://$REMOTE_CONNECT_URL" ;;
esac

printf 'WDA URL=%s\n' "$WDA_URL"
curl -sS "${WDA_URL%/}/status" | jq .
```

Status isteği bir WDA yanıtı döndürmelidir. Timeout olursa önce ağ yönlendirmesi, firewall, WDA veya Mercury iOS provider sorununu düzelt.

Appium’u ayrı bir terminalde başlat ve çalışır durumda bırak:

```bash
appium --address 127.0.0.1 --port 4723
```

Appium Inspector’da **New Session** ekranını aç ve lokal Appium server alanlarını doldur:

| Inspector alanı | Değer |
| --- | --- |
| Remote Host | `127.0.0.1` |
| Remote Port | `4723` |
| Remote Path | `/` |
| SSL | Kapalı |

Inspector’ın JSON capability editor’üne şunu yapıştır:

```json
{
  "platformName": "iOS",
  "appium:automationName": "XCUITest",
  "appium:webDriverAgentUrl": "http://devicefarm.example:18200",
  "appium:useNewWDA": false,
  "appium:newCommandTimeout": 300,
  "appium:noReset": true
}
```

`http://devicefarm.example:18200` yerine normalize edilmiş `WDA_URL` değerini yaz. Kurulu bir uygulamayı açmak için bundle identifier ekle:

```json
{
  "appium:bundleId": "com.example.app"
}
```

Mercury iOS provider WDA yaşam döngüsünü yönetir. `appium:webDriverAgentUrl`, XCUITest’in mevcut WDA adresini kullanmasını sağlar. **Start Session** butonuna bastığında Inspector iOS ekran görüntüsünü ve page source’u göstermelidir.

---

## 5) Test sonunda cihazları bırak

Önce Appium Inspector’da **Delete Session** butonuna bas. Android için daha sonra ADB köprüsünü kapatabilirsin:

```bash
adb disconnect "$REMOTE_CONNECT_URL"
```

Son olarak Mercury grubunu serbest bırak:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $MERCURY_TOKEN" \
  "$MERCURY_BASE_URL/api/v1/autotests?group=$GROUP_ID"
```

Grup silme işlemini CI tarafında mutlaka `cleanup/finally` içine koy. Yalnızca Inspector’ı kapatmak veya Appium session’ını silmek Mercury rezervasyonunu bırakmaz.

---

## Sorun giderme

| Belirti | Kontrol |
| --- | --- |
| Inspector `127.0.0.1:4723` adresine bağlanamıyor | Lokal Appium process’inin çalıştığını ve Inspector SSL ayarının kapalı olduğunu kontrol et. |
| Inspector `404` veya unknown route döndürüyor | Remote Path `/` kullan; `/wd/hub` yalnızca uygun Appium `--base-path` ile kullanılmalıdır. |
| `Could not find a driver for automationName` | `appium driver list --installed` çalıştır; `uiautomator2` veya `xcuitest` kur. |
| Android listede yok veya `offline` | `adb connect` komutunu tekrarla, `adb devices -l` çıktısını kontrol et ve ilk sütundaki değeri `appium:udid` olarak kullan. |
| iOS WDA status adresine erişilemiyor | Host iOS provider, WDA logları, firewall ve Appium makinesinden erişimi kontrol et. |
| XCUITest yeniden WDA kurmaya çalışıyor | `appium:webDriverAgentUrl` ve `appium:useNewWDA: false` değerlerini kontrol et. |
| Session hemen düşüyor | `appium:newCommandTimeout` değerini artır, Mercury grup süresinin dolmadığını ve Appium/provider loglarını kontrol et. |
| Mercury `Device is not responding` döndürüyor | `mercury-provider`, `mercury-websocket` ve gerekiyorsa host iOS provider servislerini kontrol et. |
