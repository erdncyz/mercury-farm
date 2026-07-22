# Documentation Index (EN + TR)

Use this page as the single entry point for Mercury documentation.

---

## English

### Quick Install (Docker image)

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash
~/.mercury-farm/mercury up
```

For iOS, run `~/.mercury-farm/mercury ios-auto` after installing Xcode and the
host prerequisites. Use installer option `--android-only` when iOS is not needed.

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

- [Automation API](./automation-api.md) - reserve devices, name runs, and track them on the **Builds** page
- [Parallel Execution](./parallel-execution.md) - multiple devices and CI workers

### Hardware & Performance

- [Hardware Recommendations](../README.md#hardware-recommendations-android--ios-fleet) - Mac mini, USB hubs, device specs for production setups
- [H.264/WebRTC Feature Plan](./h264-webrtc-feature-plan.md) - current streaming tech, roadmap, and gate-based decision framework for WebRTC migration

### Architecture

- [Architecture](./architecture.md) - system design, component overview, and data flow
- [Docker Services & Logs](./docker-logs.md) - container reference and debugging

### API Reference

- [API Reference](./API.md)

---

## Türkçe

Bu sayfayı Mercury dokümantasyonu için ana giriş noktası olarak kullanın.

### Hızlı Kurulum (Docker imajı)

```bash
curl -fsSL https://github.com/erdncyz/mercury-farm/releases/latest/download/install.sh | bash
~/.mercury-farm/mercury up
```

iOS icin Xcode ve host gereksinimlerini kurduktan sonra
`~/.mercury-farm/mercury ios-auto` calistirin. iOS gerekmiyorsa kurucuyu
`--android-only` secenegiyle kullanin.

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

- [Automation API](./automation-api.md) - cihaz ayırma, koşum adlandırma ve **Builds** sayfasından izleme
- [Parallel Execution](./parallel-execution.md) - çoklu cihaz ve CI worker'ları

### Donanım & Performans

- [Donanım Önerileri](../README.md#donanim-onerileri-android-ve-ios-filo) - Mac mini, USB hub'lar, üretim ortamı cihaz özellikleri
- [H.264/WebRTC Özellik Planı](./h264-webrtc-feature-plan.md) - mevcut streaming teknolojisi, yol haritası, WebRTC geçişi için kapı-temelli karar çerçevesi

### Mimari

- [Mimari](./mimari.md) - sistem tasarımı, bileşen özeti ve veri akışı
- [Docker Servisleri & Loglar](./docker-logs.md) - container referansı ve debugging

### API Referansı

- [API Reference](./API.md)
