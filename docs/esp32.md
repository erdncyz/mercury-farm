# ESP32 Notes (EN + TR)

ESP32 support is optional.
Use it only if your iOS interaction model requires external touch/mouse-like control.

---

## English

### Default behavior

Mercury starts with ESP32 integration disabled by default:

- `IOS_DISABLE_ESP32=1`

### Enable ESP32 integration

```bash
IOS_DISABLE_ESP32=0 ./scripts/start-ios-provider.sh
```

### Recommended approach

- Start without ESP32 first
- Verify device discovery and WDA stability
- Enable ESP32 only for scenarios that truly need it

---

## Türkçe

ESP32 desteği opsiyoneldir.
Sadece iOS etkileşim modeliniz harici touch/mouse benzeri kontrol gerektiriyorsa kullanın.

### Varsayılan davranış

Mercury varsayılan olarak ESP32 entegrasyonunu kapalı başlatır:

- `IOS_DISABLE_ESP32=1`

### ESP32 entegrasyonunu açma

```bash
IOS_DISABLE_ESP32=0 ./scripts/start-ios-provider.sh
```

### Önerilen yaklaşım

- Önce ESP32 kapalı şekilde sistemi doğrulayın
- Cihaz keşfi ve WDA kararlılığını kontrol edin
- Sadece gerçekten gereken senaryolarda ESP32'yi açın
