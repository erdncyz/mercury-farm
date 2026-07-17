# Docker Services & Logs Guide

Mercury stack consists of multiple Docker containers. The table below explains what each service does and how to check its logs.

Mercury stack'i birden fazla Docker container'dan oluşur. Aşağıdaki tablo her servisin ne yaptığını ve loglarına nasıl bakılacağını açıklar.

## Service Overview / Servislere Genel Bakış

| Container | Description (EN) | Açıklama (TR) | Log Command |
|---|---|---|---|
| **mercury-nginx** | Reverse proxy. Routes all HTTP/HTTPS traffic to services, proxies WebSocket upgrades, handles SSL termination. | Reverse proxy. Tüm HTTP/HTTPS trafiğini ilgili servislere yönlendirir, WebSocket upgrade'lerini proxy eder, SSL terminasyonu yapar. | `docker logs -f mercury-nginx` |
| **mercury-mongo** | MongoDB database. Stores device, user, and session data. Runs in replica set mode. | MongoDB veritabanı. Cihaz, kullanıcı ve oturum verilerini saklar. Replica set modunda çalışır. | `docker logs -f mercury-mongo` |
| **mercury-mongosetup** | One-shot. Initializes the MongoDB replica set (`rs.initiate`), then exits. | Tek seferlik çalışır. MongoDB replica set'i başlatır (`rs.initiate`). Sonra kapanır. | `docker logs mercury-mongosetup` |
| **mercury-migrate** | One-shot. Applies database schema/migrations, then exits. | Tek seferlik çalışır. Veritabanı şemasını/migration'ları uygular. Sonra kapanır. | `docker logs mercury-migrate` |
| **mercury-app** | Frontend UI server. Serves the React application (port 3000). | Frontend UI sunucusu. React uygulamasını serve eder (port 3000). | `docker logs -f mercury-app` |
| **mercury-auth** | Authentication service. Runs in mock auth mode for dev/test login. | Kimlik doğrulama servisi. Mock auth modunda çalışıyor — test/geliştirme ortamı için kullanıcı girişi sağlar. | `docker logs -f mercury-auth` |
| **mercury-processor** | Message processor. Routes commands between app side (triproxy-app) and device side (triproxy-dev). | Mesaj işlemci. App tarafı (triproxy-app) ile cihaz tarafı (triproxy-dev) arasındaki komutları işler ve yönlendirir. | `docker logs -f mercury-processor` |
| **mercury-reaper** | Device connection monitor. Detects devices that exceed heartbeat timeout (30s), marks them as "absent" and frees resources. | Cihaz bağlantı izleyici. Heartbeat timeout'u (30sn) aşan cihazları tespit edip "absent" olarak işaretler ve kaynaklarını serbest bırakır. | `docker logs -f mercury-reaper` |
| **mercury-storage-plugin-apk** | Storage plugin that accepts APK files and forwards them to temporary storage. | APK dosyalarını kabul edip geçici depolamaya ileten storage eklentisi. | `docker logs -f mercury-storage-plugin-apk` |
| **mercury-storage-plugin-image** | Storage plugin that accepts screenshot/image files and forwards them to temporary storage. | Screenshot/görüntü dosyalarını kabul edip geçici depolamaya ileten storage eklentisi. | `docker logs -f mercury-storage-plugin-image` |
| **mercury-storage-temp** | Temporary file store. APKs and screenshots are stored under `/tmp`. | Geçici dosya deposu. APK'lar ve screenshot'lar `/tmp` altında saklanır. | `docker logs -f mercury-storage-temp` |
| **mercury-triproxy-app** | ZeroMQ message broker (app side). Manages pub/sub and push/pull between UI/API and processor. (ports: 7150, 7160, 7170) | ZeroMQ mesaj broker'ı (app tarafı). UI/API ile processor arasındaki pub/sub ve push/pull iletişimini yönetir. (portlar: 7150, 7160, 7170) | `docker logs -f mercury-triproxy-app` |
| **mercury-triproxy-dev** | ZeroMQ message broker (device side). Manages communication between provider/devices and processor. (ports: 7250, 7260, 7270) | ZeroMQ mesaj broker'ı (device tarafı). Provider/cihazlar ile processor arasındaki iletişimi yönetir. (portlar: 7250, 7260, 7270) | `docker logs -f mercury-triproxy-dev` |
| **mercury-websocket** | WebSocket server. Delivers real-time device events (device.change etc.) and screen stream data to the browser. | WebSocket sunucusu. Tarayıcıya gerçek zamanlı cihaz olaylarını (device.change vb.) ve ekran stream verilerini iletir. | `docker logs -f mercury-websocket` |
| **mercury-api** | REST API server. Provides HTTP endpoints for device listing, device control, user operations, etc. | REST API sunucusu. Cihaz listesi, cihaz kontrolü, kullanıcı işlemleri gibi HTTP endpoint'lerini sağlar. | `docker logs -f mercury-api` |
| **mercury-api-groups-engine** | Group management engine. Creates and updates device groups, enforces user access rules. | Grup yönetim motoru. Cihaz gruplarını oluşturur, günceller ve kullanıcı erişim kurallarını uygular. | `docker logs -f mercury-api-groups-engine` |
| **mercury-provider** | Device provider. Connects to Android devices via ADB, handles screen capture, touch forwarding, and app installation. Streams screen frames over WebSocket. (ports: 12010-12100) | Cihaz sağlayıcı. ADB üzerinden Android cihazlara bağlanır, ekran yakalama, dokunma iletimi ve uygulama yükleme işlemlerini yönetir. Ekran frame'lerini WebSocket üzerinden iletir. (portlar: 12010-12100) | `docker logs -f mercury-provider` |
| **mercury-ssl** | One-shot. Generates a self-signed SSL certificate, then exits. | Tek seferlik çalışır. Self-signed SSL sertifikası üretir. Sonra kapanır. | `docker logs mercury-ssl` |

## Troubleshooting by Symptom / Sorun Bazlı Hangi Loglara Bakılmalı

| Issue (EN) | Sorun (TR) | Containers to Check |
|---|---|---|
| Black screen / frozen screen | Siyah ekran / ekran donması | `mercury-websocket` → `mercury-provider` |
| Device not showing in list | Cihaz listede görünmüyor | `mercury-provider` → `mercury-reaper` → `mercury-processor` |
| Cannot log in | Giriş yapılamıyor | `mercury-auth` → `mercury-nginx` |
| APK upload fails | APK yüklenemiyor | `mercury-storage-plugin-apk` → `mercury-storage-temp` |
| Screenshot not working | Screenshot alınamıyor | `mercury-storage-plugin-image` → `mercury-storage-temp` |
| WebSocket connection error | WebSocket bağlantı hatası | `mercury-nginx` → `mercury-websocket` |
| Device goes "absent" | Cihaz "absent" oluyor | `mercury-reaper` → `mercury-provider` |
| UI not loading | UI açılmıyor | `mercury-app` → `mercury-nginx` |
| API errors | API hataları | `mercury-api` → `mercury-processor` |
| Group/access issues | Grup/erişim sorunları | `mercury-api-groups-engine` |
| Database errors | Veritabanı hataları | `mercury-mongo` → `mercury-migrate` |

## Useful Commands / Faydalı Komutlar

```bash
# Show all container statuses / Tüm container durumlarını göster
~/.mercury-farm/mercury status

# Follow logs for all services / Tüm servislerin loglarını aynı anda izle
~/.mercury-farm/mercury logs

# Show last 100 lines of a specific service / Belirli bir servisin son 100 satır logunu göster
docker logs --tail 100 mercury-websocket

# Show logs from the last 5 minutes / Son 5 dakikanın loglarını göster
docker logs --since 5m mercury-provider
```
