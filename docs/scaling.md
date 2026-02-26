# Scaling Guide (EN + TR)

This guide summarizes practical capacity planning for multi-device setups.

---

## English

### Android capacity

Android provider uses roughly 2 ports per device.

- Formula: `(maxPort - minPort) / 2`
- Example: `12010-12100` gives ~45 device slots (practical limit depends on host USB/CPU)

### iOS capacity

iOS provider uses three pools:

- provider `port-range`
- `wda-range`
- `screen-ws-range`

Effective capacity is the smallest pool after internal splitting:

`min((portRangeMax - portRangeMin)/2, (wdaRangeMax - wdaRangeMin), (screenWsRangeMax - screenWsRangeMin))`

### Single iOS provider example (~10 devices)

```bash
IOS_PROVIDER_NAME=mercury-ios-provider \
IOS_PORT_RANGE_MIN=28100 IOS_PORT_RANGE_MAX=28124 \
IOS_WDA_RANGE_MIN=28300 IOS_WDA_RANGE_MAX=28312 \
IOS_SCREEN_WS_RANGE_MIN=28500 IOS_SCREEN_WS_RANGE_MAX=28512 \
./scripts/start-ios-provider.sh
```

### Multi iOS provider (sharding)

```bash
# shard 0
IOS_PROVIDER_SHARD=0 ./scripts/start-ios-provider.sh

# shard 1
IOS_PROVIDER_SHARD=1 ./scripts/start-ios-provider.sh
```

Notes:

- Keep provider names in `mercury-ios-provider*` format for nginx route compatibility.
- Do not reuse the same shard index on the same host.
- Prefer powered USB hubs for 10+ devices.

---

## Türkçe

Bu rehber, çoklu cihaz ortamında pratik kapasite planlamasını özetler.

### Android kapasitesi

Android provider cihaz başına yaklaşık 2 port kullanır.

- Formül: `(maxPort - minPort) / 2`
- Örnek: `12010-12100` aralığı teorik olarak ~45 cihaz slotu verir (pratik limit host USB/CPU'ya bağlıdır)

### iOS kapasitesi

iOS provider üç havuz kullanır:

- provider `port-range`
- `wda-range`
- `screen-ws-range`

Gerçek kapasite, iç bölme sonrası en küçük havuzla belirlenir:

`min((portRangeMax - portRangeMin)/2, (wdaRangeMax - wdaRangeMin), (screenWsRangeMax - screenWsRangeMin))`

### Tek iOS provider örneği (~10 cihaz)

```bash
IOS_PROVIDER_NAME=mercury-ios-provider \
IOS_PORT_RANGE_MIN=28100 IOS_PORT_RANGE_MAX=28124 \
IOS_WDA_RANGE_MIN=28300 IOS_WDA_RANGE_MAX=28312 \
IOS_SCREEN_WS_RANGE_MIN=28500 IOS_SCREEN_WS_RANGE_MAX=28512 \
./scripts/start-ios-provider.sh
```

### Çoklu iOS provider (shard)

```bash
# shard 0
IOS_PROVIDER_SHARD=0 ./scripts/start-ios-provider.sh

# shard 1
IOS_PROVIDER_SHARD=1 ./scripts/start-ios-provider.sh
```

Notlar:

- Nginx yönlendirmesi için provider adı `mercury-ios-provider*` formatında olmalı.
- Aynı hostta aynı shard index iki kez kullanılmamalı.
- 10+ cihaz için harici beslemeli USB hub tercih edin.
