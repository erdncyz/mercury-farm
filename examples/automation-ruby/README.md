# Mercury Ruby Automation Examples / Örnekleri

No extra gems required — runs on Ruby stdlib (`net/http`). Full API documentation:
[docs/automation-api.md](../../docs/automation-api.md)

Ek gem gerekmez — Ruby stdlib (`net/http`) ile çalışır. Detaylı API dokümanı:
[docs/automation-api.md](../../docs/automation-api.md)

| Dosya | Ne için? |
| --- | --- |
| [mercury_client.rb](./mercury_client.rb) | Ortak istemci: `reserve` / `use_device` / `release` |
| [single_run.rb](./single_run.rb) | **Tekli koşum** — 1 cihaz ayır, bağlan, test koştur, bırak |
| [parallel_run.rb](./parallel_run.rb) | **Çoklu (paralel) koşum** — N cihazı tek grupta ayır, thread'lerle paralel koştur |
| [appium_session.rb](./appium_session.rb) | Örnek testler için yardımcı: ayır + Appium session aç + her durumda bırak |
| [settings_test_pass.rb](./settings_test_pass.rb) | **✅ Başarılı senaryo** — Ayarlar'ı aç, "Genel"e tıkla, doğrula, PASS ile bit |
| [settings_test_fail.rb](./settings_test_fail.rb) | **❌ Başarısız senaryo** — olmayan menüyü arar, FAIL (exit 1) ama cihaz yine bırakılır |

## Hızlı başlangıç

```bash
export MERCURY_BASE_URL=https://YOUR_DOMAIN   # UI'daki /#/ olmadan
export MERCURY_TOKEN=...                      # UI > Settings > Keys > Access Tokens
export MERCURY_TYPE=android                   # android | ios — platforma özel koşularda şart!

ruby single_run.rb                            # tekli koşum
MERCURY_AMOUNT=2 ruby parallel_run.rb         # çoklu koşum
```

## Örnek Appium test senaryoları

Gerçek Appium session'ıyla uçtan uca iki hazır senaryo (tek gem: `appium_lib_core`):

```bash
gem install appium_lib_core
appium --address 127.0.0.1 --port 4723 &      # Appium'u başlat (UiAutomator2/XCUITest driver kurulu olmalı)

export MERCURY_BASE_URL=https://YOUR_DOMAIN
export MERCURY_TOKEN=...
export MERCURY_TYPE=android                   # veya ios

ruby settings_test_pass.rb   # ✅ Ayarlar → "Genel" → doğrula → PASS (exit 0)
ruby settings_test_fail.rb   # ❌ olmayan menü → element bulunamaz → FAIL (exit 1)
```

- **Pass senaryosu**: Ayarlar uygulamasını açar; iOS'ta "General/Genel" hücresine tıklayıp ekranı doğrular, Android'de Ayarlar'ın önde olduğunu doğrulayıp ilk ayar satırına tıklar.
- **Fail senaryosu**: Ayarlar'ı açtıktan sonra kasıtlı olarak var olmayan bir menü öğesi arar; `NoSuchElementError` ile düşer, script `exit 1` ile biter (CI kırmızı), ama cihaz `ensure` bloğu sayesinde **yine de bırakılır** ve Builds'de koşum kapanır.
- İki test de rezervasyon/bırakma işini [appium_session.rb](./appium_session.rb) yardımcısına bırakır — kendi testlerini yazarken aynı kalıbı kopyalayabilirsin.

## Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
| --- | --- | --- |
| `MERCURY_BASE_URL` | evet | Farm adresi, örn. `https://YOUR_DOMAIN` |
| `MERCURY_TOKEN` | evet | Access token (**koda yazma**, secret olarak sakla) |
| `MERCURY_TYPE` | önerilir | `android` veya `ios`; verilmezse boştaki herhangi bir cihaz (diğer platform dahil) seçilebilir |
| `MERCURY_SERIALS` | hayır | Belirli cihazlar için virgüllü serial listesi; filtrelerden önceliklidir |
| `MERCURY_AMOUNT` | hayır | Cihaz sayısı (parallel_run, varsayılan 2; admin olmayanlar en fazla 2) |
| `MERCURY_TIMEOUT` | hayır | Rezervasyon süresi sn (varsayılan: tekli 600, paralel 900) |
| `MERCURY_RUN` | hayır | Builds sayfasında görünen koşum adı (varsayılan: zaman damgalı) |
| `CI_JOB_URL` | hayır | Builds'de koşum adını tıklanabilir yapar |
| `MERCURY_HOLD_SECONDS` | hayır | Örnekteki test-yeri bekleme süresi (varsayılan 30) |
| `APPIUM_URL` | hayır | Appium server adresi (varsayılan `http://127.0.0.1:4723`; merkezi Appium'da `http://FARM_HOST:4723`) |

## Akış / Workflow

### Genel Mimari (High Level)

```
┌──────────────────────────┐
│   CI runner / Laptop     │
│  (your test machine)     │
│                          │
│  1. ruby script starts   │
│  2. calls Mercury API    │
│  3. runs Appium locally  │  ← Topoloji A (önerilen)
│  4. adb connect / WDA    │
│  5. runs tests           │
│  6. releases devices     │
└──────┬───────────────────┘
       │
       │ HTTP(S)
       ▼
┌──────────────────────────────┐
│    Mercury Farm              │
│  (device broker)             │
│                              │
│  • Reserve group (API call)  │
│  • Watch on Builds page      │
│  • Release group (API call)  │
└──────┬──────────────────────┘
       │
       │ adb connect / WDA over network
       ▼
┌──────────────────────────────┐
│   Real Android/iOS Devices   │
│   (on USB or network)        │
│                              │
│  Connected to providers      │
│  (android-provider,          │
│   ios-provider, etc)         │
└──────────────────────────────┘
```

---

### Adım Adım Akış (Step-by-Step) — Tekli Koşum

```
┌─────────────────────────────────────────────────────────┐
│ single_run.rb çalışmaya başlıyor                        │
│ (CI runner veya laptop'ta)                              │
└─────────────────────┬───────────────────────────────────┘

                      ↓

1️⃣  RESERVE — Cihaz Ayır
    ┌────────────────────────────────────────────────────┐
    │ GET /api/v1/autotests?run=my-run&type=android...  │
    │ → Mercury                                           │
    └────────────────────────┬─────────────────────────┘
                             ↓
                      Mercury API:
                    • Cihaz pool'undan seç (filter)
                    • Grubu oluştur
                    • Builds sayfasında "Running" göster
                             │
                             ↓
    ┌────────────────────────────────────────────────────┐
    │ Yanıt: group_id + devices[] + remoteConnectUrl    │
    │ (Bu bilgiler 600 sn (varsayılan) geçerli)         │
    └────────────────────────┬─────────────────────────┘

                      ↓

2️⃣  USE_DEVICE — Cihazı Automation Moduna Al
    ┌────────────────────────────────────────────────────┐
    │ POST /api/v1/autotests/useDevice                   │
    │ body: { serial: "R58M42ABCDE" }                    │
    │ → Mercury                                           │
    └────────────────────────┬─────────────────────────┘
                             ↓
                      Mercury API:
                    • Cihaz ownership'i al
                    • Remote connect URL hazırla
                             │
                             ↓
    ┌────────────────────────────────────────────────────┐
    │ Yanıt: remoteConnectUrl = 172.28.1.100:5037       │
    │ (Android) veya WDA url (iOS)                       │
    └────────────────────────┬─────────────────────────┘

                      ↓

3️⃣  CONNECT & APPIUM — Appium Başlat ve Cihaza Bağlan
    
    ▶ TOPOLOJI A (Local Appium — ÖNERILEN)
    ┌────────────────────────────────────────────────────┐
    │ bash: adb connect 172.28.1.100:5037               │
    │       (runner makinasından çalışıyor)             │
    │                                                     │
    │ Appium session açıyoruz:                           │
    │  platformName: 'Android'                           │
    │  udid: '172.28.1.100:5037'  (adb connect'teki)    │
    │  automationName: 'UiAutomator2'                    │
    │                                                     │
    │ Appium ← runner makinasında                        │
    │         :4723'de çalışıyor                         │
    └────────────────────────┬─────────────────────────┘
                             ↓
                      Appium ↔ Device
                    (runner makinasından)

    ▶ TOPOLOJI B (Central Appium)
    ┌────────────────────────────────────────────────────┐
    │ bash: ssh user@farm "adb connect 172.28.1.100:..."│
    │       (runner'dan farm'a SSH)                      │
    │                                                     │
    │ Appium session açıyoruz:                           │
    │  url: http://farm:4723  (central Appium)          │
    │  udid: 172.28.1.100:5037                          │
    │                                                     │
    │ Appium ← farm sunucusunda                          │
    │         :4723'de çalışıyor                         │
    │                                                     │
    │ adb connect ← farm sunucusunda (çünkü             │
    │              Appium farm'da)                       │
    └────────────────────────┬─────────────────────────┘
                             ↓
                      Farm's Appium ↔ Device

                      ↓

4️⃣  TEST KOŞTUR
    ┌────────────────────────────────────────────────────┐
    │ driver.current_activity                            │
    │ driver.find_element(:id, "...").click              │
    │ ... testler koşuyor ...                            │
    │                                                     │
    │ Builds sayfasında CANLIM İZLEYEBİLİRSİN           │
    │ (cihaz ekranını video akışı ile)                   │
    └────────────────────────┬─────────────────────────┘

                      ↓

5️⃣  RELEASE — Cihaz Bırak
    ┌────────────────────────────────────────────────────┐
    │ DELETE /api/v1/autotests?group=GROUP_ID           │
    │ → Mercury                                           │
    │ (ensure bloğu içinde → her durumda çalışır!)      │
    └────────────────────────┬─────────────────────────┘
                             ↓
                      Mercury API:
                    • Grup kapat
                    • Cihaz serbest bırak
                    • Builds'de "Finished" göster
                             │
                             ↓
    ┌────────────────────────────────────────────────────┐
    │ Koşum tamamlandı — Builds'de geçmiş olarak kalır  │
    └────────────────────────────────────────────────────┘
```

---

### Çoklu (Paralel) Koşum — Fark Nedir?

`parallel_run.rb` ile farklılıklar:

1. **Reserve**: `amount=2` (vs tekli `amount=1`)
   ```
   GET /api/v1/autotests?run=...&amount=2&need_amount=true
   → Yanıt: group_id + 2 device
   ```

2. **Use Device**: Her cihaz için ayrı çağrı + Thread
   ```
   Thread 1: POST /api/v1/autotests/useDevice (serial A)
   Thread 2: POST /api/v1/autotests/useDevice (serial B)
   → Paralel HTTP istekleri
   ```

3. **adb connect**: Thread başına bir defa
   ```
   Thread 1: adb connect REMOTE_A
   Thread 2: adb connect REMOTE_B
   → Paralel komutlar
   ```

4. **Appium Session**: Her thread'de kendi session'ı
   ```
   Thread 1: driver_A = Appium::Core.for(udid: REMOTE_A).start_driver
   Thread 2: driver_B = Appium::Core.for(udid: REMOTE_B).start_driver
   → Testler paralel koşuyor
   ```

5. **Release**: Grup tek çağrıyla — tüm cihazlar bırakılır
   ```
   DELETE /api/v1/autotests?group=GROUP_ID
   → Tüm cihazlar serbest
   ```

---

### Appium'un Rolü

| Konu | Appium'un rolü | Mercury'nin rolü |
|------|---|---|
| **Cihaz bağlantısı** | Cihaza WebDriver protocol üstünden komut gönderiyor | Cihazları ağda erişilebilir hale getiriyor (adb/WDA) |
| **adb connect** | Appium'un makinasında çalıştırılıyor → remote:port adresi | Adres sağlıyor (API yanıtında `remoteConnectUrl`) |
| **WDA (iOS)** | Appium'a WDA URL'sini geçiyoruz | WDA sunucusuna dış ağdan erişim sağlıyor |
| **Test yürütme** | Appium testlerin komutlarını cihaza çeviriyor | İlgilenmez (test'ten sonra dönüyor) |
| **Lifecycle** | Test başında start, sonunda quit | Rezervasyon başında oluşur, release'te silinir |

---

### Gerçek Komut Örneği

```bash
# Topoloji A (Appium lokal — çoğu kişi bunu kullanır)
export MERCURY_BASE_URL=https://farm.example.com
export MERCURY_TOKEN=abc123...
export MERCURY_TYPE=android
export APPIUM_URL=http://127.0.0.1:4723  # Bu makinada Appium çalışacak

# Appium'u arka planda başlat
appium --address 127.0.0.1 --port 4723 &

# Testini koştur
ruby single_run.rb

# Log örneği:
# Reserved device: R58M42ABCDE (Pixel 6 / 13) — group=abc-group-123
# remoteConnectUrl: 172.28.1.100:5037
# [Appium bağlantısı]
# [Testler koşuyor...]
# Released group: abc-group-123
```

```bash
# Topoloji B (Appium merkezi — farm sunucusunda)
export MERCURY_BASE_URL=https://farm.example.com
export MERCURY_TOKEN=abc123...
export MERCURY_TYPE=android
export APPIUM_URL=http://farm.example.com:4723  # Farm sunucusunda Appium
export APPIUM_HOST_SSH=user@farm.example.com    # adb connect farm'da çalışacak

# (Appium farm'da önceden başlatılmış — sudo systemctl start appium)

# Testini koştur
ruby single_run.rb

# Kodu içinden:
#   1. adb connect komutu SSH üstünden farm'a gidiyor
#   2. Appium URL'si farm'daki Appium'a işaret ediyor
#   3. Geri kalan flow aynı
```

---

1. `reserve` → grup oluşur, **Builds** sayfasında `Running` görünür (yanıttaki `group_id`'yi sakla)
2. `use_device(serial)` → `remoteConnectUrl` (Android: `adb connect`, iOS: `appium:webDriverAgentUrl`)
3. Testlerini Appium ile koştur (`adb connect` **Appium'un çalıştığı makinede** yapılmalı)
4. `release(group_id)` → her zaman `ensure` içinde; koşum `Finished` olur

---

No extra gems required for reserve/release — plain Ruby stdlib. `single_run.rb`
reserves one device (single run), `parallel_run.rb` reserves N devices in one
group and drives them in parallel threads (multi-device run).
`settings_test_pass.rb` / `settings_test_fail.rb` are end-to-end Appium example
scenarios (passing and intentionally failing — the device is always released).
Configure via the environment variables above; see
[docs/automation-api.md](../../docs/automation-api.md) for the full API reference.
