# Mercury Device Farm — Mimari Dokümanı

> **Versiyon:** 1.5.0  
> **Platform:** macOS (iOS otomasyon için Xcode gerektiğinden macOS'a optimize)  
> **Lisans:** Apache-2.0

---

## İçindekiler

1. [Genel Bakış](#1-genel-bakış)
2. [Yüksek Seviye Mimari](#2-yüksek-seviye-mimari)
3. [Teknoloji Yığını (Tech Stack)](#3-teknoloji-yığını-tech-stack)
4. [Backend Mimarisi](#4-backend-mimarisi)
   - 4.1 [Microservice Yapısı (CLI Tabanlı)](#41-microservice-yapısı-cli-tabanlı)
   - 4.2 [Servis Kataloğu](#42-servis-kataloğu)
   - 4.3 [Mesajlaşma Katmanı (ZeroMQ + Protocol Buffers)](#43-mesajlaşma-katmanı-zeromq--protocol-buffers)
   - 4.4 [Veritabanı Katmanı (MongoDB)](#44-veritabanı-katmanı-mongodb)
   - 4.5 [Kimlik Doğrulama (Auth)](#45-kimlik-doğrulama-auth)
   - 4.6 [REST API](#46-rest-api)
   - 4.7 [WebSocket Sunucusu](#47-websocket-sunucusu)
5. [Frontend Mimarisi](#5-frontend-mimarisi)
   - 5.1 [Uygulama Giriş Noktası ve Provider Zinciri](#51-uygulama-giriş-noktası-ve-provider-zinciri)
   - 5.2 [Routing (Yönlendirme)](#52-routing-yönlendirme)
   - 5.3 [State Management (Durum Yönetimi)](#53-state-management-durum-yönetimi)
   - 5.4 [Dependency Injection (InversifyJS)](#54-dependency-injection-inversifyjs)
   - 5.5 [API Katmanı](#55-api-katmanı)
   - 5.6 [Bileşen Organizasyonu](#56-bileşen-organizasyonu)
   - 5.7 [Uluslararasılaştırma (i18n)](#57-uluslararasılaştırma-i18n)
6. [Cihaz Yaşam Döngüsü](#6-cihaz-yaşam-döngüsü)
   - 6.1 [Android Cihaz Akışı](#61-android-cihaz-akışı)
   - 6.2 [iOS Cihaz Akışı](#62-ios-cihaz-akışı)
   - 6.3 [Ekran Streaming Mimarisi](#63-ekran-streaming-mimarisi)
   - 6.4 [Reaper (Temizleyici) Mekanizması](#64-reaper-temizleyici-mekanizması)
7. [Altyapı ve Deployment](#7-altyapı-ve-deployment)
   - 7.1 [Docker Compose Topolojisi](#71-docker-compose-topolojisi)
   - 7.2 [Nginx Reverse Proxy](#72-nginx-reverse-proxy)
   - 7.3 [SSL/TLS](#73-ssltls)
   - 7.4 [Ağ Topolojisi](#74-ağ-topolojisi)
8. [Wire Protokolü (Mesaj Tipleri)](#8-wire-protokolü-mesaj-tipleri)
9. [Dizin Yapısı](#9-dizin-yapısı)
10. [Güvenlik Mimarisi](#10-güvenlik-mimarisi)

---

## 1. Genel Bakış

Mercury Device Farm, gerçek Android ve iOS cihazları tarayıcı üzerinden uzaktan kontrol etmeye olanak tanıyan bir **cihaz çiftliği (device farm)** platformudur. Kullanıcılar web arayüzü üzerinden cihazları görebilir, rezerve edebilir, ekranlarını canlı olarak izleyebilir, dokunmatik girdiler gönderebilir, uygulama yükleyebilir ve ADB/shell komutları çalıştırabilir.

### Temel Yetenekler

| Yetenek | Açıklama |
|---------|----------|
| **Gerçek Zamanlı Ekran Streaming** | Android (Minicap/Scrcpy) ve iOS (WebDriverAgent MJPEG) ile canlı ekran aktarımı |
| **Uzaktan Dokunmatik Kontrol** | Tarayıcıdan dokunma, kaydırma, yazma gibi girdiler |
| **Uygulama Yönetimi** | APK/IPA yükleme, kaldırma, uygulama listeleme |
| **Grup & Takım Yönetimi** | Cihazları gruplara ayırma, zamanlama, kullanıcı/takım bazlı erişim |
| **Çoklu Auth Desteği** | Mock, LDAP, OAuth2, OpenID Connect, SAML2 |
| **Dosya Sistemi Erişimi** | Cihaz dosya gezgini (push/pull) |
| **Shell Erişimi** | Uzaktan ADB/shell komut çalıştırma |
| **Logcat Streaming** | Android logcat çıktısını gerçek zamanlı izleme |
| **Tizen TV Desteği** | Samsung Smart TV desteği |
| **VNC Desteği** | VNC üzerinden cihaz bağlantısı |

---

## 2. Yüksek Seviye Mimari

```
┌─────────────────────────────────────────────────────────────────────┐
│                        KULLANICI (Tarayıcı)                        │
│                                                                     │
│  React 18 + MobX + InversifyJS + TanStack Query + Socket.IO Client │
└────────┬─────────────────┬──────────────────────┬──────────────────┘
         │ HTTPS            │ WSS (Socket.IO)       │ WSS (Binary Stream)
         ▼                  ▼                        ▼
┌────────────────────────────────────────────────────────────────────┐
│                      NGINX (Reverse Proxy)                         │
│           :443 (HTTPS) / :80 (HTTP redirect)                       │
│  ┌──────────┬──────────┬──────────────┬─────────────────────────┐  │
│  │ /app/*    │ /api/v1/*│ /socket.io/* │ /d/provider/PORT/*      │  │
│  └────┬─────┴────┬─────┴──────┬───────┴─────────┬───────────────┘  │
└───────┼──────────┼────────────┼─────────────────┼──────────────────┘
        ▼          ▼            ▼                  ▼
┌───────────┐ ┌────────┐ ┌──────────┐    ┌──────────────┐
│  App:3000 │ │API:3000│ │WebSocket │    │  Provider    │
│ (Static)  │ │(REST)  │ │  :3000   │    │ (Device Mgr) │
└───────────┘ └───┬────┘ └────┬─────┘    └──────┬───────┘
                  │            │                  │
         ┌────────┴────────────┴──────────────────┘
         ▼
┌────────────────────────────────────────────────────────────────┐
│               ZeroMQ Message Bus (TriProxy)                     │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │  TriProxy-App        │    │  TriProxy-Dev        │            │
│  │  PUB  :7150          │    │  PUB  :7250          │            │
│  │  DEALER :7160        │    │  DEALER :7260        │            │
│  │  PULL :7170          │    │  PULL :7270          │            │
│  └─────────┬───────────┘    └─────────┬───────────┘            │
└────────────┼──────────────────────────┼────────────────────────┘
             ▼                          ▼
┌──────────────────┐  ┌──────────────────────────────────────────┐
│    Processor     │  │           Device Workers                  │
│ (Message Router) │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│                  │  │  │ Device-1 │ │ Device-2 │ │ Device-N │ │
│  App ↔ Device    │  │  │ (Android)│ │  (iOS)   │ │ (Tizen)  │ │
│  Bridge          │  │  └──────────┘ └──────────┘ └──────────┘ │
└────────┬─────────┘  └─────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐   ┌────────────┐   ┌──────────────┐
│    MongoDB 7.0   │   │   Reaper   │   │Groups Engine │
│  (Replica Set)   │   │ (Heartbeat │   │ (Scheduling) │
│                  │   │  Monitor)  │   │              │
└──────────────────┘   └────────────┘   └──────────────┘
```

---

## 3. Teknoloji Yığını (Tech Stack)

### Backend

| Kategori | Teknoloji | Versiyon | Kullanım Amacı |
|----------|-----------|----------|----------------|
| **Runtime** | Node.js | 22.18.0 | Sunucu çalışma ortamı |
| **Dil** | TypeScript + JavaScript | 5.9.x | Tip güvenli geliştirme |
| **HTTP Framework** | Express.js | 4.21.2 | REST API ve statik dosya sunumu |
| **Veritabanı** | MongoDB | 7.0 | Belge tabanlı veri depolama (Replica Set) |
| **Mesajlaşma** | ZeroMQ | 6.4.2 | Servisler arası asenkron mesajlaşma |
| **Serileştirme** | Protocol Buffers | protobuf-ts | İkili mesaj serileştirme |
| **WebSocket** | Socket.IO | 4.7.5 | Gerçek zamanlı istemci-sunucu iletişimi |
| **WebSocket (Ham)** | ws | 5.2.4 | İkili ekran streaming |
| **Kimlik Doğrulama** | Passport.js | 0.6.0 | Çoklu auth stratejileri |
| **JWT** | jws | 3.2.2 | Token tabanlı yetkilendirme |
| **Cihaz İletişimi** | @u4/adbkit | 5.1.7 | Android ADB protokolü |
| **iOS Otomasyon** | WebDriverAgent (Appium) | 11.4.0 | iOS cihaz kontrolü |
| **Tizen** | appium-sdb | 1.0.1-beta | Samsung Tizen desteği |
| **USB (iOS)** | @irdk/usbmux | 0.2.2 | iOS USB multiplexing |
| **Ekran Yakalama** | minicap-prebuilt | 1.1.2 | Android ekran yakalama |
| **Dokunma Girdisi** | minitouch-prebuilt | 1.3.0 | Android dokunma simülasyonu |
| **Dosya Depolama** | @aws-sdk/client-s3 | 3.772.x | S3 uyumlu nesne depolama |
| **Hata İzleme** | @sentry/node | 8.34.x | Hata raporlama ve izleme |
| **CLI Framework** | yargs | 17.7.2 | Komut satırı arayüzü |
| **API Dokümantasyonu** | swagger-ui-express + express-openapi | — | OpenAPI/Swagger |
| **Rate Limiting** | express-rate-limit | 7.3.1 | API istek hız sınırlama |
| **Serialport** | serialport | 13.0.0 | Seri port iletişimi (ESP32 vb.) |
| **VNC** | rfb2 | 0.2.2 | VNC protokol desteği |
| **LDAP** | ldapjs | 1.0.2 | LDAP dizin entegrasyonu |

### Frontend

| Kategori | Teknoloji | Versiyon | Kullanım Amacı |
|----------|-----------|----------|----------------|
| **UI Framework** | React | 18.3.1 | Bileşen tabanlı kullanıcı arayüzü |
| **Build Tool** | Vite | 6.4.x | Hızlı geliştirme ve derleme |
| **Transpiler** | SWC (via @vitejs/plugin-react-swc) | — | Hızlı TypeScript/JSX dönüşümü |
| **Dil** | TypeScript | 5.5.x | Tip güvenli frontend geliştirme |
| **State Management** | MobX | 6.13.5 | Reaktif durum yönetimi |
| **State Persistence** | mobx-persist-store | 1.1.5 | MobX state'i localStorage'a kaydetme |
| **Server State** | TanStack React Query | 5.59.x | API veri yönetimi, cache, retry |
| **Tablo** | TanStack React Table | 8.20.5 | Gelişmiş tablo bileşenleri |
| **Virtualization** | TanStack React Virtual | 3.10.8 | Büyük listelerde sanal kaydırma |
| **DI Container** | InversifyJS | 6.2.1 | Bağımlılık enjeksiyonu |
| **Routing** | React Router | 7.0.2 | Hash tabanlı sayfa yönlendirme |
| **UI Kit** | VKUI (VKontakte) | 7.1.2 | Temel UI bileşen kütüphanesi |
| **HTTP Client** | Axios | 1.12.0 | REST API istekleri |
| **WebSocket Client** | Socket.IO Client | 4.8.0 | Gerçek zamanlı iletişim |
| **i18n** | i18next + react-i18next | 23.x / 15.x | Çoklu dil desteği (EN, TR) |
| **Tarih** | date-fns | 4.1.0 | Tarih işlemleri |
| **Test** | Vitest + Testing Library | 3.0.x | Birim testleri |
| **Mock** | MSW (Mock Service Worker) | 2.6.0 | API mock'lama |
| **Kod Üretimi** | Orval | 7.3.0 | OpenAPI'den TypeScript tip üretimi |
| **Scaffolding** | Plop | 4.0.1 | Kod şablonu üretici |
| **Linting** | ESLint 9 + Prettier + Stylelint | — | Kod kalitesi |
| **SVG** | vite-plugin-svgr | 4.2.0 | SVG → React bileşen dönüşümü |

### Altyapı

| Kategori | Teknoloji | Kullanım Amacı |
|----------|-----------|----------------|
| **Konteynerizasyon** | Docker + Docker Compose | Servis orkestrasyonu |
| **Reverse Proxy** | Nginx (bookworm) | TLS sonlandırma, routing, WebSocket proxy |
| **SSL** | omgwtfssl (self-signed) | Otomatik self-signed sertifika üretimi |
| **Veritabanı** | MongoDB 7.0 (Replica Set) | Change Streams desteği için RS |

---

## 4. Backend Mimarisi

### 4.1 Microservice Yapısı (CLI Tabanlı)

Mercury'nin backend'i **tek bir monorepo** içinde yaşayan ancak **bağımsız süreçler** olarak çalıştırılan bir mikroservis mimarisi kullanır. Her servis `mercury <komut>` CLI komutuyla başlatılır:

```bash
mercury api --port 3000 --secret=xxx
mercury app --port 3000 --auth-url https://...
mercury provider --adb-host 127.0.0.1 --connect-sub tcp://...
```

Bu yaklaşım **yargs** CLI framework'ü ile gerçekleştirilir. Her komut modülü dışa aktarır:
- `command` — Komut adı
- `describe` — Açıklama
- `builder` — CLI argümanları tanımı
- `handler` — Çalışma fonksiyonu

Tüm servisler aynı Docker imajını kullanır (farklı `command` ile başlatılır), bu da dağıtımı basitleştirir.

### 4.2 Servis Kataloğu

```
┌─────────────────────────────────────────────────────────────┐
│                     CORE SERVİSLER                          │
├─────────────────┬───────────────────────────────────────────┤
│ app             │ React SPA statik dosya sunucusu            │
│ api             │ REST API (Express + OpenAPI/Swagger)        │
│ auth-*          │ Kimlik doğrulama (5 strateji)              │
│ websocket       │ Socket.IO gerçek zamanlı event sunucusu    │
│ processor       │ Merkezi mesaj yönlendirici (App ↔ Device)  │
├─────────────────┼───────────────────────────────────────────┤
│                     CİHAZ SERVİSLERİ                        │
├─────────────────┼───────────────────────────────────────────┤
│ provider        │ Android cihaz sağlayıcı (worker yönetimi)  │
│ ios-provider    │ iOS cihaz sağlayıcı (host üzerinde çalışır)│
│ device          │ Android cihaz worker süreci                 │
│ ios-device      │ iOS cihaz worker süreci                     │
│ tizen-device    │ Tizen TV cihaz desteği                      │
│ vnc-device      │ VNC cihaz desteği                           │
├─────────────────┼───────────────────────────────────────────┤
│                     ALTYAPI SERVİSLERİ                      │
├─────────────────┼───────────────────────────────────────────┤
│ triproxy        │ ZeroMQ mesaj broker (PUB/DEALER/PULL)      │
│ reaper          │ Heartbeat izleme & cihaz temizleyici        │
│ groups-engine   │ Grup zamanlama & yaşam döngüsü              │
│ poorxy          │ HTTP proxy                                  │
├─────────────────┼───────────────────────────────────────────┤
│                     DEPOLAMA SERVİSLERİ                     │
├─────────────────┼───────────────────────────────────────────┤
│ storage-temp    │ Geçici dosya depolama                       │
│ storage-plugin-apk   │ APK yükleme işleme                    │
│ storage-plugin-image │ Görüntü işleme                        │
│ storage-s3      │ AWS S3 uyumlu depolama                      │
├─────────────────┼───────────────────────────────────────────┤
│                     VERİ YÖNETİMİ                           │
├─────────────────┼───────────────────────────────────────────┤
│ migrate         │ Veritabanı şema göçü                        │
│ migrate-to-mongo│ RethinkDB → MongoDB göç aracı              │
│ log-mongodb     │ MongoDB log yazıcı                          │
├─────────────────┼───────────────────────────────────────────┤
│                     YARDIMCI ARAÇLAR                         │
├─────────────────┼───────────────────────────────────────────┤
│ doctor          │ Sistem sağlık denetleyici                   │
│ generate-fake-* │ Test verisi üretici (device/user/group)     │
│ generate-service-user │ Servis hesabı oluşturucu              │
│ local           │ Tüm servisleri tek süreçte çalıştırma       │
└─────────────────┴───────────────────────────────────────────┘
```

### 4.3 Mesajlaşma Katmanı (ZeroMQ + Protocol Buffers)

Mercury, servisler arası iletişim için **ZeroMQ** mesaj kuyruğu sistemi kullanır. İki ayrı **TriProxy** örneği mesaj yönlendirmesini sağlar:

#### TriProxy Mimarisi

```
                     APP TARAFI                          CİHAZ TARAFI
              ┌─────────────────────┐            ┌─────────────────────┐
              │   TriProxy-App      │            │   TriProxy-Dev      │
              │                     │            │                     │
  Abone ol ←──│ PUB    :7150        │            │ PUB    :7250  ──→ Abone ol
              │                     │            │                     │
  İstek/Cevap─│ DEALER :7160        │            │ DEALER :7260 ─İstek/Cevap
              │                     │            │                     │
  Mesaj gönder│ PULL   :7170        │            │ PULL   :7270 ─Mesaj gönder
              └─────────────────────┘            └─────────────────────┘
                      ▲                                   ▲
                      │                                   │
         ┌────────────┼────────────────────────────────────┤
         │            │                                    │
    ┌────┴────┐  ┌────┴────┐  ┌──────────┐  ┌─────────────┴──┐
    │   API   │  │Websocket│  │Processor │  │  Device Workers │
    │         │  │         │  │(Bridge)  │  │  (Android/iOS)  │
    └─────────┘  └─────────┘  └──────────┘  └────────────────┘
```

#### ZeroMQ Soket Desenleri

| Desen | Kullanım |
|-------|----------|
| **PUB/SUB** | Broadcast mesajlar (cihaz durumu, kullanıcı değişiklikleri) |
| **PUSH/PULL** | Garantili tek yönlü mesaj iletimi |
| **DEALER** | İstek-cevap bazlı iletişim |

#### Protocol Buffers Zarf Yapısı

Tüm mesajlar bir `Envelope` içine sarılır:

```protobuf
message Envelope {
    required google.protobuf.Any message = 2;
    optional string channel = 3;
}
```

`channel` alanı mesajın hedef kanalını belirler (bir cihaza, kullanıcıya veya genel kanala).

### 4.4 Veritabanı Katmanı (MongoDB)

#### Bağlantı Konfigürasyonu

- **Veritabanı:** `mercury` (varsayılan, `MONGODB_DB_NAME` ile değiştirilebilir)  
- **Bağlantı:** `MONGODB_PORT_27017_TCP` env değişkeni veya `mongodb://127.0.0.1:27017`  
- **Replica Set:** `mercury-rs` (Change Streams için zorunlu)

#### Koleksiyon Yapısı

| Koleksiyon | Birincil Anahtar | Açıklama |
|------------|------------------|----------|
| `users` | `email` | Kullanıcı profilleri ve ayarları |
| `devices` | `serial` | Cihaz durumları ve meta verileri |
| `groups` | `id` | Cihaz grupları ve zamanlama |
| `teams` | — | Takım yapıları |
| `accessTokens` | `id` | API erişim token'ları |
| `vncauth` | `password` | VNC kimlik doğrulama |
| `logs` | `id` | Sistem logları |
| `stats` | `id` | İstatistikler |

#### Change Streams

MongoDB'nin **Change Stream** özelliği, koleksiyon değişikliklerini gerçek zamanlı izlemek için kullanılır. `ChangeStreamPreAndPostImages` etkin olarak koleksiyonlar oluşturulur:

- **GroupChangeHandler** → Grup değişikliklerini dinler, ZMQ üzerinden yayınlar
- **UserChangeHandler** → Kullanıcı değişikliklerini dinler, ZMQ üzerinden yayınlar

Bu sayede veritabanı değişiklikleri otomatik olarak tüm bağlı istemcilere iletilir.

#### Model Katmanı

```
lib/db/
├── index.ts           ← MongoDB bağlantı ve ZMQ soket yönetimi
├── api.ts             ← Tüm modelleri birleştiren API
├── setup.ts           ← Koleksiyon ve index oluşturma
├── tables.ts          ← Koleksiyon tanımları
├── models/
│   ├── all/           ← Tüm entity'leri birleştiren model
│   ├── device/        ← Cihaz CRUD ve durum sorguları
│   ├── group/         ← Grup yönetimi sorguları
│   ├── team/          ← Takım yönetimi
│   └── user/          ← Kullanıcı yönetimi
└── handlers/
    ├── group/         ← MongoDB Change Stream dinleyici
    └── user/          ← MongoDB Change Stream dinleyici
```

### 4.5 Kimlik Doğrulama (Auth)

Mercury 5 farklı kimlik doğrulama stratejisi destekler:

| Strateji | CLI Komutu | Kullanım |
|----------|-----------|----------|
| **Mock** | `auth-mock` | Geliştirme/test ortamı (form tabanlı) |
| **LDAP** | `auth-ldap` | Kurumsal dizin entegrasyonu |
| **OAuth2** | `auth-oauth2` | Üçüncü taraf OAuth2 sağlayıcılar |
| **OpenID Connect** | `auth-openid` | OpenID Connect protokolü |
| **SAML2** | `auth-saml2` | Kurumsal SAML2 SSO |

Kimlik doğrulama akışı:
1. Kullanıcı auth sayfasına yönlendirilir
2. Seçili strateji ile kimlik doğrulanır
3. **JWT token** üretilir ve istemciye döndürülür
4. Token `Authorization: Bearer <token>` header'ı ile API isteklerinde kullanılır
5. WebSocket bağlantılarında token subprotocol olarak iletilir: `access_token.${token}`

### 4.6 REST API

- **Framework:** Express.js
- **Dokümantasyon:** OpenAPI/Swagger (`/api/v1/docs`)
- **Kimlik Doğrulama:** JWT tabanlı `accessTokenAuth` middleware
- **Rate Limiting:** `express-rate-limit` ile istek hız sınırlaması
- **Hata İzleme:** Sentry entegrasyonu

Temel endpoint grupları:
- `/api/v1/devices` — Cihaz listeleme, detay, durum güncelleme
- `/api/v1/groups` — Grup CRUD, cihaz/kullanıcı ataması
- `/api/v1/teams` — Takım yönetimi
- `/api/v1/users` — Kullanıcı yönetimi, admin yetkilendirme
- `/api/v1/user` — Mevcut kullanıcı profili, access token'lar

### 4.7 WebSocket Sunucusu

Socket.IO tabanlı gerçek zamanlı iletişim sunucusu:

- **Cookie-Session** ile kimlik doğrulama
- **Kanal tabanlı abonelik** sistemi (ZMQ mesajlarına abone olma)
- Yayınlanan event'ler:
  - `device.change` — Cihaz durumu değişiklikleri
  - `user.change` — Kullanıcı değişiklikleri
  - `group.change` — Grup değişiklikleri
  - `logcat.entry` — Logcat satırları
  - `tx.progress` / `tx.done` — İşlem ilerleme durumu

---

## 5. Frontend Mimarisi

> Web arayuzu (UI) **tescilli/private**'dir ve `ui/` altinda git submodule olarak
> baglanan private `mercury-ui` reposunda bulunur. Public repo UI kaynagini
> icermez; hazir Docker imaji derlenmis UI'yi zaten barindirir.

### 5.1 Uygulama Giriş Noktası ve Provider Zinciri

Uygulama `main.tsx` → `createRootWithProviders()` ile başlar:

```
<StrictMode>
  <QueryClientProvider>              ← TanStack React Query
    <DIContainerProvider>            ← InversifyJS Container
      <AppWrapper>                   ← VKUI Theme Provider
        <ReactQueryDevtools />       ← Geliştirici aracı
        <App />                      ← Ana uygulama
      </AppWrapper>
    </DIContainerProvider>
  </QueryClientProvider>
</StrictMode>
```

### 5.2 Routing (Yönlendirme)

**Hash Router** kullanılır (`#/devices`, `#/control/:serial`):

| Route | Sayfa | Açıklama |
|-------|-------|----------|
| `/` ve `/devices` | DevicesPage | Cihaz listesi, arama, istatistikler |
| `/control/:serial` | ControlPage | Cihaz uzaktan kontrol (ekran + panel) |
| `/control/:serial/info` | ControlPage (info) | Cihaz detay bilgileri |
| `/settings` | SettingsPage | Yönetim paneli |
| `/settings/keys` | SettingsPage | ADB anahtar yönetimi |
| `/settings/groups` | SettingsPage | Grup yönetimi |
| `/settings/teams` | SettingsPage | Takım yönetimi |
| `/settings/devices` | SettingsPage | Cihaz ayarları |
| `/settings/users` | SettingsPage | Kullanıcı yönetimi |
| `/settings/shell` | SettingsPage | Shell erişimi |
| `/groups` | GroupsPage | Grup görüntüleme |

Tüm route'lar `<RequireAuth />` guard bileşeniyle korunur.

### 5.3 State Management (Durum Yönetimi)

Mercury UI **hibrit** bir durum yönetimi yaklaşımı kullanır:

#### MobX (İstemci Durumu)

| Store | Kapsam | Sorumluluk |
|-------|--------|------------|
| `AuthStore` | Global (Singleton) | JWT yönetimi, localStorage persistence |
| `DeviceListStore` | Global | Socket.IO ile gerçek zamanlı cihaz listesi |
| `CurrentUserProfileStore` | Global | Oturum açmış kullanıcı bilgisi |
| `GlobalToastStore` | Global | Hata bildirimleri |
| `DeviceScreenStore` | Cihaz başına | H.264 WebSocket stream, canvas rendering |
| `DeviceControlStore` | Cihaz başına | Cihaz komutları, kalite ayarı |
| `DeviceConnection` | Cihaz başına | Cihaz yaşam döngüsü (bağlanma/kopma) |
| `ShellControlStore` | Cihaz başına | Shell komut geçmişi |

#### TanStack React Query (Sunucu Durumu)

- **MobxQuery** wrapper'ı React Query'yi MobX atom'ları ile sarar
- **MobxMutation** wrapper'ı mutation'ları MobX `runInAction` ile entegre eder
- Query key factory ile tip-güvenli sorgu anahtarları
- Retry stratejisi: Üretimde 6 deneme, üstel geri çekilme (1s → 30s max)

### 5.4 Dependency Injection (InversifyJS)

İki seviyeli DI container mimarisi:

```
┌──────────────────────────────────────────┐
│         Global Container (Singleton)      │
│                                           │
│  • DeviceListStore                        │
│  • GroupService                           │
│  • SettingsService                        │
│  • AccessTokenService                     │
│  • CurrentUserProfileStore                │
│  • LogsTrackerService                     │
│  • Factory<MobxQuery>                     │
│  • Factory<MobxMutation>                  │
│  • Factory<TransactionService>            │
│                                           │
│  ┌────────────────────────────────────┐   │
│  │  Device Container (Cihaz Başına)   │   │
│  │  createDeviceContainer(serial)     │   │
│  │                                    │   │
│  │  • serial (constant value)         │   │
│  │  • DeviceScreenStore              │   │
│  │  • DeviceControlStore             │   │
│  │  • DeviceConnection               │   │
│  │  • TouchService                   │   │
│  │  • KeyboardService               │   │
│  │  • LogcatService                  │   │
│  │  • InfoService                    │   │
│  │  • ScalingService                 │   │
│  │  • ShellControlStore             │   │
│  │  • FileExplorerService           │   │
│  │  • ... (40+ servis)              │   │
│  └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

`@deviceConnectionRequired()` dekoratörü ile işaretlenen servisler yalnızca aktif cihaz bağlantısı olduğunda kullanılabilir.

### 5.5 API Katmanı

```
ui/src/api/
├── mercury-api/
│   ├── mercury-api-client.ts    ← Axios instance + interceptor'lar
│   ├── routes.ts                ← Endpoint yol tanımları
│   ├── index.ts                 ← API fonksiyonları (getDevices, getUsers, vb.)
│   └── types.ts                 ← İstek/cevap tipleri
├── auth/
│   ├── auth-client.ts           ← Auth API istekleri
│   └── routes.ts                ← Auth endpoint'leri
├── socket.ts                    ← Socket.IO istemci konfigürasyonu
└── interceptors.ts              ← Token ekleme, 401 yönlendirme, hata çıkarma
```

**Interceptor Zinciri:**
1. **Request:** `attachTokenOnRequest` → JWT token'ı header'a ekler
2. **Response (hata):** `logoutOnErrorResponse` → 401'de auth sayfasına yönlendir
3. **Response (hata):** `extractMessageOnErrorResponse` → Hata mesajını toast'a gönder

**Orval ile Tip Üretimi:** Backend'in OpenAPI spec'inden (`lib/units/api/swagger/api_v1.yaml`) otomatik TypeScript tipleri üretilir → `src/generated/types/`

### 5.6 Bileşen Organizasyonu

```
ui/src/components/
├── app/                         ← Ana uygulama kabuğu
│   ├── app.tsx                  ← Router entegrasyonu
│   ├── app-router/              ← Route tanımları + auth guard
│   └── providers/               ← Tema sağlayıcı
│
├── views/ (Sayfa Bileşenleri)
│   ├── devices-page/            ← Cihaz listesi + istatistik
│   ├── control-page/            ← Uzaktan kontrol (ekran + panel split)
│   ├── settings-page/           ← Yönetim sayfası (6 sekme)
│   ├── groups-page/             ← Grup yönetimi
│   └── auth/                    ← Auth sayfaları (LDAP, Mock)
│
├── ui/ (Yeniden Kullanılabilir Bileşenler)
│   ├── device/                  ← Cihaz gösterimi
│   │   ├── device-screen/       ← Canvas + WebSocket streaming
│   │   ├── device-top-bar/      ← Cihaz bilgi başlığı
│   │   └── device-navigation-buttons/
│   ├── device-control-panel/    ← Kontrol paneli
│   │   └── tabs/
│   │       ├── dashboard-tab/   ← Cihaz durumu
│   │       ├── info-tab/        ← Detay bilgileri
│   │       ├── logs-tab/        ← Logcat
│   │       ├── advanced-tab/    ← İleri komutlar
│   │       └── file-explorer-tab/  ← Dosya gezgini
│   ├── device-cards/            ← Kart görünümü
│   ├── device-table/            ← Tablo görünümü
│   ├── device-statistics/       ← Özet kartları
│   ├── settings-tabs/           ← Keys, Groups, Teams, Users, Devices, Shell sekmeleri
│   ├── header/                  ← Üst menü
│   ├── search-device/           ← Cihaz arama
│   └── modals/                  ← Modal diyaloglar
│
└── lib/ (Altyapı Bileşenleri)
    ├── conditional-render/      ← Koşullu render
    ├── base-modal/              ← Modal temel bileşeni
    ├── base-select/             ← Select temel bileşeni
    ├── error-fallback/          ← Hata sınır bileşeni
    ├── tabs-panel/              ← Sekme paneli
    └── ... (25+ temel bileşen)
```

### 5.7 Uluslararasılaştırma (i18n)

- **Desteklenen Diller:** İngilizce (en), Türkçe (tr)
- **Kütüphane:** i18next + react-i18next + i18next-browser-languagedetector
- **Çeviri Yükleme:** HTTP backend ile `/locales/{lang}.json` dosyalarından
- **Dil Algılama Sırası:** localStorage → cookie → varsayılan (en)

---

## 6. Cihaz Yaşam Döngüsü

### 6.1 Android Cihaz Akışı

```
ADB Bağlantısı Algılama
        │
        ▼
┌─────────────────┐
│   Provider       │  ADBObserver ile USB/ADB bağlantısı izlenir
│   (ProcessMgr)   │  Port çifti ayrılır (ResourcePool)
└────────┬────────┘
         │ fork()
         ▼
┌─────────────────┐
│  Device Worker   │  25 plugin yüklenir (syrup dependency injection)
│  (Android)       │
│                  │  Pluginler:
│  • heartbeat     │  - 10s aralıkla heartbeat gönderir
│  • stream        │  - Minicap/Scrcpy ekran yakalama
│  • touch         │  - Minitouch girdi simülasyonu
│  • service       │  - STF Service APK yönetimi
│  • shell         │  - ADB shell erişimi
│  • install       │  - APK yükleme/kaldırma
│  • logcat        │  - Log streaming
│  • connect       │  - ADB bridge uzak bağlantı
│  • forward       │  - Port forwarding
│  • group         │  - Sahiplik/rezervasyon yönetimi
│  • solo          │  - Tekil cihaz kaydı
│  • ...           │
└────────┬────────┘
         │ DeviceIntroductionMessage
         ▼
┌─────────────────┐
│   Processor      │  Cihazı DB'ye kaydeder
│                  │  present: true, ready: false
└────────┬────────┘
         │ DevicePresentMessage (Reaper TTLSet)
         ▼
┌─────────────────┐
│   Reaper         │  TTLSet'e ekler (30s timeout)
│                  │  Heartbeat'leri izler
└────────┬────────┘
         │ DeviceReadyMessage (tüm pluginler hazır)
         ▼
    Cihaz KULLANIMA HAZIR
```

### 6.2 iOS Cihaz Akışı

```
USB Bağlantısı (usbmuxd)
        │
        ▼
┌─────────────────┐
│  iOS Provider    │  Host üzerinde çalışır (Docker dışı)
│  (macOS native)  │  libimobiledevice ile cihaz algılama
└────────┬────────┘
         │ fork()
         ▼
┌─────────────────┐
│ iOS Device Worker│
│                  │
│  • wda/client    │  - WebDriverAgent başlatma ve yönetim
│  • wda/connect   │  - WDA HTTP proxy
│  • screen/stream │  - MJPEG streaming (WDA üzerinden)
│  • info          │  - Cihaz bilgileri
│  • heartbeat     │  - Heartbeat mekanizması
│  • group         │  - Sahiplik yönetimi
│  • solo          │  - Tekil kayıt
└────────┬────────┘
         │ DeviceIosIntroductionMessage
         ▼
    (Aynı Processor → Reaper → Ready akışı)
```

### 6.3 Ekran Streaming Mimarisi

```
┌─────────────────┐                ┌─────────────────┐
│  Android Cihaz   │                │   iOS Cihaz      │
│                  │                │                  │
│  Minicap/Scrcpy  │                │  WebDriverAgent  │
│  (Ekran Yakalama)│                │  (MJPEG Stream)  │
└────────┬────────┘                └────────┬────────┘
         │ Ham frame (Binary)               │ MJPEG
         ▼                                  ▼
┌──────────────────────────────────────────────────┐
│              Device Worker Process                │
│      WebSocket Server (:allocated-port)           │
└────────────────────┬─────────────────────────────┘
                     │ Binary WebSocket
                     ▼
┌──────────────────────────────────────────────────┐
│         Nginx (WebSocket Proxy)                   │
│   /d/mercury-provider/<port>/  →  worker:port     │
│   /d/mercury-ios-provider/<port>/ → host:port     │
└────────────────────┬─────────────────────────────┘
                     │ WSS (Binary)
                     ▼
┌──────────────────────────────────────────────────┐
│            Tarayıcı (DeviceScreenStore)           │
│                                                   │
│   WebSocket → Frame decode → OffscreenCanvas      │
│            → ImageBitmapRenderingContext           │
│            → <canvas> render                      │
│                                                   │
│   Reconnect: Exponential backoff                  │
│   (3s → 6s → 12s → 24s → 48s → 96s, 3dk max)    │
└──────────────────────────────────────────────────┘
```

### 6.4 Reaper (Temizleyici) Mekanizması

Reaper, cihaz sağlığını **TTLSet** veri yapısı ile izler:

```
Heartbeat Akışı:
  Device → DeviceHeartbeatMessage → Reaper TTLSet.bump(serial)
                                          │
                                     30s Timer Reset
                                          │
                            ┌──────────────┴──────────────┐
                            │                              │
                     Timer Reset OK                  Timer Expired!
                     (cihaz sağlıklı)               (heartbeat kesildi)
                            │                              │
                            ▼                              ▼
                    Devam et...              DeviceAbsentMessage
                                                    │
                                                    ▼
                                            present: false
                                            ready: false
                                            DB güncelleme
                                            Kullanıcı bilgilendirme
```

---

## 7. Altyapı ve Deployment

### 7.1 Docker Compose Topolojisi

macOS deployment'ı 17 konteyner + 1 host süreci içerir:

```
┌──────────────────────────────────────────────────────┐
│                   Docker Ağı: mercury                 │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │    Nginx     │  │  MongoDB    │  │  MongoSetup  │ │
│  │   :80/:443   │  │   :27017    │  │  (one-shot)  │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │  mercury-app │  │ mercury-api │  │mercury-auth  │ │
│  │    :3000     │  │    :3000    │  │    :3000     │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │  websocket   │  │  processor  │  │    reaper    │ │
│  │    :3000     │  │             │  │              │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │triproxy-app │  │triproxy-dev │  │groups-engine │ │
│  │:7150/60/70  │  │:7250/60/70  │  │              │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │storage-temp │  │storage-apk  │  │storage-image │ │
│  │    :3000    │  │    :3000    │  │    :3000     │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
│                                                       │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  mercury-ssl │  │mercury-migr │  │  provider   │ │
│  │  (one-shot)  │  │ (one-shot)  │  │:12010-12100 │ │
│  └──────────────┘  └─────────────┘  └─────────────┘ │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                   macOS Host                          │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │           iOS Provider (Native)               │    │
│  │  • libimobiledevice/usbmuxd                   │    │
│  │  • Xcode toolchain                            │    │
│  │  • WebDriverAgent                             │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

#### Başlatma Sırası (Dependency Chain)

```
MongoDB → MongoSetup (RS init) → Migrate (şema)
    → Tüm servisler paralel başlar
    → Nginx (tüm servislere bağımlı)
    → SSL sertifika üretimi (Nginx'e bağımlı)
```

### 7.2 Nginx Reverse Proxy

| Route Pattern | Hedef | Açıklama |
|---------------|-------|----------|
| `/` | mercury-app:3000 | React SPA |
| `/auth/*` | mercury-auth:3000 | Auth sayfaları |
| `/api/v1/*` | mercury-api:3000 | REST API |
| `/socket.io/*` | mercury-websocket:3000 | Socket.IO |
| `/d/mercury-provider/<port>/*` | provider:port | Android ekran stream |
| `/d/mercury-ios-provider/<port>/*` | host:port | iOS ekran stream |

**Performans Ayarları:**
- Gzip sıkıştırma etkin
- TCP optimizasyonları (nodelay, nopush, sendfile)
- Upload: 1024MB max body
- WebSocket timeout: 600s
- Buffering devre dışı (gerçek zamanlı streaming)

### 7.3 SSL/TLS

- **Otomatik self-signed sertifika** üretimi (`paulczar/omgwtfssl` imajı)
- TLSv1.2 ve TLSv1.3 desteği
- Sertifikalar Docker volume (`certs`) üzerinden Nginx'e bağlanır

### 7.4 Ağ Topolojisi

- **Docker bridge ağı:** `mercury` — tüm konteynerler bu ağ üzerinde
- **Host erişimi:** `host.docker.internal` ile konteynerden host'a
- **iOS provider:** Host üzerinde çalışır, Docker dışında (`host-gateway`)
- **Port aralığı:** Android cihazlar `12010-12100` arasında dinamik port alır
- **ZeroMQ portları:** `7150-7170` (app), `7250-7270` (dev)

---

## 8. Wire Protokolü (Mesaj Tipleri)

Protocol Buffers ile tanımlanan 50+ mesaj tipi:

### Cihaz Yaşam Döngüsü Mesajları

| Mesaj | Yön | Açıklama |
|-------|-----|----------|
| `DeviceIntroductionMessage` | Device → Processor | Yeni cihaz kaydı |
| `DeviceIosIntroductionMessage` | iOS Device → Processor | iOS cihaz kaydı |
| `DevicePresentMessage` | Reaper → Broadcast | Cihaz mevcut |
| `DeviceAbsentMessage` | Reaper → Broadcast | Cihaz kayıp |
| `DeviceReadyMessage` | Device → Broadcast | Cihaz kullanıma hazır |
| `DeviceStatusMessage` | Device → Broadcast | Durum güncelleme |
| `DeviceHeartbeatMessage` | Device → Reaper | Heartbeat sinyali |

### Kullanıcı & Grup Mesajları

| Mesaj | Açıklama |
|-------|----------|
| `UserChangeMessage` | Kullanıcı verisi değişikliği |
| `GroupChangeMessage` | Grup verisi değişikliği |
| `JoinGroupMessage` | Cihazı gruba ekle |
| `LeaveGroupMessage` | Cihazı gruptan çıkar |
| `JoinGroupByAdbFingerprintMessage` | ADB parmak izi ile gruba katıl |

### Olay Mesajları

| Mesaj | Açıklama |
|-------|----------|
| `AirplaneModeEvent` | Uçak modu değişikliği |
| `BatteryEvent` | Pil durumu |
| `RotationEvent` | Ekran döndürme |
| `ConnectStartedMessage` | Uzak bağlantı başladı |
| `ConnectStoppedMessage` | Uzak bağlantı durdu |
| `TransactionProgressMessage` | İşlem ilerlemesi |
| `TransactionDoneMessage` | İşlem tamamlandı |

### İşlem Mesajları

| Mesaj | Açıklama |
|-------|----------|
| `InstallMessage` | Uygulama yükleme |
| `UninstallMessage` | Uygulama kaldırma |
| `ShellCommandMessage` | Shell komutu çalıştırma |
| `ForwardCreateMessage` | Port forward oluşturma |
| `ScreenCaptureMessage` | Ekran görüntüsü alma |

---

## 9. Dizin Yapısı

```
mercury-farm/
│
├── bin/                             # CLI giriş noktaları
│   ├── mercury.mjs                  # Ana CLI (tsx runner)
│   └── mercury-compat.mjs           # Uyumluluk katmanı
│
├── lib/                             # Backend kaynak kodu
│   ├── cli/                         # CLI komut tanımları
│   │   ├── index.js                 # Yargs ana yapılandırma
│   │   ├── api/                     # API sunucu komutu
│   │   ├── app/                     # Frontend sunucu komutu
│   │   ├── auth-mock/               # Mock auth komutu
│   │   ├── auth-ldap/               # LDAP auth komutu
│   │   ├── auth-oauth2/             # OAuth2 auth komutu
│   │   ├── auth-openid/             # OpenID auth komutu
│   │   ├── auth-saml2/              # SAML2 auth komutu
│   │   ├── device/                  # Android device komutu
│   │   ├── ios-device/              # iOS device komutu
│   │   ├── ios-provider/            # iOS provider komutu
│   │   ├── provider/                # Android provider komutu
│   │   │   └── ADBObserver.ts       # ADB bağlantı izleyici
│   │   ├── processor/               # Mesaj işleyici komutu
│   │   ├── reaper/                  # Heartbeat izleyici komutu
│   │   ├── triproxy/                # ZMQ proxy komutu
│   │   ├── websocket/               # WebSocket sunucu komutu
│   │   ├── groups-engine/           # Grup motoru komutu
│   │   ├── storage-plugin-apk/      # APK depolama komutu
│   │   ├── storage-plugin-image/    # Görüntü depolama komutu
│   │   ├── storage-s3/              # S3 depolama komutu
│   │   ├── storage-temp/            # Geçici depolama komutu
│   │   ├── migrate/                 # DB göçü komutu
│   │   ├── migrate-to-mongo/        # RethinkDB → Mongo göçü
│   │   ├── doctor/                  # Sistem sağlık denetimi
│   │   ├── generate-fake-device/    # Test cihaz üretici
│   │   ├── generate-fake-user/      # Test kullanıcı üretici
│   │   ├── generate-fake-group/     # Test grup üretici
│   │   ├── generate-service-user/   # Servis hesabı üretici
│   │   ├── local/                   # Tek süreç modu
│   │   ├── log-mongodb/             # MongoDB log yazıcı
│   │   ├── poorxy/                  # HTTP proxy
│   │   └── vnc-device/              # VNC cihaz komutu
│   │
│   ├── units/                       # Servis iş mantığı
│   │   ├── api/                     # REST API (Express + Swagger)
│   │   │   ├── controllers/         # Endpoint handler'ları
│   │   │   ├── paths/               # Route tanımları
│   │   │   ├── swagger/             # OpenAPI spesifikasyonu
│   │   │   └── helpers/             # Yardımcı fonksiyonlar
│   │   ├── app/                     # SPA sunucusu
│   │   ├── auth/                    # Auth stratejileri
│   │   │   ├── mock.js              # Mock auth
│   │   │   ├── ldap.js              # LDAP auth
│   │   │   ├── oauth2/              # OAuth2 auth
│   │   │   ├── openid.js            # OpenID auth
│   │   │   └── saml2.js             # SAML2 auth
│   │   ├── base-device/             # Temel cihaz fonksiyonları
│   │   │   ├── plugins/             # Ortak pluginler (heartbeat, group, solo)
│   │   │   └── support/             # ZMQ push/router/connector
│   │   ├── device/                  # Android cihaz
│   │   │   └── plugins/             # 25 plugin (screen, touch, shell, vb.)
│   │   ├── ios-device/              # iOS cihaz
│   │   │   └── plugins/             # WDA, screen, info pluginleri
│   │   ├── tizen-device/            # Tizen TV cihaz
│   │   ├── vnc-device/              # VNC cihaz
│   │   ├── provider/                # Android cihaz sağlayıcı
│   │   │   └── ProcessManager       # Worker süreç yönetimi
│   │   ├── ios-provider/            # iOS cihaz sağlayıcı
│   │   ├── processor/               # Merkezi mesaj yönlendirici
│   │   ├── websocket/               # Socket.IO sunucusu
│   │   ├── groups-engine/           # Grup zamanlama motoru
│   │   ├── reaper/                  # Heartbeat izleyici
│   │   ├── storage/                 # Depolama servisleri
│   │   └── log/                     # Loglama birimi
│   │
│   ├── db/                          # Veritabanı katmanı
│   │   ├── index.ts                 # Bağlantı + ZMQ soketleri
│   │   ├── api.ts                   # Birleşik model API
│   │   ├── setup.ts                 # Koleksiyon/index oluşturma
│   │   ├── tables.ts                # Koleksiyon tanımları
│   │   ├── models/                  # Veri modelleri
│   │   └── handlers/                # Change Stream dinleyiciler
│   │
│   ├── wire/                        # Mesaj protokolü
│   │   ├── wire.proto               # Protocol Buffer tanımları
│   │   ├── router.ts                # Mesaj yönlendirici
│   │   └── index.ts                 # Wire yardımcıları
│   │
│   ├── util/                        # Yardımcı modüller
│   │   ├── logger.ts                # Yapılandırılmış loglama
│   │   ├── zmqutil.js               # ZeroMQ soket fabrikası
│   │   ├── wireutil.js              # Wire protokol yardımcıları
│   │   ├── jwtutil.js               # JWT işlemleri
│   │   ├── ProcessManager.ts        # Süreç yönetimi
│   │   ├── lifecycle.ts             # Süreç yaşam döngüsü
│   │   ├── srv.ts                   # DNS SRV çözümleme
│   │   ├── lockutil.js              # Dağıtık kilitleme
│   │   ├── ttlset.ts                # TTL bazlı küme veri yapısı
│   │   └── ...                      # 30+ yardımcı modül
│   │
│   └── types/                       # TypeScript tip tanımları
│
├── ui/                              # Frontend uygulaması
│   ├── src/
│   │   ├── api/                     # API istemcileri (Axios, Socket.IO)
│   │   ├── components/
│   │   │   ├── app/                 # Uygulama kabuğu ve router
│   │   │   ├── views/               # Sayfa bileşenleri
│   │   │   ├── ui/                  # Yeniden kullanılabilir bileşenler
│   │   │   └── lib/                 # Temel UI bileşenleri
│   │   ├── config/
│   │   │   ├── i18n/                # Dil yapılandırması
│   │   │   ├── inversify/           # DI konteynerleri
│   │   │   └── queries/             # React Query yapılandırması
│   │   ├── store/                   # MobX store'ları
│   │   ├── services/                # İş mantığı servisleri
│   │   ├── lib/
│   │   │   ├── hooks/               # 45+ özel React hook
│   │   │   └── utils/               # 40+ yardımcı fonksiyon
│   │   ├── types/                   # TypeScript tipleri
│   │   ├── constants/               # Sabitler
│   │   ├── generated/               # Orval ile üretilen tipler
│   │   └── styles/                  # Global stiller
│   ├── auth/                        # Auth HTML sayfaları
│   └── public/                      # Statik dosyalar
│
├── WebDriverAgent/                  # iOS otomasyon aracı
│   ├── lib/                         # WDA TypeScript kütüphanesi
│   ├── WebDriverAgentLib/           # Objective-C kütüphanesi
│   ├── WebDriverAgentRunner/        # Xcode test runner
│   └── WebDriverAgent.xcodeproj/    # Xcode projesi
│
├── vendor/                          # Üçüncü taraf araçlar
│   ├── minirev/                     # Screen reverse tool
│   └── STFService/                  # Android servis APK
│
├── scripts/                         # Deployment betikleri
│   ├── nginx.conf                   # Nginx yapılandırması
│   ├── variables.env                # Ortam değişkenleri
│   ├── mongo_setup.sh               # MongoDB RS kurulumu
│   ├── start-ios-provider.sh        # iOS provider başlatıcı
│   └── ...                          # Diğer yardımcı betikler
│
├── docs/                            # Dokümantasyon
├── docker-compose-macos.yaml        # Docker Compose tanımı
├── Dockerfile                       # Multi-stage Docker imajı
├── package.json                     # Backend bağımlılıkları
└── tsconfig.json                    # TypeScript yapılandırması
```

---

## 10. Güvenlik Mimarisi

### Kimlik Doğrulama ve Yetkilendirme

| Katman | Mekanizma |
|--------|-----------|
| **API İstekleri** | JWT Bearer token (`Authorization` header) |
| **WebSocket** | Cookie-session + JWT subprotocol |
| **Ekran Streaming** | JWT doğrulama + cihaz sahiplik kontrolü |
| **Auth Stratejileri** | 5 farklı strateji (Mock, LDAP, OAuth2, OpenID, SAML2) |
| **Rate Limiting** | express-rate-limit ile API koruması |
| **CSRF** | csurf middleware |

### Ağ Güvenliği

| Katman | Mekanizma |
|--------|-----------|
| **TLS** | Nginx'te TLSv1.2 + TLSv1.3 sonlandırma |
| **İç Ağ** | Docker bridge ağı (dış erişim yok) |
| **Servisler arası** | ZeroMQ TCP (sadece iç ağda) |
| **Proxy** | X-Forwarded-For ile gerçek IP izleme |

### Cihaz Güvenliği

- Cihazlar yalnız atanmış kullanıcı tarafından kontrol edilebilir
- Sahiplik kontrolü ZMQ mesaj katmanında yapılır
- Doğrudan API üzerinden cihaz kontrolü yok — tümü ZMQ/WebSocket üzerinden

### Docker Güvenliği

- Non-root kullanıcı (`mercury-user`) ile konteyner çalıştırma
- Multi-stage build (sadece runtime bağımlılıkları)
- Minimal base image (node:22.18.0-bookworm-slim)

---

> **Not:** Bu doküman Mercury Device Farm v1.5.0 sürümünü yansıtmaktadır.
