# Android H.264/WebRTC Screen Streaming

Android screen sessions use scrcpy H.264 over the authenticated screen
WebSocket. iOS sessions use WDA MJPEG as their capture source, re-encode the
freshest available frame with VideoToolbox, and prefer the same authenticated
H.264 WebSocket transport in browsers with WebCodecs. This avoids UDP/ICE
negotiation delays while retaining low-overhead browser decoding. Browsers
without WebCodecs use WebRTC, with MJPEG as the final compatibility fallback.
Tizen and VNC streaming are unchanged.

The iOS encoder keeps at most one pending JPEG and reuses VideoToolbox pixel
buffers. When encoding or rendering falls behind, stale frames are discarded
in favor of the newest frame so control latency does not grow over time.

## Network configuration

The primary H.264 WebSocket transport uses the existing device screen WebSocket
and needs no additional UDP ports. Android exposes UDP ports `13000-13100` and
the host-native iOS provider exposes `13101-13200` for the WebRTC compatibility
path. By default WebRTC advertises the provider's
`--public-ip` address in addition to its local interface addresses, which makes
Docker-based providers reachable from browsers on the same LAN. For access
through a different public/NAT address, override the advertised IPv4 address:

```env
SCREEN_WEBRTC_PUBLIC_IP=203.0.113.10
```

If direct UDP cannot reach the provider, configure a STUN/TURN service. The
value is a JSON array using the browser `RTCIceServer` shape and is sent only
over the already-authenticated device screen WebSocket:

```env
SCREEN_WEBRTC_ICE_SERVERS=[{"urls":"turn:turn.example.com:3478","username":"mercury","credential":"replace-me"}]
```

Do not commit production TURN credentials. Set them in the deployment's
environment/secret store. TURN is required for clients behind restrictive or
symmetric NAT where direct UDP and STUN cannot establish a candidate pair.

## Runtime controls

| Variable | Default | Purpose |
|---|---:|---|
| `SCREEN_WEBRTC_ENABLED` | `true` | Enables Android WebRTC; set `false` for MJPEG-only rollback. |
| `SCREEN_WEBRTC_BITRATE` | `1500000` | scrcpy encoder target bitrate (bits/s). |
| `SCREEN_WEBRTC_MAX_SIZE` | `1280` | Maximum encoded video dimension. |
| `SCREEN_WEBRTC_PORT_MIN` | `13000` | First provider UDP port. |
| `SCREEN_WEBRTC_PORT_MAX` | `13100` | Last provider UDP port. |
| `SCREEN_WEBRTC_TIMEOUT` | `8000` | Browser fallback timeout in milliseconds. |

Capture starts when the first authenticated WebRTC peer requests a stream and
stops after the last peer leaves. Background tabs close their peer. Per-session
RTP packet count, byte count, and average bitrate are logged when a peer closes.

## Verification

1. Open an Android device and inspect `chrome://webrtc-internals` (or the
   equivalent browser diagnostics). The selected video codec must be H.264.
2. Confirm the provider log contains `Android H.264 capture started`.
3. Close or background the device page and confirm a `WebRTC peer closed` log.
4. Block UDP `13000-13100`; within the configured timeout the canvas/MJPEG
   stream should appear without rebooking the device.
5. For the plan's go/no-go gate, test at least five physical Android devices
   over the actual remote link and record browser inbound bitrate and end-to-end
   latency. Lab/network measurements cannot be established by unit tests.
