# Parallel Execution (EN + TR)

This guide explains how to run tests in parallel on Mercury for Android and iOS.

---

## English

## 1) What parallel means in Mercury

- Parallel execution = reserving multiple devices at once and running separate test workers.
- Device reservation is done with Automation API (`/api/v1/autotests`).
- Real capacity depends on provider port ranges and host USB/CPU limits.
- Ready-to-run Ruby scripts: [examples/automation-ruby/parallel_run.rb](../examples/automation-ruby/parallel_run.rb) (multi-device) and [examples/automation-ruby/single_run.rb](../examples/automation-ruby/single_run.rb) (single device).

---

## 2) Android parallel model

Android provider uses a port range (`min-port` / `max-port`).
In this project, compose uses:

- `12010-12100`

File:

- [docker-compose-macos.yaml](./../docker-compose-macos.yaml)

Practical meaning:

- More range -> more potential concurrent device workers.
- Each extra parallel device consumes more USB, CPU, memory, and network.

---

## 3) iOS parallel model (single host)

iOS provider on host uses three pools:

- `IOS_PORT_RANGE_MIN/MAX`
- `IOS_WDA_RANGE_MIN/MAX`
- `IOS_SCREEN_WS_RANGE_MIN/MAX`

File:

- [scripts/start-ios-provider.sh](./../scripts/start-ios-provider.sh)

The effective max parallelism is limited by the smallest pool.

---

## 4) iOS sharding (multiple providers on one host)

Use shard variables:

- `IOS_PROVIDER_SHARD` (0,1,2,...)
- `IOS_PORT_STRIDE` (default `1000`)

Example:

```bash
# shard 0
IOS_PROVIDER_SHARD=0 ~/.mercury-farm/mercury ios

# shard 1
IOS_PROVIDER_SHARD=1 ~/.mercury-farm/mercury ios
```

Important:

- Do not reuse same shard id on same machine.
- Keep provider naming pattern compatible (`mercury-ios-provider*`), already handled by script defaults.

---

## 5) Parallel reservation via API

Reserve N devices:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?amount=4&timeout=900&run=ci-parallel-001&type=android&need_amount=true"
```

`amount=4` requires an admin token; regular users are limited to 2 devices per
run. `timeout` must be between `60` and `10800` seconds.

To pin exact devices, use `serials`. It takes precedence over `amount`, `type`,
and the other filters, and all listed devices must be free:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?timeout=900&run=ci-parallel-001&serials=SERIAL_A,SERIAL_B"
```

Response returns:

- `group.id`
- `group.devices[]` list

You can then:

- assign one test worker per device serial,
- call `POST /api/v1/autotests/useDevice` per worker/device to get `remoteConnectUrl`.

All devices reserved in one call belong to a single run named by the `run`
parameter. That run appears on the **Builds** page with every device listed as
a chip; while it is `Running` you can click any chip to watch that device live.
Use a unique name per pipeline execution (for example `ci-parallel-${BUILD_NUMBER}`)
and add `runUrl` to link back to the CI job.

Connection rules per worker:

- **Android:** run `adb connect <remoteConnectUrl>` on the same machine as the Appium server. Register that host's ADB public key in **Settings → Keys → ADB Keys**. With central Appium, use SSH (the Ruby helper supports `MERCURY_ADB_SSH=user@APPIUM_HOST`) or prepare the connection on that host before the session.
- **iOS:** if `remoteConnectUrl` is bare `HOST:PORT`, convert it to `http://HOST:PORT` before assigning `appium:webDriverAgentUrl`. The Ruby helper does this automatically.

Reference:

- [automation-api.md](./automation-api.md)

---

## 6) Recommended worker strategy

1. Reserve all required devices in one call (`amount=N`).
2. Split returned device serials across CI workers.
3. Each worker:
   - `useDevice` for its serial
  - prepares Android ADB on the Appium host, or the normalized iOS WDA URL
   - runs Appium test session
4. Always release group in `finally`:

```bash
curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?group=GROUP_ID"
```

The Builds record becoming `Finished` means the reservation closed (explicit
release or timeout); it does not mean every worker passed. Use worker/test exit
codes and assertions as the pass/fail source of truth.

---

## 7) Stability checklist for high parallelism

- Use powered USB hubs (especially 8+ devices).
- Keep iOS provider on host healthy (`start-ios-provider.sh` / LaunchAgent).
- Monitor:
  - `mercury-provider`
  - `mercury-websocket`
  - iOS provider logs (`/tmp/mercury-ios-provider.log` or runtime logs)
- Increase timeout values gradually, not all at once.
- Start with low parallel count (2-4), then ramp up.

---

## 8) CI matrix example (2-4 workers)

Example GitHub Actions matrix that runs tests in parallel workers.
Use the matrix size as your target parallelism.

```yaml
name: Mercury Parallel E2E

on:
  workflow_dispatch:
    inputs:
      workers:
        description: "Worker count (2-4)"
        required: true
        default: "2"

jobs:
  e2e:
    runs-on: macos-latest
    strategy:
      fail-fast: false
      matrix:
        worker: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4

      - name: Select active workers (2-4)
        id: gate
        shell: bash
        run: |
          W="${{ github.event.inputs.workers || '2' }}"
          if [ "${{ matrix.worker }}" -le "$W" ]; then
            echo "run=true" >> "$GITHUB_OUTPUT"
          else
            echo "run=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Reserve one device for this worker
        if: steps.gate.outputs.run == 'true'
        shell: bash
        env:
          MERCURY_BASE_URL: ${{ secrets.MERCURY_BASE_URL }}
          MERCURY_TOKEN: ${{ secrets.MERCURY_TOKEN }}
        run: |
          RESP="$(curl -sS -H "Authorization: Bearer $MERCURY_TOKEN" \
            "$MERCURY_BASE_URL/api/v1/autotests?amount=1&timeout=1200&run=gha-${{ github.run_id }}-w${{ matrix.worker }}&need_amount=true&type=android")"
          echo "$RESP" > reserve.json
          GROUP_ID="$(jq -r '.group.id' reserve.json)"
          SERIAL="$(jq -r '.group.devices[0].serial' reserve.json)"
          echo "GROUP_ID=$GROUP_ID" >> "$GITHUB_ENV"
          echo "SERIAL=$SERIAL" >> "$GITHUB_ENV"

      - name: Enable remote connect
        if: steps.gate.outputs.run == 'true'
        shell: bash
        env:
          MERCURY_BASE_URL: ${{ secrets.MERCURY_BASE_URL }}
          MERCURY_TOKEN: ${{ secrets.MERCURY_TOKEN }}
        run: |
          RESP="$(curl -sS -X POST \
            -H "Authorization: Bearer $MERCURY_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"serial\":\"$SERIAL\"}" \
            "$MERCURY_BASE_URL/api/v1/autotests/useDevice")"
          echo "$RESP" > use.json
          REMOTE_URL="$(jq -r '.remoteConnectUrl' use.json)"
          echo "REMOTE_URL=$REMOTE_URL" >> "$GITHUB_ENV"

      - name: Run tests (example)
        if: steps.gate.outputs.run == 'true'
        shell: bash
        run: |
          echo "Worker ${{ matrix.worker }} using serial=$SERIAL remote=$REMOTE_URL"
          # Put your Appium test command here
          # Android + local Appium (Topology A):
          # adb connect "$REMOTE_URL"
          # Android + central Appium (Topology B):
          # ssh "$MERCURY_ADB_SSH" "adb connect '$REMOTE_URL'"
          # Register the selected Appium host's adbkey.pub in Mercury first.
          # npm run test:e2e -- --worker="${{ matrix.worker }}" --serial="$SERIAL"

      - name: Release group (always)
        if: always() && steps.gate.outputs.run == 'true'
        shell: bash
        env:
          MERCURY_BASE_URL: ${{ secrets.MERCURY_BASE_URL }}
          MERCURY_TOKEN: ${{ secrets.MERCURY_TOKEN }}
        run: |
          if [ -n "${GROUP_ID:-}" ] && [ "$GROUP_ID" != "null" ]; then
            curl -sS -X DELETE -H "Authorization: Bearer $MERCURY_TOKEN" \
              "$MERCURY_BASE_URL/api/v1/autotests?group=$GROUP_ID" || true
          fi
```

Notes:

- This example uses `jq` for JSON parsing.
- Use repo secrets for `MERCURY_BASE_URL` and `MERCURY_TOKEN`.
- For central Android Appium, store the SSH target as `MERCURY_ADB_SSH`; the shown SSH automation is not built into the Java or Playwright examples.
- You can split by platform (`android` / `ios`) with separate jobs.

---

## Türkçe

## 1) Mercury’de paralel ne demek?

- Paralel koşum = aynı anda birden fazla cihaz ayırıp her cihazı ayrı worker’da çalıştırmak.
- Cihaz ayırma Automation API ile yapılır (`/api/v1/autotests`).
- Gerçek kapasite port aralıkları + host USB/CPU limitlerine bağlıdır.

---

## 2) Android paralel modeli

Android provider port aralığı kullanır (`min-port` / `max-port`).
Bu projede compose tarafında:

- `12010-12100`

Dosya:

- [docker-compose-macos.yaml](./../docker-compose-macos.yaml)

Anlamı:

- Aralık arttıkça teorik eşzamanlı worker sayısı artar.
- Her ek cihaz USB, CPU, RAM ve ağ yükünü artırır.

---

## 3) iOS paralel modeli (tek host)

Host üzerindeki iOS provider üç havuz kullanır:

- `IOS_PORT_RANGE_MIN/MAX`
- `IOS_WDA_RANGE_MIN/MAX`
- `IOS_SCREEN_WS_RANGE_MIN/MAX`

Dosya:

- [scripts/start-ios-provider.sh](./../scripts/start-ios-provider.sh)

Gerçek maksimum paralellik en küçük havuz tarafından sınırlanır.

---

## 4) iOS sharding (aynı hostta çoklu provider)

Shard değişkenleri:

- `IOS_PROVIDER_SHARD` (0,1,2,...)
- `IOS_PORT_STRIDE` (varsayılan `1000`)

Örnek:

```bash
# shard 0
IOS_PROVIDER_SHARD=0 ~/.mercury-farm/mercury ios

# shard 1
IOS_PROVIDER_SHARD=1 ~/.mercury-farm/mercury ios
```

Önemli:

- Aynı makinede aynı shard id iki kez kullanılmamalı.
- Script varsayılanı nginx uyumlu provider adını korur (`mercury-ios-provider*`).

---

## 5) API ile paralel cihaz ayırma

N cihaz ayırma:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?amount=4&timeout=900&run=ci-parallel-001&type=android&need_amount=true"
```

`amount=4` için admin token gerekir; normal kullanıcılar koşum başına en fazla 2
cihaz alabilir. `timeout`, `60..10800` saniye aralığında olmalıdır.

Tam belirli cihazları ayırmak için `serials` kullan. Bu parametre `amount`,
`type` ve diğer filtrelerden önceliklidir; listedeki tüm cihazlar boşta olmalıdır:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?timeout=900&run=ci-parallel-001&serials=SERIAL_A,SERIAL_B"
```

Yanıt:

- `group.id`
- `group.devices[]`

Sonra:

- her worker kendi serial’ı için `POST /api/v1/autotests/useDevice` çağırır,
- `remoteConnectUrl` ile Appium bağlanır.

Tek çağrıda ayrılan tüm cihazlar, `run` parametresiyle adlandırılan tek bir
koşuma aittir. Bu koşum **Builds** sayfasında tüm cihazları chip olarak
listelenmiş şekilde görünür; `Çalışıyor` durumundayken herhangi bir chip'e
tıklayarak o cihazı canlı izleyebilirsin. Her pipeline koşusu için benzersiz
bir isim kullan (örn. `ci-parallel-${BUILD_NUMBER}`) ve CI job'ına dönmek için
`runUrl` ekle.

Worker başına bağlantı kuralları:

- **Android:** `adb connect <remoteConnectUrl>` komutunu Appium sunucusuyla aynı makinede çalıştır. O hostun ADB public key'ini **Settings → Keys → ADB Keys** altında kaydet. Merkezi Appium'da SSH kullan (Ruby yardımcı `MERCURY_ADB_SSH=user@APPIUM_HOST` destekler) veya session öncesi bağlantıyı o hostta hazırla.
- **iOS:** `remoteConnectUrl` çıplak `HOST:PORT` ise `appium:webDriverAgentUrl` vermeden önce `http://HOST:PORT` biçimine getir. Ruby yardımcı bunu otomatik yapar.

Referans:

- [automation-api.md](./automation-api.md)

---

## 6) Önerilen worker stratejisi

1. Tek çağrıda `amount=N` ile cihazları ayır.
2. Dönen serial listesini worker’lara dağıt.
3. Her worker:
   - `useDevice` çağırır
  - Android ADB bağlantısını Appium hostunda veya normalize edilmiş iOS WDA URL'sini hazırlar
   - Appium testini çalıştırır
4. Her zaman `finally` içinde group release yap:

```bash
curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_DOMAIN/api/v1/autotests?group=GROUP_ID"
```

Builds kaydının `Tamamlandı` olması rezervasyonun kapandığını (açık release veya
timeout) gösterir; tüm worker testlerinin geçtiği anlamına gelmez. Pass/fail
için worker/test exit code'larını ve assertion sonuçlarını esas al.

---

## 7) Yüksek paralellik için stabilite checklist

- Harici beslemeli USB hub kullan (özellikle 8+ cihaz).
- iOS provider’ın hostta sağlıklı çalıştığını doğrula.
- Şu logları izle:
  - `mercury-provider`
  - `mercury-websocket`
  - iOS provider logları
- Timeout değerlerini kademeli artır.
- Önce düşük paralel (2-4) ile başlayıp aşamalı yükselt.

---

## 8) CI matrix örneği (2-4 worker)

GitHub Actions'ta 2-4 worker arası paralel koşum için örnek:

- Matrix `worker: [1,2,3,4]` tanımlanır.
- `workers` input değeri kadar worker aktif edilir.
- Her aktif worker kendi cihazını `amount=1` ile ayırır.
- `useDevice` ile `remoteConnectUrl` alır.
- Android'de `adb connect` Appium hostunda çalışır; merkezi Appium'da gerekirse SSH kullanılır. iOS'ta WDA adresine şema yoksa `http://` eklenir.
- Testi çalıştırır.
- `always()` cleanup adımında `group` mutlaka bırakılır.

Yukarıdaki YAML örneği doğrudan kullanılabilir; sadece test komutunu kendi projene göre değiştirmen yeterli.
