# iOS Specific Setup (EN + TR)

This document explains the **current iOS flow** in Mercury.

For full install/start/restart steps, always follow:
- **[Getting Started (EN + TR)](./getting-started.md)**

---

## English

### Important Update

iOS devices are **not added manually** anymore.

- No manual `stf ios-provider ...` command is required in normal usage.
- No manual "add device" step exists in UI.
- iOS devices are detected automatically when connected and trusted.

### Current iOS Flow (WDA)

1. Connect iPhone/iPad via USB.
2. Tap **Trust This Computer** on the device.
3. Start stack with `npm run stack:up:macos` (see Getting Started).
4. Start iOS provider with:

```bash
./scripts/start-ios-provider.sh
```

5. Mercury iOS provider launches device worker and handles WDA flow automatically.
6. Device appears in Mercury UI and can be used directly.

### Requirements

- macOS
- Xcode installed (opened at least once)
- `xcode-select --install` completed
- `libimobiledevice` + `usbmuxd` installed
- Project dependencies installed (`npm ci`)

### iOS Troubleshooting (Quick)

Restart iOS provider:

```bash
./scripts/start-ios-provider.sh
```

If port conflict or stale process occurs:

```bash
/bin/zsh -lc 'pkill -f "stf.mjs ios-provider|mercury-ios-provider|lib/cli ios-device" || true'
./scripts/start-ios-provider.sh
```

Check provider logs:

```bash
docker logs -f mercury-provider
```

### Optional: Faster WDA Profile

Use the default lean profile:

```bash
./scripts/start-ios-provider.sh
```

Tune it manually for more/less aggressive behavior:

```bash
IOS_WDA_LEAN_MODE=1 \
IOS_WDA_TREE_CACHE_MS=250 \
IOS_WDA_ELEMENT_RESPONSE_ATTRIBUTES="type,label,name,enabled,visible,rect" \
./scripts/start-ios-provider.sh
```

---

## Türkçe

### Önemli Güncelleme

iOS cihazlar artık **manuel eklenmiyor**.

- Normal kullanımda manuel `stf ios-provider ...` komutu gerekmez.
- Arayüzde manuel "cihaz ekle" adımı yoktur.
- iOS cihazlar bağlanıp güven verildiğinde otomatik algılanır.

### Güncel iOS Akışı (WDA)

1. iPhone/iPad'i USB ile bağla.
2. Cihazdan **Bu Bilgisayara Güven** onayını ver.
3. `npm run stack:up:macos` ile sistemi başlat (detay: Getting Started).
4. iOS provider'ı şu komutla başlat:

```bash
./scripts/start-ios-provider.sh
```

5. Mercury iOS provider, cihaz worker ve WDA akışını otomatik yönetir.
6. Cihaz Mercury arayüzünde görünür ve doğrudan kullanılabilir.

### Gereksinimler

- macOS
- Xcode kurulu (en az bir kez açılmış)
- `xcode-select --install` tamamlanmış
- `libimobiledevice` + `usbmuxd` kurulu
- Proje bağımlılıkları kurulmuş (`npm ci`)

### iOS Sorun Giderme (Hızlı)

iOS provider yeniden başlat:

```bash
./scripts/start-ios-provider.sh
```

Port çakışması/eski süreç kaldıysa:

```bash
/bin/zsh -lc 'pkill -f "stf.mjs ios-provider|mercury-ios-provider|lib/cli ios-device" || true'
./scripts/start-ios-provider.sh
```

Provider loglarını izle:

```bash
docker logs -f mercury-provider
```

### Opsiyonel: Daha Hızlı WDA Profili

Varsayılan lean profil için:

```bash
./scripts/start-ios-provider.sh
```

Daha agresif/daha yumuşak davranış için manuel ayar:

```bash
IOS_WDA_LEAN_MODE=1 \
IOS_WDA_TREE_CACHE_MS=250 \
IOS_WDA_ELEMENT_RESPONSE_ATTRIBUTES="type,label,name,enabled,visible,rect" \
./scripts/start-ios-provider.sh
```

---

## Optional: ESP32 Mouse Controller

ESP32 support is optional and only needed for advanced iOS pointer-like interaction.

- EN: see `docs/esp32.md`
- TR: `docs/esp32.md` dosyasına bakın
