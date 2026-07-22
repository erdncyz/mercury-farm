# H.264/WebRTC Screen Streaming — Feature Plan

**Status:** Planning | **Priority:** Conditional (test-driven) | **Target:** Q3 2026+

---

## 1. Executive Summary

Currently, Mercury uses **MJPEG over WebSocket** for iOS and Android screen streaming. This works well on local networks but introduces latency (200–500 ms) and high bandwidth consumption (~3–8 Mbps/device) when accessed remotely over the internet.

This feature plan outlines a phased migration to **H.264/WebRTC**, which reduces bandwidth by ~70%, latency to 50–150 ms, and provides better stability on poor network conditions.

---

## 2. Problem Statement

**Current State:**
- iOS: WDA MJPEG → WebSocket → Browser Canvas
- Android: Scrcpy/Minicap JPEG → WebSocket → Browser Canvas
- Each frame is a separate JPEG transmission
- Suitable for LAN; struggles with remote/VPN access

**User Impact:**
- Local network (same building): Acceptable experience
- Remote access (different country, VPN): Noticeable lag and jitter
- Poor bandwidth: Stream degrades to low frame rates or freezes

**Business Driver:**
- Users accessing the farm from remote locations (marketing, distributed teams, geographically separated QA)
- Competitive parity with rental services using WebRTC/H.264

---

## 3. Proposed Solution

Migrate to **WebRTC with H.264 encoding**, maintaining backward compatibility where possible.

| Layer | Current | Target |
|---|---|---|
| **Encoding** | MJPEG (per-frame) | H.264 (video stream) |
| **Transport** | WebSocket (binary frames) | WebRTC (RTCPeerConnection) |
| **Signaling** | — | New signaling server (SDP offer/answer) |
| **Browser Rendering** | Canvas + JS JPEG decode | Native `<video>` element |
| **Platform Support** | iOS + Android + Tizen/VNC | iOS + Android (phased) |

**Benefits:**
- Bandwidth: ~70% reduction per device
- Latency: ~200–350 ms improvement
- Stability: Better performance on weak networks
- CPU efficiency: GPU-accelerated decode in browser

**Trade-offs:**
- WebRTC adds complexity (ICE, STUN, NAT traversal)
- iOS requires deeper changes to WDA integration
- Requires testing at scale (20–40 devices)

---

## 4. Scope by Platform

### 4.1 Android

**Scope:** Medium | **Effort:** 2–3 weeks | **Risk:** Moderate

Scrcpy already outputs H.264. Main work is transport layer:

1. Add H.264 capture from Scrcpy (existing feature, just enable it)
2. Build WebRTC peer connection in device worker
3. Add WebRTC signaling endpoint to backend
4. Update browser `<video>` element and WebRTC client code
5. Test with 5–20 devices simultaneously

**No current code risk** — can run in parallel with MJPEG (both transports simultaneously).

### 4.2 iOS

**Scope:** Large | **Effort:** 4–5 weeks | **Risk:** High

WDA only provides MJPEG. Options:

**Option A (Recommended for Phase 2):**
- Capture MJPEG from WDA
- Re-encode to H.264 on Mac host via VideoToolbox
- Trade-off: Extra CPU load but minimal code changes to existing WDA integration

**Option B (Cleaner, more risky):**
- Integrate ReplayKit or Screen Recording API on device
- Requires additional iOS app or MDM provisioning
- Unknown stability at scale with 20–40 devices

**Option C (Out of scope):**
- Modify WDA fork to output H.264 natively (high maintenance burden)

**Recommendation:** Start with Option A for Phase 2, revisit Option B if performance is unacceptable.

---

## 5. Implementation Phases

### Phase 1: Android H.264/WebRTC (2–3 weeks)

**Goal:** Prove WebRTC works, gather performance metrics.

**Deliverables:**
- H.264 capture + WebRTC transport in Android device worker
- Backend signaling server (SDP negotiation)
- Browser UI updated to use `<video>` + WebRTC client
- Performance baselines (latency, bandwidth, CPU)
- Backward compatibility with MJPEG (dual-mode)

**Success Criteria:**
- 5 Android devices stream simultaneously over remote internet
- Latency < 150 ms
- Bandwidth < 2 Mbps per device
- No regression in local network performance

**Go/No-Go Decision:** If latency > 200 ms or bandwidth > 3 Mbps per device, reassess iOS phase.

---

### Phase 2: iOS H.264/WebRTC (4–5 weeks)

**Goal:** Achieve same metrics as Android, validate at 20+ device scale.

**Deliverables:**
- H.264 re-encoding pipeline on Mac host (VideoToolbox)
- WebRTC integration in iOS device worker (reuse Phase 1 signaling)
- Comprehensive testing (5, 10, 20, 30 devices)
- Performance monitoring and tuning

**Success Criteria:**
- 20 concurrent iOS devices (5 active, 15 standby)
- Latency < 150 ms
- Bandwidth < 2 Mbps per active device
- Standby devices: negligible bandwidth

**Risk Mitigation:**
- Staged rollout: 5 → 10 → 20 devices
- Parallel MJPEG fallback if WebRTC fails
- Per-device timeout recovery

---

## 6. Test-Driven Go/No-Go Gate

**Before committing to H.264 development**, the following must be true:

### Gate 1: Current MJPEG Baseline (Weeks 1–2)

Deploy current Mercury with 5–10 iPhones over remote internet.

- Measure latency, bandwidth, frame rate
- Identify bottlenecks (network, USB, WDA stability)
- If latency < 100 ms and bandwidth < 1 Mbps per device → **No-Go** (MJPEG sufficient, skip H.264)
- If latency > 200 ms OR bandwidth > 3 Mbps per device → **Go** (proceed to Phase 1)

### Gate 2: Android WebRTC Validation (Weeks 4–5)

After Phase 1 Android completion:

- Stream 5 Android devices over the same remote link
- Compare metrics with MJPEG baseline
- If latency ≥ 150 ms AND bandwidth ≤ 2 Mbps → **Go** (proceed to Phase 2 iOS)
- If metrics not achieved → **Re-assess** (optimize signaling, ICE, codec settings)

---

## 7. Technical Details

### 7.1 WebRTC Signaling Flow

```
Browser                          Backend                    Device Worker
  |                                 |                            |
  +--- Request stream ------→       |                            |
  |                                 +--- Create peer ----→       |
  |                                 |                            |
  |                                 |← SDP offer --------        |
  |                                 |                            |
  |                          SDP offer                           |
  |                                 |                            |
  |← Signaling (SDP offer) ---      |                            |
  |                                 |                            |
  |--- SDP answer (ICE cands) ---→  |                            |
  |                                 +--- SDP answer ----→        |
  |                                 |                            |
  |← WebRTC stream (H.264) ←────────┴← H.264 encoding ---        |
  |                                                               |
```

### 7.2 Browser-Side WebRTC Client

```typescript
const pc = new RTCPeerConnection({ iceServers: [...] });

// Handle remote video track from device
pc.ontrack = (event) => {
  videoElement.srcObject = event.streams[0];
};

// Send SDP offer to device via signaling
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
await fetch('/signal', { 
  method: 'POST', 
  body: JSON.stringify({ offer, deviceId, sessionId }) 
});

// Receive SDP answer and ICE candidates
signaling.onMessage((data) => {
  if (data.answer) {
    pc.setRemoteDescription(new RTCSessionDescription(data.answer));
  }
  if (data.iceCandidate) {
    pc.addIceCandidate(data.iceCandidate);
  }
});
```

### 7.3 iOS H.264 Re-encoding (VideoToolbox)

```swift
// Pseudo-code: Convert MJPEG → H.264 on Mac host
let encoder = VTCompressionSessionCreate(...)
encoder.setProperty(.bitrate, to: 1_000_000)  // 1 Mbps
encoder.encodeFrame(mjpegImage)  // Frame from WDA MJPEG
encoder.onEncodedFrame = { h264Data in
  webrtcPeerConnection.sendFrame(h264Data)
}
```

---

## 8. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| WebRTC NAT traversal issues | Medium | High | Use public STUN/TURN servers, test from multiple networks |
| iOS WDA stability with H.264 re-encoding | Medium | Medium | Phased rollout, fall back to MJPEG on error |
| Browser compatibility | Low | Medium | Test on Chrome, Firefox, Safari; use polyfills if needed |
| Scale (20–40 devices) | Low | High | Load testing on staging environment |
| Regression in local network performance | Low | Medium | Maintain dual-mode (MJPEG + WebRTC) with fallback |

---

## 9. Timeline & Estimate

| Phase | Duration | Start | End | Status |
|---|---|---|---|---|
| **Gate 1: MJPEG baseline** | 2 weeks | TBD | TBD | Pending |
| **Phase 1: Android H.264/WebRTC** | 2–3 weeks | TBD+2w | TBD+5w | Conditional |
| **Phase 2: iOS H.264/WebRTC** | 4–5 weeks | TBD+5w | TBD+10w | Conditional |
| **Testing & tuning at scale** | 1–2 weeks | TBD+10w | TBD+12w | Conditional |
| **Total (if all go)** | **~12 weeks** | — | — | — |

**Note:** Phases only proceed if Gate 1 confirms H.264 is worth the investment.

---

## 10. Success Criteria (Overall)

- ✅ Remote access latency < 150 ms (measured over real internet)
- ✅ Bandwidth < 2 Mbps per active device
- ✅ 20–30 iPhones simultaneously connected, 5–10 active streaming
- ✅ No regression in local network use (MJPEG fallback works)
- ✅ Stable for 1+ week of continuous use
- ✅ Browser compatibility: Chrome, Firefox, Safari

---

## 11. Out of Scope

- Tizen TV or VNC devices (remain on MJPEG for now)
- Screen recording / automated test video export (separate feature)
- Audio streaming (not required for remote control)
- End-to-end encryption (rely on TLS + SRTP)

---

## 12. Approval & Next Steps

**Decision Point:** Do you want to proceed with Gate 1 (2-week MJPEG baseline test)?

If yes:
1. Deploy current Mercury with 5–10 iPhones in your production setup (remote location)
2. Collect latency, bandwidth, and stability metrics for 1–2 weeks
3. Report findings; decide Go/No-Go on H.264 development

If no:
- Continue with MJPEG for now; revisit feature if latency becomes an issue

**Contact:** [support@mercury-farm.local] for questions or to kick off Gate 1.

---

# H.264/WebRTC Ekran Akışı — Özellik Planı (Türkçe)

**Durum:** Planlama | **Öncelik:** Şartlı (test-güdümlü) | **Hedef:** Q3 2026+

---

## 1. Yönetici Özeti

Şu an Mercury, iOS ve Android ekran akışı için **MJPEG over WebSocket** kullanıyor. Bu yerel ağlarda iyi çalışıyor fakat internet üzerinden uzaktan erişimde gecikme (200–500 ms) ve yüksek bant genişliği tüketimi (~3–8 Mbps/cihaz) getiriyor.

Bu plan, **H.264/WebRTC**'ye geçişin aşamalarını açıklıyor — bant genişliğini ~%70 düşürüyor, gecikmeyi 50–150 ms'ye getiriyor ve zayıf ağ koşullarında daha kararlı hale geliyor.

---

## 2. Problem Tanımı

**Mevcut Durum:**
- iOS: WDA MJPEG → WebSocket → Tarayıcı Canvas
- Android: Scrcpy/Minicap JPEG → WebSocket → Tarayıcı Canvas
- Her frame ayrı bir JPEG olarak gönderiliyor
- LAN'de uygun; uzaktan erişimde sıkıntı yaşıyor

**Kullanıcı Etkisi:**
- Yerel ağ (aynı bina): Kabul edilebilir deneyim
- Uzaktan erişim (başka ülke, VPN): Belirgin lag ve jitter
- Zayıf bant genişliği: Akış düşük frame rate'e veya donmuş hale düşüyor

**İş Nedeni:**
- Uzak konumlardan çiftliğe erişen kullanıcılar (pazarlama, dağınık takımlar, coğrafi olarak ayrılmış QA)
- WebRTC/H.264 kullanan kiralama hizmetleriyle rekabet etme

---

## 3. Önerilen Çözüm

**H.264 kodlamalı WebRTC**'ye geçiş, uygun yerlerde geriye uyumluluk koruması.

| Katman | Mevcut | Hedef |
|---|---|---|
| **Kodlama** | MJPEG (frame başına) | H.264 (video akışı) |
| **Transport** | WebSocket (binary frameler) | WebRTC (RTCPeerConnection) |
| **Sinyal Haberleşme** | — | Yeni signaling server (SDP offer/answer) |
| **Tarayıcı Render** | Canvas + JS JPEG decode | Yerel `<video>` elementi |
| **Platform Desteği** | iOS + Android + Tizen/VNC | iOS + Android (aşamalar halinde) |

**Faydalar:**
- Bant genişliği: Cihaz başına ~%70 azalma
- Gecikme: ~200–350 ms iyileşme
- Kararlılık: Zayıf ağlarda daha iyi performans
- CPU verimliliği: Tarayıcıda GPU-hızlandırmalı decode

**Ödünler:**
- WebRTC karmaşıklık ekliyor (ICE, STUN, NAT traversal)
- iOS, WDA entegrasyonuna daha derin değişiklik gerektirir
- Ölçekte test gerektiriyor (20–40 cihaz)

---

## 4. Platform Başına Kapsam

### 4.1 Android

**Kapsam:** Orta | **Efor:** 2–3 hafta | **Risk:** Orta

Scrcpy zaten H.264 çıktısı verir. Ana iş transport katmanı:

1. Scrcpy'den H.264 capture'ı etkinleştir (mevcut özellik)
2. Device worker'da WebRTC peer connection kur
3. Backend'e WebRTC signaling endpoint ekle
4. Tarayıcı `<video>` elementi ve WebRTC client kodunu güncelle
5. 5–20 cihaz ile eş zamanlı test et

**Mevcut kod riskine girmez** — MJPEG ile paralel çalıştırılabilir (her iki transport aynı anda).

### 4.2 iOS

**Kapsam:** Büyük | **Efor:** 4–5 hafta | **Risk:** Yüksek

WDA sadece MJPEG sağlıyor. Seçenekler:

**Seçenek A (Faz 2 için önerilir):**
- WDA'dan MJPEG capture et
- Mac host'ta VideoToolbox üzerinden H.264'e kodla
- Ödün: Fazladan CPU yükü ama mevcut WDA entegrasyonuna minimal kod değişikliği

**Seçenek B (Daha temiz, daha riskli):**
- Cihazda ReplayKit veya Ekran Kaydı API'si entegre et
- Ek iOS uygulaması veya MDM provisioning gerekli
- 20–40 cihaz ölçeğinde bilinmeyen kararlılık

**Seçenek C (Kapsam dışı):**
- WDA fork'unu H.264'ü native olarak çıkarmak için değiştir (yüksek bakım yükü)

**Tavsiye:** Faz 2 için Seçenek A ile başla, performans kabul edilmezse Seçenek B'yi yeniden değerlendir.

---

## 5. Uygulama Fazları

### Faz 1: Android H.264/WebRTC (2–3 hafta)

**Amaç:** WebRTC'nin çalışması kanıtlanır, performans metrikleri toplanır.

**Teslimatlar:**
- Android device worker'da H.264 capture + WebRTC transport
- Backend signaling server (SDP anlaşması)
- `<video>` + WebRTC client kullanacak şekilde tarayıcı UI güncellenmesi
- Performans ana çizgileri (gecikme, bant genişliği, CPU)
- MJPEG ile geriye uyumluluk (çift-mod)

**Başarı Kriterleri:**
- 5 Android cihaz, uzak internet üzerinden eş zamanlı stream
- Gecikme < 150 ms
- Bant genişliği < 2 Mbps/cihaz
- Yerel ağ performansında regresyon yok

**Devam/Dur Kararı:** Gecikme > 200 ms veya bant genişliği > 3 Mbps/cihaz ise iOS fazını yeniden değerlendir.

---

### Faz 2: iOS H.264/WebRTC (4–5 hafta)

**Amaç:** Android ile aynı metrikleri elde et, 20+ cihaz ölçeğinde doğrula.

**Teslimatlar:**
- Mac host'ta H.264 kodlama pipeline'ı (VideoToolbox)
- iOS device worker'da WebRTC entegrasyonu (Faz 1 signaling'ini yeniden kullan)
- Kapsamlı test (5, 10, 20, 30 cihaz)
- Performans izleme ve tuning

**Başarı Kriterleri:**
- 20 eş zamanlı iOS cihazı (5 aktif, 15 standby)
- Gecikme < 150 ms
- Bant genişliği < 2 Mbps/aktif cihaz
- Standby cihazlar: ihmal edilebilir bant genişliği

**Risk Azaltma:**
- Aşamalı rollout: 5 → 10 → 20 cihaz
- WebRTC başarısız olursa paralel MJPEG fallback
- Per-device timeout recovery

---

## 6. Test-Güdümlü Devam/Dur Kapısı

**H.264 geliştirmesine başlamadan önce** aşağıdakiler doğru olmalı:

### Kapı 1: Mevcut MJPEG Ana Çizgisi (1–2 hafta)

Mevcut Mercury'yi 5–10 iPhone ile uzak internet üzerinde dağıt.

- Gecikme, bant genişliği, frame rate ölç
- Darboğazları belirle (ağ, USB, WDA stabilitesi)
- Gecikme < 100 ms ve bant genişliği < 1 Mbps/cihaz ise → **Dur** (MJPEG yeterli, H.264'ü atla)
- Gecikme > 200 ms VEYA bant genişliği > 3 Mbps/cihaz ise → **Devam** (Faz 1'e geç)

### Kapı 2: Android WebRTC Doğrulaması (4–5 haftalar)

Faz 1 Android tamamlandıktan sonra:

- Aynı uzak bağlantı üzerinde 5 Android cihaz stream et
- Metrikleri MJPEG ana çizgisi ile karşılaştır
- Gecikme ≥ 150 ms VE bant genişliği ≤ 2 Mbps ise → **Devam** (Faz 2 iOS'a geç)
- Metrikler başarılı değilse → **Yeniden Değerlendir** (signaling, ICE, codec ayarlarını optimize et)

---

## 7. Teknik Detaylar

### 7.1 WebRTC Signaling Akışı

```
Tarayıcı                         Backend                    Device Worker
  |                                 |                            |
  +--- Stream iste ------→          |                            |
  |                                 +--- Peer oluştur ----→      |
  |                                 |                            |
  |                                 |← SDP offer --------        |
  |                                 |                            |
  |                          SDP offer                           |
  |                                 |                            |
  |← Signaling (SDP offer) ---      |                            |
  |                                 |                            |
  |--- SDP answer (ICE adaylari)→   |                            |
  |                                 +--- SDP answer ----→        |
  |                                 |                            |
  |← WebRTC akışı (H.264) ←─────────┴← H.264 kodlama ---        |
  |                                                               |
```

### 7.2 Tarayıcı Tarafı WebRTC İstemci

```typescript
const pc = new RTCPeerConnection({ iceServers: [...] });

// Device'tan uzak video track'ini işle
pc.ontrack = (event) => {
  videoElement.srcObject = event.streams[0];
};

// SDP offer'ı signaling üzerinden device'a gönder
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
await fetch('/signal', { 
  method: 'POST', 
  body: JSON.stringify({ offer, deviceId, sessionId }) 
});

// SDP answer ve ICE adaylarını al
signaling.onMessage((data) => {
  if (data.answer) {
    pc.setRemoteDescription(new RTCSessionDescription(data.answer));
  }
  if (data.iceCandidate) {
    pc.addIceCandidate(data.iceCandidate);
  }
});
```

### 7.3 iOS H.264 Kodlama (VideoToolbox)

```swift
// Sözde-kod: MJPEG → H.264 dönüşümü Mac host'ta
let encoder = VTCompressionSessionCreate(...)
encoder.setProperty(.bitrate, to: 1_000_000)  // 1 Mbps
encoder.encodeFrame(mjpegImage)  // WDA MJPEG'den frame
encoder.onEncodedFrame = { h264Data in
  webrtcPeerConnection.sendFrame(h264Data)
}
```

---

## 8. Risk Değerlendirmesi

| Risk | Olasılık | Etki | Azaltma |
|---|---|---|---|
| WebRTC NAT traversal sorunları | Orta | Yüksek | Halka açık STUN/TURN sunucuları, farklı ağlardan test et |
| iOS WDA kararlılığı H.264 kodlama ile | Orta | Orta | Aşamalı rollout, hata durumunda MJPEG'e düş |
| Tarayıcı uyumluluğu | Düşük | Orta | Chrome, Firefox, Safari'de test et; gerekirse polyfill kullan |
| Ölçek (20–40 cihaz) | Düşük | Yüksek | Hazırlama ortamında yük testi |
| Yerel ağ performansında regresyon | Düşük | Orta | Çift-mod koru (MJPEG + WebRTC) fallback ile |

---

## 9. Zaman Çizelgesi & Tahmini

| Faz | Süre | Başlangıç | Bitiş | Durum |
|---|---|---|---|---|
| **Kapı 1: MJPEG ana çizgisi** | 2 hafta | TBD | TBD | Bekleniyor |
| **Faz 1: Android H.264/WebRTC** | 2–3 hafta | TBD+2h | TBD+5h | Şartlı |
| **Faz 2: iOS H.264/WebRTC** | 4–5 hafta | TBD+5h | TBD+10h | Şartlı |
| **Test & tuning ölçekte** | 1–2 hafta | TBD+10h | TBD+12h | Şartlı |
| **Toplam (hepsi evet ise)** | **~12 hafta** | — | — | — |

**Not:** Fazlar sadece Kapı 1 H.264'ün yatırıma değer olduğunu onaylarsa devam eder.

---

## 10. Başarı Kriterleri (Genel)

- ✅ Uzaktan erişim gecikme süresi < 150 ms (gerçek internet üzerinden ölçülü)
- ✅ Bant genişliği < 2 Mbps/aktif cihaz
- ✅ 20–30 iPhone eş zamanlı bağlı, 5–10 aktif stream
- ✅ Yerel ağ kullanımında regresyon yok (MJPEG fallback çalışıyor)
- ✅ Sürekli 1+ hafta kullanım için kararlı
- ✅ Tarayıcı uyumluluğu: Chrome, Firefox, Safari

---

## 11. Kapsam Dışı

- Tizen TV veya VNC cihazları (şimdilik MJPEG'de kalıyor)
- Ekran kaydı / otomatik test video export (ayrı özellik)
- Ses akışı (uzaktan kontrol için gerekli değil)
- End-to-end şifreleme (TLS + SRTP'ye güven)

---

## 12. Onay & Sonraki Adımlar

**Karar Noktası:** Kapı 1 (2 haftalık MJPEG ana çizgisi testi) ile devam etmek istiyor musunuz?

Evet ise:
1. Mevcut Mercury'yi üretim kurulumunuzda 5–10 iPhone ile dağıt (uzak konum)
2. 1–2 hafta boyunca gecikme, bant genişliği ve kararlılık metriklerini topla
3. Bulguları raporla; H.264 geliştirmesine Devam/Dur karar ver

Hayır ise:
- Şimdilik MJPEG'de kalın; gecikme sorun olursa özelliği yeniden değerlendir

**İletişim:** [support@mercury-farm.local] sorular için veya Kapı 1'i başlatmak için.
