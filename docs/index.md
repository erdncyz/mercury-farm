# Documentation Index (EN + TR)

Use this page as the single entry point for Mercury documentation.

---

## English

### Quick Install (Docker image)

```bash
git clone https://github.com/erdncyz/mercury-farm.git
cd mercury-farm
npm ci
npm run stack:up:image:macos     # pulls the prebuilt GHCR image, starts the stack
./scripts/start-ios-provider.sh  # iOS only (host, needs Xcode)
```

Full guide: [Getting Started](./getting-started.md).

### Start Here

- [Getting Started](./getting-started.md)
- [Troubleshooting](./troubleshooting.md)

### iOS

- [iOS Setup](./ios-setup.md)
- [ESP32 Notes](./esp32.md)

### Appium

- [Appium Setup](./appium-setup.md) - install Appium, Inspector, and platform drivers
- [Appium Inspector Connection](./appium-integration.md) - reserve and inspect Mercury Android/iOS devices

### Smart TV

- [Smart TV (Tizen) Guide](./smart-tv-tizen.md)

### Parallel and Automation

- [Parallel Execution](./parallel-execution.md)
- [Automation API](./automation-api.md)

### API Reference

- [API Reference](./API.md)

---

## Türkçe

Bu sayfayı Mercury dokümantasyonu için ana giriş noktası olarak kullanın.

### Hızlı Kurulum (Docker imajı)

```bash
git clone https://github.com/erdncyz/mercury-farm.git
cd mercury-farm
npm ci
npm run stack:up:image:macos     # hazır GHCR imajını çeker, stack'i başlatır
./scripts/start-ios-provider.sh  # sadece iOS (host, Xcode gerektirir)
```

Ayrıntılı rehber: [Getting Started](./getting-started.md).

### İlk Başlangıç

- [Getting Started](./getting-started.md)
- [Troubleshooting](./troubleshooting.md)

### iOS

- [iOS Setup](./ios-setup.md)
- [ESP32 Notes](./esp32.md)

### Appium

- [Appium Kurulumu](./appium-setup.md) - Appium, Inspector ve platform driver kurulumu
- [Appium Inspector Bağlantısı](./appium-integration.md) - Mercury Android/iOS cihaz ayırma ve inceleme

### Smart TV

- [Smart TV (Tizen) Guide](./smart-tv-tizen.md)

### Paralel Koşum ve Otomasyon

- [Parallel Execution](./parallel-execution.md)
- [Automation API](./automation-api.md)

### API Referansı

- [API Reference](./API.md)
