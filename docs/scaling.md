# Scaling Guide (iOS + Android)

Bu doküman, çoklu cihaz ortamında kalıcı ve öngörülebilir kapasite için temel kuralları özetler.

## Android kapasite

Android provider her cihaz için 2 worker port kullanır.

- Kapasite hesabı: `(max-port - min-port) / 2`
- 10 Android için öneri: en az 24 port (12 cihaz payı) bırakın.
- Örnek: `--min-port=12010 --max-port=12034` yaklaşık 12 cihaz kapasitesi sağlar.

## iOS kapasite

iOS provider her cihaz için 4 farklı port havuzundan 1 slot kullanır.

- `port-range` havuzu ikiye bölünür (`wdaPorts` + `screenWsPorts`).
- Gerçek kapasite:
  - `min((portRangeMax - portRangeMin)/2, (wdaRangeMax - wdaRangeMin), (screenWsRangeMax - screenWsRangeMin))`
- 10 iOS için öneri: en az 12 slot.

## iOS tek provider (10 cihaza uygun örnek)

```bash
IOS_PROVIDER_NAME=mercury-ios-provider \
IOS_PORT_RANGE_MIN=28100 IOS_PORT_RANGE_MAX=28124 \
IOS_WDA_RANGE_MIN=28300 IOS_WDA_RANGE_MAX=28312 \
IOS_SCREEN_WS_RANGE_MIN=28500 IOS_SCREEN_WS_RANGE_MAX=28512 \
./scripts/start-ios-provider.sh
```

## iOS çoklu provider (shard)

`start-ios-provider.sh` shard destekler. Her shard otomatik farklı port bloğu kullanır.

```bash
# shard 0
IOS_PROVIDER_SHARD=0 ./scripts/start-ios-provider.sh

# shard 1 (isim ve portlar otomatik ayrılır)
IOS_PROVIDER_SHARD=1 ./scripts/start-ios-provider.sh
```

Notlar:
- Provider isimleri `mercury-ios-provider*` formatında olmalı (nginx route bu paterni proxy’ler).
- Aynı shard index iki kez başlatılırsa lock mekanizması ikinci süreci engeller.

## Operasyonel öneriler

- iOS cihazları shard’lara UDID bazlı sabitleyin (flapping azalır).
- USB hub’larda harici güç kullanın; 10+ cihazda bus power yetersizliği çok yaygındır.
- Runtime deploy sırasında `node_modules` korunmalıdır (`deploy-ios-provider-runtime.sh` bu şekilde ayarlandı).
