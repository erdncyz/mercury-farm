# Mercury Device Farm (macOS)

Mercury Device Farm is a browser-based real-device lab for Android and iOS. This lab lets you manage and interact with connected physical devices right from your web browser. 

This repository and its setup guides are currently targeted towards **macOS**, as macOS is required to manage iOS devices with Xcode tooling.

## Key Features

- **Automatic Device Management:**
  - Android device plug/unplug is detected automatically.
  - iOS device plug/unplug is detected automatically.
  - Disconnected devices are hidden from the device list in real-time.
- **iOS Integration:**
  - WebDriverAgent (WDA) builds and starts through the iOS provider flow.
  - iOS devices are exposed in the same web UI as Android devices.

## Documentation

We have consolidated the setup guides and instructions in the `docs` directory:

- **[Getting Started](docs/getting-started.md)**: Setup, installation, usage, and troubleshooting.
- **[iOS Specific Setup](docs/ios-setup.md)**: Details on configuring iOS devices and the ESP32 hardware helper.
- **[Scaling Guide](docs/scaling.md)**: Capacity planning and sharding patterns for 10+ iOS/Android devices.
- **[Automation API](docs/automation-api.md)**: Guide on using Mercury devices with Appium and our autotest API.
- **[API Reference](docs/API.md)**: Complete REST API documentation.

## License

Apache License 2.0.

---

# Mercury Device Farm (macOS) [Türkçe]

Mercury Device Farm, Android ve iOS için tarayıcı tabanlı gerçek cihaz laboratuvarıdır. Bu laboratuvar, bağlı fiziksel cihazları doğrudan web tarayıcınızdan yönetmenize ve onlarla etkileşim kurmanıza olanak tanır.

Bu depo ve kurulum rehberleri şu anda **macOS** sistemlerini hedeflemektedir, çünkü iOS cihazlarını Xcode araçlarıyla yönetmek için macOS gereklidir.

## Temel Özellikler

- **Otomatik Cihaz Yönetimi:**
  - Android cihazların takılıp/çıkarılması otomatik olarak algılanır.
  - iOS cihazların takılıp/çıkarılması otomatik olarak algılanır.
  - Bağlantısı kesilen cihazlar cihaz listesinden gerçek zamanlı olarak gizlenir.
- **iOS Entegrasyonu:**
  - WebDriverAgent (WDA), iOS provider akışı üzerinden çalışır.
  - iOS cihazlar Android cihazlarla birlikte aynı web arayüzünde yönetilir.

## Dokümantasyon

Tüm kurulum ve kullanım rehberlerini `docs` dizininde birleştirdik:

- **[Başlarken](docs/getting-started.md)**: Kurulum, kullanım adımları ve sorun giderme.
- **[iOS Kurulumu](docs/ios-setup.md)**: iOS cihazların yapılandırılması ve ESP32 donanım desteği detayları.
- **[Ölçekleme Rehberi](docs/scaling.md)**: 10+ iOS/Android cihaz için kapasite ve shard mimarisi.
- **[Otomasyon API'si](docs/automation-api.md)**: Mercury cihazlarını Appium ve otomatik test API'miz ile kullanma rehberi.
- **[API Referansı](docs/API.md)**: Kapsamlı REST API dokümantasyonu.

## Lisans

Apache Lisansı 2.0.
