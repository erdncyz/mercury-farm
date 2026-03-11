# Smart TV (Tizen) Guide (EN + TR)

This document explains Smart TV support in Mercury, focused on Tizen-based devices.

---

## English

### Scope

Mercury includes first-class runtime support for Tizen devices through a dedicated device unit:

- CLI command: `tizen-device`
- Device transport: SDB
- App lifecycle: list, install, launch, terminate, kill
- Inspector mode: Web Inspector + CDP bridge

### Where Smart TV Logic Lives

- Tizen unit bootstrap: `lib/units/tizen-device/index.js`
- Tizen CLI command: `lib/cli/tizen-device/index.js`
- Main CLI registration: `lib/cli/index.js`
- SDB proxy and connection handling: `lib/units/tizen-device/plugins/sdb/connect.js`
- SDB client helpers: `lib/units/tizen-device/plugins/sdb/index.js`
- App launcher lifecycle: `lib/units/tizen-device/plugins/launcher.js`
- Install flow: `lib/units/tizen-device/plugins/install.js`
- Device file system access: `lib/units/tizen-device/plugins/filesystem.js`
- Tizen identity collection: `lib/units/tizen-device/plugins/identity.js`
- Web inspector backend: `lib/units/tizen-device/plugins/webinspector/index.ts`
- UI Tizen screen switch: `ui/src/components/ui/device/device-screen/device-screen.tsx`
- UI Web Inspector screen: `ui/src/components/ui/device/device-screen/screens/web-inspector-screen.tsx`

### Architecture Summary

1. `tizen-device` unit starts and checks TV host/port reachability.
2. SDB proxy opens on `connect-port` and maintains controlled connection limits.
3. Device identity and display information are collected and published.
4. App management commands are handled through SDB:
   - list installed apps
   - install app package
   - launch with debug port
   - terminate/kill app
5. When an app is launched in debug mode, Mercury starts inspector services:
   - connects to app debug endpoint via CDP
   - exposes websocket updates for UI inspector panel

### Important Behavior Differences

- Tizen does not use the same live streaming path as Android/iOS in UI.
- UI switches to Web Inspector mode for Tizen devices.
- During upload, a package identifier (`pkg`) input is shown for Tizen flows.
- Remote debug helper command for Tizen devices is `sdb connect <host:port>`.

### Run Flags (Tizen CLI)

Common options in `tizen-device` command:

- `--provider`
- `--public-ip`
- `--public-port`
- `--device-host`
- `--device-port` (default `26101`)
- `--connect-port` (required)
- `--app-inspect-port` (default `18101`)
- `--heartbeat-interval`
- `--ping-frequency`

For complete flags and defaults, see:

- `lib/cli/tizen-device/index.js`

### Operational Notes

- SDB connection behavior is stricter than ADB because Tizen allows limited active clients.
- The unit includes external/internal connection separation to avoid unstable multi-client access.
- Inspector operations (HTML snapshot, assets list/download, console eval/logs) are available after app launch.

### Known Limits

- Docs currently do not include an end-to-end production deployment recipe dedicated to Smart TV clusters.
- Most flows are implementation-documented in code rather than standalone operational playbooks.

### Quick Checklist

- Confirm TV host is reachable from provider host.
- Ensure SDB port and connect port mapping are open.
- Start `tizen-device` with required endpoints.
- Open device in UI and verify Inspector view is available.
- Launch app and verify HTML/asset/console channels populate.

---

## Turkce

### Kapsam

Mercury, Tizen tabanli Smart TV cihazlarini ayri bir cihaz unit'i ile destekler:

- CLI komutu: `tizen-device`
- Cihaz iletisim katmani: SDB
- Uygulama yasam dongusu: listele, kur, baslat, terminate, kill
- Inspector modu: Web Inspector + CDP koprusu

### Smart TV Kodunun Oldugu Yerler

- Tizen unit baslatma: `lib/units/tizen-device/index.js`
- Tizen CLI komutu: `lib/cli/tizen-device/index.js`
- Ana CLI kaydi: `lib/cli/index.js`
- SDB proxy/baglanti yonetimi: `lib/units/tizen-device/plugins/sdb/connect.js`
- SDB istemci yardimcilari: `lib/units/tizen-device/plugins/sdb/index.js`
- Uygulama baslatma/sonlandirma: `lib/units/tizen-device/plugins/launcher.js`
- Kurulum akisi: `lib/units/tizen-device/plugins/install.js`
- Cihaz dosya sistemi islemleri: `lib/units/tizen-device/plugins/filesystem.js`
- Tizen kimlik verisi toplama: `lib/units/tizen-device/plugins/identity.js`
- Web inspector backend: `lib/units/tizen-device/plugins/webinspector/index.ts`
- UI Tizen ekran secimi: `ui/src/components/ui/device/device-screen/device-screen.tsx`
- UI Web Inspector ekrani: `ui/src/components/ui/device/device-screen/screens/web-inspector-screen.tsx`

### Mimari Ozet

1. `tizen-device` unit'i ayağa kalkar ve TV host/port erisimini kontrol eder.
2. SDB proxy `connect-port` uzerinde acilir ve baglanti limitlerini kontrol eder.
3. Cihaz kimligi ve ekran bilgileri toplanip publish edilir.
4. Uygulama komutlari SDB uzerinden yonetilir:
   - kurulu uygulamalari listeleme
   - uygulama kurma
   - debug port ile uygulama baslatma
   - terminate/kill
5. Uygulama debug modda baslayinca inspector servisleri devreye girer:
   - CDP ile app debug endpoint baglantisi
   - UI icin websocket guncelleme kanali

### Diger Platformlardan Farkli Davranislar

- Tizen, Android/iOS gibi klasik canli stream ekran yolunu kullanmaz.
- UI, Tizen cihazlarda Web Inspector moduna gecer.
- Uygulama yuklemede Tizen icin `pkg` alani gorunur.
- Tizen uzaktan baglanti yardimci komutu `sdb connect <host:port>` seklindedir.

### Tizen CLI Onemli Parametreler

`tizen-device` komutunda sik kullanilan parametreler:

- `--provider`
- `--public-ip`
- `--public-port`
- `--device-host`
- `--device-port` (varsayilan `26101`)
- `--connect-port` (zorunlu)
- `--app-inspect-port` (varsayilan `18101`)
- `--heartbeat-interval`
- `--ping-frequency`

Tum parametreler ve varsayilanlar icin:

- `lib/cli/tizen-device/index.js`

### Operasyon Notlari

- SDB baglantisi, Tizen tarafindaki aktif istemci limitleri nedeniyle ADB'ye gore daha kisitlidir.
- Unit tarafinda local/external baglanti ayrimi yapilarak coklu istemci sorunlari azaltilir.
- Inspector ozellikleri (HTML, asset list/download, console komut/log) uygulama baslatildiktan sonra aktif olur.

### Bilinen Sinirlar

- Smart TV cluster odakli uctan uca production deploy runbook'u su an ayri bir dokuman olarak bulunmuyor.
- Bircok detay kod icinde dokumante, operasyon rehberi seviyesi daha sinirli.

### Hizli Kontrol Listesi

- TV host'un provider makinesinden erisilebilir oldugunu dogrula.
- SDB ve connect port erisimlerinin acik oldugunu dogrula.
- `tizen-device` unit'ini gerekli endpointlerle baslat.
- UI'da cihazi acip Inspector ekraninin geldigini kontrol et.
- Uygulama baslatip HTML/asset/console kanallarinin veri aktardigini dogrula.