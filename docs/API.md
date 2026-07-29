# API Reference (EN + TR)

This is a practical quick reference for Mercury REST API.

---

## English

### Authentication

Generate access token from UI (`Settings -> Keys`) and use:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR_DOMAIN/api/v1/user
```

### OpenAPI / Swagger

- OpenAPI JSON: `https://YOUR_DOMAIN/api/v1/scheme`
- Alias (compatible): `https://YOUR_DOMAIN/api/v1/swagger.json`
- Swagger UI: `https://YOUR_DOMAIN/api/v1/docs`
- Swagger YAML in repo: `lib/units/api/swagger/api_v1.yaml`
- Swagger docs endpoints are publicly reachable (no Bearer token required to open docs pages).

### Frequently used endpoints

#### Devices

- `GET /api/v1/devices`
- `GET /api/v1/devices/{serial}`
- `PUT /api/v1/devices/{serial}`

#### User

- `GET /api/v1/user`
- `GET /api/v1/user/devices`
- `POST /api/v1/user/devices`
- `DELETE /api/v1/user/devices/{serial}`
- `POST /api/v1/user/devices/{serial}/remoteConnect`
- `DELETE /api/v1/user/devices/{serial}/remoteConnect`
- `POST /api/v1/user/adbPublicKeys` — register the Appium/ADB host public key
- `DELETE /api/v1/user/adbPublicKeys` — remove a registered ADB key by fingerprint

#### Automation

- `GET /api/v1/autotests`
- `DELETE /api/v1/autotests`
- `GET /api/v1/autotests/{id}/addDevices`
- `POST /api/v1/autotests/useDevice`
- `POST /api/v1/autotests/install/{serial}`
- `GET /api/v1/builds`
- `DELETE /api/v1/builds/{id}`
- `DELETE /api/v1/builds`

For complete parameters, topology rules, and examples, see
[Automation API](./automation-api.md). Key rules: `run` and `timeout`
(`60..10800`) are required; provide either `amount` or `serials`; `serials`
takes precedence over filters.

### Minimal cURL examples

List devices:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR_DOMAIN/api/v1/devices
```

Use one device:

```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{"serial":"DEVICE_SERIAL"}' \
  https://YOUR_DOMAIN/api/v1/user/devices
```

Start remote connect:

```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_DOMAIN/api/v1/user/devices/DEVICE_SERIAL/remoteConnect
```

Reserve, use, and release one automation device:

```bash
CAPTURE="$(curl -sS -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?amount=1&timeout=600&run=api-smoke&type=android&need_amount=true")"
GROUP_ID="$(printf '%s' "$CAPTURE" | jq -r '.group.id')"
SERIAL="$(printf '%s' "$CAPTURE" | jq -r '.group.devices[0].serial')"

curl -sS -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" -d "{\"serial\":\"$SERIAL\"}" \
  https://YOUR_DOMAIN/api/v1/autotests/useDevice

# Always run this in cleanup/finally:
curl -sS -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?group=$GROUP_ID"
```

The resulting Builds state `Finished` means the reservation closed (explicit
release or timeout), not that test assertions passed. Add
`&result=passed|failed` to the release call to show a PASSED/FAILED badge on
the Builds page.

---

## Türkçe

### Kimlik doğrulama

UI'dan (`Settings -> Keys`) token üretin ve şu şekilde kullanın:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR_DOMAIN/api/v1/user
```

### OpenAPI / Swagger

- OpenAPI JSON: `https://YOUR_DOMAIN/api/v1/scheme`
- Alternatif (uyumlu alias): `https://YOUR_DOMAIN/api/v1/swagger.json`
- Swagger UI: `https://YOUR_DOMAIN/api/v1/docs`
- Repodaki Swagger YAML: `lib/units/api/swagger/api_v1.yaml`
- Swagger doküman endpointleri herkese açık (dokümanı açmak için Bearer token gerekmez).

### Sık kullanılan endpointler

#### Cihazlar

- `GET /api/v1/devices`
- `GET /api/v1/devices/{serial}`
- `PUT /api/v1/devices/{serial}`

#### Kullanıcı

- `GET /api/v1/user`
- `GET /api/v1/user/devices`
- `POST /api/v1/user/devices`
- `DELETE /api/v1/user/devices/{serial}`
- `POST /api/v1/user/devices/{serial}/remoteConnect`
- `DELETE /api/v1/user/devices/{serial}/remoteConnect`
- `POST /api/v1/user/adbPublicKeys` — Appium/ADB hostunun public key'ini kaydeder
- `DELETE /api/v1/user/adbPublicKeys` — kayıtlı ADB key'i fingerprint ile siler

#### Otomasyon

- `GET /api/v1/autotests`
- `DELETE /api/v1/autotests`
- `GET /api/v1/autotests/{id}/addDevices`
- `POST /api/v1/autotests/useDevice`
- `POST /api/v1/autotests/install/{serial}`
- `GET /api/v1/builds`
- `DELETE /api/v1/builds/{id}`
- `DELETE /api/v1/builds`

Tüm parametreler, topoloji kuralları ve örnekler için
[Automation API](./automation-api.md) dokümanına bak. Temel kurallar: `run` ve
`timeout` (`60..10800`) zorunludur; `amount` veya `serials` verilir; `serials`
filtrelerden önceliklidir.

### Minimal cURL örnekleri

Cihazları listele:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR_DOMAIN/api/v1/devices
```

Bir otomasyon cihazı ayır, kullan ve bırak:

```bash
CAPTURE="$(curl -sS -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?amount=1&timeout=600&run=api-smoke&type=android&need_amount=true")"
GROUP_ID="$(printf '%s' "$CAPTURE" | jq -r '.group.id')"
SERIAL="$(printf '%s' "$CAPTURE" | jq -r '.group.devices[0].serial')"

curl -sS -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" -d "{\"serial\":\"$SERIAL\"}" \
  https://YOUR_DOMAIN/api/v1/autotests/useDevice

# Bunu her zaman cleanup/finally içinde çalıştır:
curl -sS -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?group=$GROUP_ID"
```

Builds kaydındaki `Tamamlandı`, rezervasyonun kapandığını (açık release veya
timeout) gösterir; test assertion'larının geçtiği anlamına gelmez. Builds
sayfasında PASSED/FAILED rozeti göstermek için release çağrısına
`&result=passed|failed` ekle.
