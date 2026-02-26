# Automation API (EN + TR)

This document explains how to reserve/release devices for automated test runs.

---

## English

### Base URL and Auth

All requests use bearer token auth:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR_DOMAIN/api/v1/user
```

### Core automation endpoints

- `GET /api/v1/autotests` → capture devices for a run
- `DELETE /api/v1/autotests?group=<groupId>` → release captured devices
- `GET /api/v1/autotests/{id}/addDevices` → add devices to existing group
- `POST /api/v1/autotests/useDevice` → mark one device as automation and get `remoteConnectUrl`
- `POST /api/v1/autotests/install/{serial}` → install app from URL on device

### Capture devices

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?amount=1&timeout=600&run=my-run&type=ios&need_amount=true"
```

Common query params:

- `amount` required
- `timeout` required (seconds)
- `run` required (run id/name)
- `type` optional (`android` or `ios`)
- `need_amount` optional strict count
- `abi`, `model`, `sdk`, `version` optional filters

Important: non-admin users are limited to **2 devices** per run.

### Release devices

```bash
curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?group=GROUP_ID"
```

### Python quick example

```python
import requests

BASE = "https://YOUR_DOMAIN"
TOKEN = "YOUR_TOKEN"
headers = {"Authorization": f"Bearer {TOKEN}"}

capture = requests.get(
    f"{BASE}/api/v1/autotests",
    headers=headers,
    params={
        "amount": 1,
        "timeout": 600,
        "run": "ci-run-001",
        "type": "android",
        "need_amount": True,
    },
    timeout=30,
)
capture.raise_for_status()
payload = capture.json()

group_id = payload["group"]["id"]
device = payload["group"]["devices"][0]
print(device["serial"], device.get("remoteConnectUrl"))

requests.delete(
    f"{BASE}/api/v1/autotests",
    headers=headers,
    params={"group": group_id},
    timeout=30,
).raise_for_status()
```

## Ruby Example (Single Device)

```ruby
require 'json'
require 'net/http'
require 'uri'

BASE_URL = ENV.fetch('MERCURY_BASE_URL')
TOKEN = ENV.fetch('MERCURY_TOKEN')

def request(method:, path:, params: {})
  uri = URI("#{BASE_URL}#{path}")
  uri.query = URI.encode_www_form(params) unless params.empty?

  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = uri.scheme == 'https'

  req = (method == :delete ? Net::HTTP::Delete : Net::HTTP::Get).new(uri)
  req['Authorization'] = "Bearer #{TOKEN}"

  res = http.request(req)
  raise "HTTP #{res.code}: #{res.body}" unless res.is_a?(Net::HTTPSuccess)

  JSON.parse(res.body)
end

capture = request(
  method: :get,
  path: '/api/v1/autotests',
  params: {
    amount: 1,
    timeout: 600,
    run: "ruby-run-#{Time.now.to_i}",
    need_amount: true,
    type: 'android'
  }
)

group_id = capture.dig('group', 'id')
device = capture.dig('group', 'devices', 0)
raise 'No device captured' unless group_id && device

puts "Captured #{device['serial']} remote=#{device['remoteConnectUrl']}"

begin
  ok = system('echo "Run your Ruby/Appium tests here"')
  raise 'Test command failed' unless ok
ensure
  request(method: :delete, path: '/api/v1/autotests', params: { group: group_id })
  puts "Released group=#{group_id}"
end
```

## Azure Pipeline Example (Ruby + Mercury)

```yaml
trigger:
- main

pool:
  vmImage: 'macOS-latest'

variables:
  MERCURY_BASE_URL: 'https://YOUR_DOMAIN'

steps:
- task: UseRubyVersion@0
  inputs:
    versionSpec: '3.2'

- script: |
    gem install bundler
    bundle install
  displayName: Install Ruby dependencies

- script: ruby mercury_single_device.rb
  displayName: Run Ruby mobile tests on Mercury
  env:
    MERCURY_BASE_URL: $(MERCURY_BASE_URL)
    MERCURY_TOKEN: $(MERCURY_TOKEN)
```

Store `MERCURY_TOKEN` as a secret variable.

---

## Türkçe

### Temel URL ve Kimlik Doğrulama

Tüm istekler bearer token ile yapılır:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR_DOMAIN/api/v1/user
```

### Ana otomasyon endpointleri

- `GET /api/v1/autotests` → test koşusu için cihaz ayırır
- `DELETE /api/v1/autotests?group=<groupId>` → ayrılan cihazları bırakır
- `GET /api/v1/autotests/{id}/addDevices` → mevcut gruba cihaz ekler
- `POST /api/v1/autotests/useDevice` → cihazı automation kullanımına alır ve `remoteConnectUrl` döner
- `POST /api/v1/autotests/install/{serial}` → cihaza URL üzerinden uygulama kurar

### Cihaz ayırma örneği

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?amount=1&timeout=600&run=my-run&type=ios&need_amount=true"
```

Sık kullanılan parametreler:

- `amount` zorunlu
- `timeout` zorunlu (saniye)
- `run` zorunlu (koşu adı/id)
- `type` opsiyonel (`android` veya `ios`)
- `need_amount` opsiyonel (tam sayı zorlaması)
- `abi`, `model`, `sdk`, `version` opsiyonel filtre

Not: admin olmayan kullanıcılar koşu başına en fazla **2 cihaz** alabilir.
