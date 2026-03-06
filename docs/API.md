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

#### Automation

- `GET /api/v1/autotests`
- `DELETE /api/v1/autotests`
- `GET /api/v1/autotests/{id}/addDevices`
- `POST /api/v1/autotests/useDevice`
- `POST /api/v1/autotests/install/{serial}`

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
- Swagger dokuman endpointleri herkese acik (dokumani acmak icin Bearer token gerekmez).

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

#### Otomasyon

- `GET /api/v1/autotests`
- `DELETE /api/v1/autotests`
- `GET /api/v1/autotests/{id}/addDevices`
- `POST /api/v1/autotests/useDevice`
- `POST /api/v1/autotests/install/{serial}`
