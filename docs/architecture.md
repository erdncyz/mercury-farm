# Mercury Device Farm — Architecture Document

> **Version:** 1.5.0  
> **Platform:** macOS (optimized for macOS since iOS automation requires Xcode tooling on host)  
> **License:** Apache-2.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Backend Architecture](#4-backend-architecture)
   - 4.1 [Microservice Structure (CLI-Based)](#41-microservice-structure-cli-based)
   - 4.2 [Service Catalog](#42-service-catalog)
   - 4.3 [Messaging Layer (ZeroMQ + Protocol Buffers)](#43-messaging-layer-zeromq--protocol-buffers)
   - 4.4 [Database Layer (MongoDB)](#44-database-layer-mongodb)
   - 4.5 [Authentication](#45-authentication)
   - 4.6 [REST API](#46-rest-api)
   - 4.7 [WebSocket Server](#47-websocket-server)
5. [Frontend Architecture](#5-frontend-architecture)
   - 5.1 [Application Entry Point and Provider Chain](#51-application-entry-point-and-provider-chain)
   - 5.2 [Routing](#52-routing)
   - 5.3 [State Management](#53-state-management)
   - 5.4 [Dependency Injection (InversifyJS)](#54-dependency-injection-inversifyjs)
   - 5.5 [API Layer](#55-api-layer)
   - 5.6 [Component Organization](#56-component-organization)
   - 5.7 [Internationalization (i18n)](#57-internationalization-i18n)
6. [Device Lifecycle](#6-device-lifecycle)
   - 6.1 [Android Device Flow](#61-android-device-flow)
   - 6.2 [iOS Device Flow](#62-ios-device-flow)
   - 6.3 [Screen Streaming Architecture](#63-screen-streaming-architecture)
   - 6.4 [Reaper (Cleanup) Mechanism](#64-reaper-cleanup-mechanism)
7. [Infrastructure and Deployment](#7-infrastructure-and-deployment)
   - 7.1 [Docker Compose Topology](#71-docker-compose-topology)
   - 7.2 [Nginx Reverse Proxy](#72-nginx-reverse-proxy)
   - 7.3 [SSL/TLS](#73-ssltls)
   - 7.4 [Network Topology](#74-network-topology)
8. [Wire Protocol (Message Types)](#8-wire-protocol-message-types)
9. [Directory Structure](#9-directory-structure)
10. [Security Architecture](#10-security-architecture)

---

## 1. Overview

Mercury Device Farm is a **device farm** platform that enables remote control of real Android and iOS devices through a browser. Users can view devices via the web interface, reserve them, watch their screens live, send touch inputs, install applications, and run ADB/shell commands.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Real-Time Screen Streaming** | Live screen transmission via Android (Minicap/Scrcpy) and iOS (WebDriverAgent MJPEG) |
| **Remote Touch Control** | Touch, swipe, and type inputs from the browser |
| **Application Management** | APK/IPA install, uninstall, app listing |
| **Group & Team Management** | Organize devices into groups, scheduling, user/team-based access |
| **Multi-Auth Support** | Mock, LDAP, OAuth2, OpenID Connect, SAML2 |
| **File System Access** | Device file explorer (push/pull) |
| **Shell Access** | Remote ADB/shell command execution |
| **Logcat Streaming** | Real-time Android logcat output monitoring |
| **Tizen TV Support** | Samsung Smart TV support |
| **VNC Support** | Device connection via VNC |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER (Browser)                             │
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

## 3. Tech Stack

### Backend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | 20.18.0 | Server runtime environment |
| **Language** | TypeScript + JavaScript | 5.9.x | Type-safe development |
| **HTTP Framework** | Express.js | 4.21.2 | REST API and static file serving |
| **Database** | MongoDB | 7.0 | Document-based data storage (Replica Set) |
| **Messaging** | ZeroMQ | 6.4.2 | Inter-service asynchronous messaging |
| **Serialization** | Protocol Buffers | protobuf-ts | Binary message serialization |
| **WebSocket** | Socket.IO | 4.7.5 | Real-time client-server communication |
| **WebSocket (Raw)** | ws | 5.2.4 | Binary screen streaming |
| **Authentication** | Passport.js | 0.6.0 | Multi-auth strategies |
| **JWT** | jws | 3.2.2 | Token-based authorization |
| **Device Communication** | @u4/adbkit | 5.1.7 | Android ADB protocol |
| **iOS Automation** | WebDriverAgent (Appium) | 11.4.0 | iOS device control |
| **Tizen** | appium-sdb | 1.0.1-beta | Samsung Tizen support |
| **USB (iOS)** | @irdk/usbmux | 0.2.2 | iOS USB multiplexing |
| **Screen Capture** | minicap-prebuilt | 1.1.2 | Android screen capture |
| **Touch Input** | minitouch-prebuilt | 1.3.0 | Android touch simulation |
| **File Storage** | @aws-sdk/client-s3 | 3.772.x | S3-compatible object storage |
| **Error Tracking** | @sentry/node | 8.34.x | Error reporting and monitoring |
| **CLI Framework** | yargs | 17.7.2 | Command-line interface |
| **API Documentation** | swagger-ui-express + express-openapi | — | OpenAPI/Swagger |
| **Rate Limiting** | express-rate-limit | 7.3.1 | API request rate limiting |
| **Serial Port** | serialport | 13.0.0 | Serial communication (ESP32 etc.) |
| **VNC** | rfb2 | 0.2.2 | VNC protocol support |
| **LDAP** | ldapjs | 1.0.2 | LDAP directory integration |

### Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **UI Framework** | React | 18.3.1 | Component-based user interface |
| **Build Tool** | Vite | 6.4.x | Fast development and bundling |
| **Transpiler** | SWC (via @vitejs/plugin-react-swc) | — | Fast TypeScript/JSX compilation |
| **Language** | TypeScript | 5.5.x | Type-safe frontend development |
| **State Management** | MobX | 6.13.5 | Reactive state management |
| **State Persistence** | mobx-persist-store | 1.1.5 | Persist MobX state to localStorage |
| **Server State** | TanStack React Query | 5.59.x | API data management, cache, retry |
| **Table** | TanStack React Table | 8.20.5 | Advanced table components |
| **Virtualization** | TanStack React Virtual | 3.10.8 | Virtual scrolling for large lists |
| **DI Container** | InversifyJS | 6.2.1 | Dependency injection |
| **Routing** | React Router | 7.0.2 | Hash-based page routing |
| **UI Kit** | VKUI (VKontakte) | 7.1.2 | Base UI component library |
| **HTTP Client** | Axios | 1.12.0 | REST API requests |
| **WebSocket Client** | Socket.IO Client | 4.8.0 | Real-time communication |
| **i18n** | i18next + react-i18next | 23.x / 15.x | Multi-language support (EN, TR) |
| **Date** | date-fns | 4.1.0 | Date utilities |
| **Testing** | Vitest + Testing Library | 3.0.x | Unit tests |
| **Mocking** | MSW (Mock Service Worker) | 2.6.0 | API mocking |
| **Code Generation** | Orval | 7.3.0 | TypeScript types from OpenAPI |
| **Scaffolding** | Plop | 4.0.1 | Code template generator |
| **Linting** | ESLint 9 + Prettier + Stylelint | — | Code quality |
| **SVG** | vite-plugin-svgr | 4.2.0 | SVG → React component conversion |

### Infrastructure

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Containerization** | Docker + Docker Compose | Service orchestration |
| **Reverse Proxy** | Nginx (bookworm) | TLS termination, routing, WebSocket proxy |
| **SSL** | omgwtfssl (self-signed) | Automatic self-signed certificate generation |
| **Database** | MongoDB 7.0 (Replica Set) | Change Streams support via RS |

---

## 4. Backend Architecture

### 4.1 Microservice Structure (CLI-Based)

Mercury's backend uses a microservice architecture that lives in a **single monorepo** but runs as **independent processes**. Each service is launched via the `mercury <command>` CLI:

```bash
mercury api --port 3000 --secret=xxx
mercury app --port 3000 --auth-url https://...
mercury provider --adb-host 127.0.0.1 --connect-sub tcp://...
```

This approach is implemented with the **yargs** CLI framework. Each command module exports:
- `command` — Command name
- `describe` — Description
- `builder` — CLI argument definitions
- `handler` — Execution function

All services use the same Docker image (launched with different `command`), simplifying deployment.

### 4.2 Service Catalog

```
┌─────────────────────────────────────────────────────────────┐
│                       CORE SERVICES                         │
├─────────────────┬───────────────────────────────────────────┤
│ app             │ React SPA static file server               │
│ api             │ REST API (Express + OpenAPI/Swagger)        │
│ auth-*          │ Authentication (5 strategies)               │
│ websocket       │ Socket.IO real-time event server            │
│ processor       │ Central message router (App ↔ Device)      │
├─────────────────┼───────────────────────────────────────────┤
│                      DEVICE SERVICES                        │
├─────────────────┼───────────────────────────────────────────┤
│ provider        │ Android device provider (worker management)│
│ ios-provider    │ iOS device provider (runs on host)          │
│ device          │ Android device worker process               │
│ ios-device      │ iOS device worker process                   │
│ tizen-device    │ Tizen TV device support                     │
│ vnc-device      │ VNC device support                          │
├─────────────────┼───────────────────────────────────────────┤
│                   INFRASTRUCTURE SERVICES                   │
├─────────────────┼───────────────────────────────────────────┤
│ triproxy        │ ZeroMQ message broker (PUB/DEALER/PULL)    │
│ reaper          │ Heartbeat monitoring & device cleanup       │
│ groups-engine   │ Group scheduling & lifecycle                │
│ poorxy          │ HTTP proxy                                  │
├─────────────────┼───────────────────────────────────────────┤
│                      STORAGE SERVICES                       │
├─────────────────┼───────────────────────────────────────────┤
│ storage-temp    │ Temporary file storage                      │
│ storage-plugin-apk   │ APK upload processing                 │
│ storage-plugin-image │ Image processing                      │
│ storage-s3      │ AWS S3-compatible storage                   │
├─────────────────┼───────────────────────────────────────────┤
│                      DATA MANAGEMENT                        │
├─────────────────┼───────────────────────────────────────────┤
│ migrate         │ Database schema migration                   │
│ migrate-to-mongo│ RethinkDB → MongoDB migration tool         │
│ log-mongodb     │ MongoDB log writer                          │
├─────────────────┼───────────────────────────────────────────┤
│                      UTILITY TOOLS                          │
├─────────────────┼───────────────────────────────────────────┤
│ doctor          │ System health checker                       │
│ generate-fake-* │ Test data generator (device/user/group)     │
│ generate-service-user │ Service account creator               │
│ local           │ Run all services in a single process        │
└─────────────────┴───────────────────────────────────────────┘
```

### 4.3 Messaging Layer (ZeroMQ + Protocol Buffers)

Mercury uses the **ZeroMQ** message queue system for inter-service communication. Two separate **TriProxy** instances handle message routing:

#### TriProxy Architecture

```
                      APP SIDE                            DEVICE SIDE
              ┌─────────────────────┐            ┌─────────────────────┐
              │   TriProxy-App      │            │   TriProxy-Dev      │
              │                     │            │                     │
  Subscribe ←─│ PUB    :7150        │            │ PUB    :7250  ──→ Subscribe
              │                     │            │                     │
  Req/Reply ──│ DEALER :7160        │            │ DEALER :7260 ──Req/Reply
              │                     │            │                     │
  Send msg ───│ PULL   :7170        │            │ PULL   :7270 ──Send msg
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

#### ZeroMQ Socket Patterns

| Pattern | Usage |
|---------|-------|
| **PUB/SUB** | Broadcast messages (device state, user changes) |
| **PUSH/PULL** | Guaranteed one-way message delivery |
| **DEALER** | Request-reply based communication |

#### Protocol Buffers Envelope Structure

All messages are wrapped in an `Envelope`:

```protobuf
message Envelope {
    required google.protobuf.Any message = 2;
    optional string channel = 3;
}
```

The `channel` field determines the message's target channel (a device, user, or global channel).

### 4.4 Database Layer (MongoDB)

#### Connection Configuration

- **Database:** `mercury` (default, configurable via `MONGODB_DB_NAME`)  
- **Connection:** `MONGODB_PORT_27017_TCP` env variable or `mongodb://127.0.0.1:27017`  
- **Replica Set:** `mercury-rs` (required for Change Streams)

#### Collection Structure

| Collection | Primary Key | Description |
|------------|-------------|-------------|
| `users` | `email` | User profiles and settings |
| `devices` | `serial` | Device states and metadata |
| `groups` | `id` | Device groups and scheduling |
| `teams` | — | Team structures |
| `accessTokens` | `id` | API access tokens |
| `vncauth` | `password` | VNC authentication |
| `logs` | `id` | System logs |
| `stats` | `id` | Statistics |

#### Change Streams

MongoDB's **Change Stream** feature is used to monitor collection changes in real time. Collections are created with `ChangeStreamPreAndPostImages` enabled:

- **GroupChangeHandler** → Listens to group changes, broadcasts via ZMQ
- **UserChangeHandler** → Listens to user changes, broadcasts via ZMQ

This allows database changes to be automatically propagated to all connected clients.

#### Model Layer

```
lib/db/
├── index.ts           ← MongoDB connection and ZMQ socket management
├── api.ts             ← Aggregated model API
├── setup.ts           ← Collection and index creation
├── tables.ts          ← Collection definitions
├── models/
│   ├── all/           ← Model combining all entities
│   ├── device/        ← Device CRUD and state queries
│   ├── group/         ← Group management queries
│   ├── team/          ← Team management
│   └── user/          ← User management
└── handlers/
    ├── group/         ← MongoDB Change Stream listener
    └── user/          ← MongoDB Change Stream listener
```

### 4.5 Authentication

Mercury supports 5 different authentication strategies:

| Strategy | CLI Command | Usage |
|----------|------------|-------|
| **Mock** | `auth-mock` | Development/test environment (form-based) |
| **LDAP** | `auth-ldap` | Enterprise directory integration |
| **OAuth2** | `auth-oauth2` | Third-party OAuth2 providers |
| **OpenID Connect** | `auth-openid` | OpenID Connect protocol |
| **SAML2** | `auth-saml2` | Enterprise SAML2 SSO |

Authentication flow:
1. User is redirected to the auth page
2. Identity is verified with the selected strategy
3. **JWT token** is generated and returned to the client
4. Token is used in API requests via `Authorization: Bearer <token>` header
5. For WebSocket connections, token is passed as subprotocol: `access_token.${token}`

### 4.6 REST API

- **Framework:** Express.js
- **Documentation:** OpenAPI/Swagger (`/api/v1/docs`)
- **Authentication:** JWT-based `accessTokenAuth` middleware
- **Rate Limiting:** Request rate limiting via `express-rate-limit`
- **Error Tracking:** Sentry integration

Main endpoint groups:
- `/api/v1/devices` — Device listing, details, state updates
- `/api/v1/groups` — Group CRUD, device/user assignment
- `/api/v1/teams` — Team management
- `/api/v1/users` — User management, admin authorization
- `/api/v1/user` — Current user profile, access tokens

### 4.7 WebSocket Server

Socket.IO-based real-time communication server:

- **Cookie-Session** authentication
- **Channel-based subscription** system (subscribing to ZMQ messages)
- Emitted events:
  - `device.change` — Device state changes
  - `user.change` — User changes
  - `group.change` — Group changes
  - `logcat.entry` — Logcat lines
  - `tx.progress` / `tx.done` — Transaction progress

---

## 5. Frontend Architecture

> The web UI is **proprietary** and lives in the private `mercury-ui` repository,
> referenced as a git submodule at `ui/`. The public repo does not contain UI
> source; the prebuilt Docker image already includes the compiled UI.

### 5.1 Application Entry Point and Provider Chain

The application starts with `main.tsx` → `createRootWithProviders()`:

```
<StrictMode>
  <QueryClientProvider>              ← TanStack React Query
    <DIContainerProvider>            ← InversifyJS Container
      <AppWrapper>                   ← VKUI Theme Provider
        <ReactQueryDevtools />       ← Developer tools
        <App />                      ← Main application
      </AppWrapper>
    </DIContainerProvider>
  </QueryClientProvider>
</StrictMode>
```

### 5.2 Routing

**Hash Router** is used (`#/devices`, `#/control/:serial`):

| Route | Page | Description |
|-------|------|-------------|
| `/` and `/devices` | DevicesPage | Device list, search, statistics |
| `/control/:serial` | ControlPage | Remote device control (screen + panel) |
| `/control/:serial/info` | ControlPage (info) | Device detail information |
| `/settings` | SettingsPage | Admin panel |
| `/settings/keys` | SettingsPage | ADB key management |
| `/settings/groups` | SettingsPage | Group management |
| `/settings/teams` | SettingsPage | Team management |
| `/settings/devices` | SettingsPage | Device settings |
| `/settings/users` | SettingsPage | User management |
| `/settings/shell` | SettingsPage | Shell access |
| `/groups` | GroupsPage | Group viewing |

All routes are protected with the `<RequireAuth />` guard component.

### 5.3 State Management

Mercury UI uses a **hybrid** state management approach:

#### MobX (Client State)

| Store | Scope | Responsibility |
|-------|-------|---------------|
| `AuthStore` | Global (Singleton) | JWT management, localStorage persistence |
| `DeviceListStore` | Global | Real-time device list via Socket.IO |
| `CurrentUserProfileStore` | Global | Logged-in user information |
| `GlobalToastStore` | Global | Error notifications |
| `DeviceScreenStore` | Per device | H.264 WebSocket stream, canvas rendering |
| `DeviceControlStore` | Per device | Device commands, quality settings |
| `DeviceConnection` | Per device | Device lifecycle (connect/disconnect) |
| `ShellControlStore` | Per device | Shell command history |

#### TanStack React Query (Server State)

- **MobxQuery** wrapper wraps React Query with MobX atoms
- **MobxMutation** wrapper integrates mutations with MobX `runInAction`
- Type-safe query keys via query key factory
- Retry strategy: 6 retries in production, exponential backoff (1s → 30s max)

### 5.4 Dependency Injection (InversifyJS)

Two-level DI container architecture:

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
│  │  Device Container (Per Device)     │   │
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
│  │  • ... (40+ services)            │   │
│  └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

Services marked with the `@deviceConnectionRequired()` decorator can only be used when there is an active device connection.

### 5.5 API Layer

```
ui/src/api/
├── mercury-api/
│   ├── mercury-api-client.ts    ← Axios instance + interceptors
│   ├── routes.ts                ← Endpoint path definitions
│   ├── index.ts                 ← API functions (getDevices, getUsers, etc.)
│   └── types.ts                 ← Request/response types
├── auth/
│   ├── auth-client.ts           ← Auth API requests
│   └── routes.ts                ← Auth endpoints
├── socket.ts                    ← Socket.IO client configuration
└── interceptors.ts              ← Token attachment, 401 redirect, error extraction
```

**Interceptor Chain:**
1. **Request:** `attachTokenOnRequest` → Adds JWT token to header
2. **Response (error):** `logoutOnErrorResponse` → Redirects to auth page on 401
3. **Response (error):** `extractMessageOnErrorResponse` → Sends error message to toast

**Type Generation with Orval:** TypeScript types are auto-generated from the backend's OpenAPI spec (`lib/units/api/swagger/api_v1.yaml`) → `src/generated/types/`

### 5.6 Component Organization

```
ui/src/components/
├── app/                         ← Main application shell
│   ├── app.tsx                  ← Router integration
│   ├── app-router/              ← Route definitions + auth guard
│   └── providers/               ← Theme provider
│
├── views/ (Page Components)
│   ├── devices-page/            ← Device list + statistics
│   ├── control-page/            ← Remote control (screen + panel split)
│   ├── settings-page/           ← Admin page (6 tabs)
│   ├── groups-page/             ← Group management
│   └── auth/                    ← Auth pages (LDAP, Mock)
│
├── ui/ (Reusable Components)
│   ├── device/                  ← Device display
│   │   ├── device-screen/       ← Canvas + WebSocket streaming
│   │   ├── device-top-bar/      ← Device info header
│   │   └── device-navigation-buttons/
│   ├── device-control-panel/    ← Control panel
│   │   └── tabs/
│   │       ├── dashboard-tab/   ← Device status
│   │       ├── info-tab/        ← Detail information
│   │       ├── logs-tab/        ← Logcat
│   │       ├── advanced-tab/    ← Advanced commands
│   │       └── file-explorer-tab/  ← File explorer
│   ├── device-cards/            ← Card view
│   ├── device-table/            ← Table view
│   ├── device-statistics/       ← Summary cards
│   ├── settings-tabs/           ← Keys, Groups, Teams, Users, Devices, Shell tabs
│   ├── header/                  ← Top menu
│   ├── search-device/           ← Device search
│   └── modals/                  ← Modal dialogs
│
└── lib/ (Infrastructure Components)
    ├── conditional-render/      ← Conditional rendering
    ├── base-modal/              ← Base modal component
    ├── base-select/             ← Base select component
    ├── error-fallback/          ← Error boundary component
    ├── tabs-panel/              ← Tab panel
    └── ... (25+ base components)
```

### 5.7 Internationalization (i18n)

- **Supported Languages:** English (en), Turkish (tr)
- **Library:** i18next + react-i18next + i18next-browser-languagedetector
- **Translation Loading:** Via HTTP backend from `/locales/{lang}.json` files
- **Language Detection Order:** localStorage → cookie → default (en)

---

## 6. Device Lifecycle

### 6.1 Android Device Flow

```
ADB Connection Detection
        │
        ▼
┌─────────────────┐
│   Provider       │  USB/ADB connection monitored via ADBObserver
│   (ProcessMgr)   │  Port pair allocated (ResourcePool)
└────────┬────────┘
         │ fork()
         ▼
┌─────────────────┐
│  Device Worker   │  25 plugins loaded (syrup dependency injection)
│  (Android)       │
│                  │  Plugins:
│  • heartbeat     │  - Sends heartbeat every 10s
│  • stream        │  - Minicap/Scrcpy screen capture
│  • touch         │  - Minitouch input simulation
│  • service       │  - STF Service APK management
│  • shell         │  - ADB shell access
│  • install       │  - APK install/uninstall
│  • logcat        │  - Log streaming
│  • connect       │  - ADB bridge remote connection
│  • forward       │  - Port forwarding
│  • group         │  - Ownership/reservation management
│  • solo          │  - Unique device registration
│  • ...           │
└────────┬────────┘
         │ DeviceIntroductionMessage
         ▼
┌─────────────────┐
│   Processor      │  Registers device in DB
│                  │  present: true, ready: false
└────────┬────────┘
         │ DevicePresentMessage (Reaper TTLSet)
         ▼
┌─────────────────┐
│   Reaper         │  Adds to TTLSet (30s timeout)
│                  │  Monitors heartbeats
└────────┬────────┘
         │ DeviceReadyMessage (all plugins ready)
         ▼
    Device READY FOR USE
```

### 6.2 iOS Device Flow

```
USB Connection (usbmuxd)
        │
        ▼
┌─────────────────┐
│  iOS Provider    │  Runs on host (outside Docker)
│  (macOS native)  │  Device detection via libimobiledevice
└────────┬────────┘
         │ fork()
         ▼
┌─────────────────┐
│ iOS Device Worker│
│                  │
│  • wda/client    │  - WebDriverAgent startup and management
│  • wda/connect   │  - WDA HTTP proxy
│  • screen/stream │  - MJPEG streaming (via WDA)
│  • info          │  - Device information
│  • heartbeat     │  - Heartbeat mechanism
│  • group         │  - Ownership management
│  • solo          │  - Unique registration
└────────┬────────┘
         │ DeviceIosIntroductionMessage
         ▼
    (Same Processor → Reaper → Ready flow)
```

### 6.3 Screen Streaming Architecture

```
┌─────────────────┐                ┌─────────────────┐
│  Android Device  │                │   iOS Device     │
│                  │                │                  │
│  Minicap/Scrcpy  │                │  WebDriverAgent  │
│  (Screen Capture)│                │  (MJPEG Stream)  │
└────────┬────────┘                └────────┬────────┘
         │ Raw frame (Binary)               │ MJPEG
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
│             Browser (DeviceScreenStore)            │
│                                                   │
│   WebSocket → Frame decode → OffscreenCanvas      │
│            → ImageBitmapRenderingContext           │
│            → <canvas> render                      │
│                                                   │
│   Reconnect: Exponential backoff                  │
│   (3s → 6s → 12s → 24s → 48s → 96s, 3min max)   │
└──────────────────────────────────────────────────┘
```

### 6.4 Reaper (Cleanup) Mechanism

The Reaper monitors device health using the **TTLSet** data structure:

```
Heartbeat Flow:
  Device → DeviceHeartbeatMessage → Reaper TTLSet.bump(serial)
                                          │
                                     30s Timer Reset
                                          │
                            ┌──────────────┴──────────────┐
                            │                              │
                     Timer Reset OK                  Timer Expired!
                     (device healthy)               (heartbeat stopped)
                            │                              │
                            ▼                              ▼
                    Continue...              DeviceAbsentMessage
                                                    │
                                                    ▼
                                            present: false
                                            ready: false
                                            DB update
                                            User notification
```

---

## 7. Infrastructure and Deployment

### 7.1 Docker Compose Topology

macOS deployment includes 17 containers + 1 host process:

```
┌──────────────────────────────────────────────────────┐
│                Docker Network: mercury                 │
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
│                     macOS Host                        │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │           iOS Provider (Native)               │    │
│  │  • libimobiledevice/usbmuxd                   │    │
│  │  • Xcode toolchain                            │    │
│  │  • WebDriverAgent                             │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

#### Startup Order (Dependency Chain)

```
MongoDB → MongoSetup (RS init) → Migrate (schema)
    → All services start in parallel
    → Nginx (depends on all services)
    → SSL certificate generation (depends on Nginx)
```

### 7.2 Nginx Reverse Proxy

| Route Pattern | Target | Description |
|---------------|--------|-------------|
| `/` | mercury-app:3000 | React SPA |
| `/auth/*` | mercury-auth:3000 | Auth pages |
| `/api/v1/*` | mercury-api:3000 | REST API |
| `/socket.io/*` | mercury-websocket:3000 | Socket.IO |
| `/d/mercury-provider/<port>/*` | provider:port | Android screen stream |
| `/d/mercury-ios-provider/<port>/*` | host:port | iOS screen stream |

**Performance Settings:**
- Gzip compression enabled
- TCP optimizations (nodelay, nopush, sendfile)
- Upload: 1024MB max body
- WebSocket timeout: 600s
- Buffering disabled (real-time streaming)

### 7.3 SSL/TLS

- **Automatic self-signed certificate** generation (`paulczar/omgwtfssl` image)
- TLSv1.2 and TLSv1.3 support
- Certificates mounted to Nginx via Docker volume (`certs`)

### 7.4 Network Topology

- **Docker bridge network:** `mercury` — all containers on this network
- **Host access:** `host.docker.internal` for container-to-host communication
- **iOS provider:** Runs on host, outside Docker (`host-gateway`)
- **Port range:** Android devices get dynamic ports in `12010-12100`
- **ZeroMQ ports:** `7150-7170` (app), `7250-7270` (dev)

---

## 8. Wire Protocol (Message Types)

50+ message types defined with Protocol Buffers:

### Device Lifecycle Messages

| Message | Direction | Description |
|---------|-----------|-------------|
| `DeviceIntroductionMessage` | Device → Processor | New device registration |
| `DeviceIosIntroductionMessage` | iOS Device → Processor | iOS device registration |
| `DevicePresentMessage` | Reaper → Broadcast | Device present |
| `DeviceAbsentMessage` | Reaper → Broadcast | Device absent |
| `DeviceReadyMessage` | Device → Broadcast | Device ready for use |
| `DeviceStatusMessage` | Device → Broadcast | Status update |
| `DeviceHeartbeatMessage` | Device → Reaper | Heartbeat signal |

### User & Group Messages

| Message | Description |
|---------|-------------|
| `UserChangeMessage` | User data change |
| `GroupChangeMessage` | Group data change |
| `JoinGroupMessage` | Add device to group |
| `LeaveGroupMessage` | Remove device from group |
| `JoinGroupByAdbFingerprintMessage` | Join group by ADB fingerprint |

### Event Messages

| Message | Description |
|---------|-------------|
| `AirplaneModeEvent` | Airplane mode change |
| `BatteryEvent` | Battery status |
| `RotationEvent` | Screen rotation |
| `ConnectStartedMessage` | Remote connection started |
| `ConnectStoppedMessage` | Remote connection stopped |
| `TransactionProgressMessage` | Transaction progress |
| `TransactionDoneMessage` | Transaction completed |

### Operation Messages

| Message | Description |
|---------|-------------|
| `InstallMessage` | Application install |
| `UninstallMessage` | Application uninstall |
| `ShellCommandMessage` | Shell command execution |
| `ForwardCreateMessage` | Port forward creation |
| `ScreenCaptureMessage` | Screen capture |

---

## 9. Directory Structure

```
mercury-farm/
│
├── bin/                             # CLI entry points
│   ├── mercury.mjs                  # Main CLI (tsx runner)
│   └── mercury-compat.mjs           # Compatibility layer
│
├── lib/                             # Backend source code
│   ├── cli/                         # CLI command definitions
│   │   ├── index.js                 # Yargs main configuration
│   │   ├── api/                     # API server command
│   │   ├── app/                     # Frontend server command
│   │   ├── auth-mock/               # Mock auth command
│   │   ├── auth-ldap/               # LDAP auth command
│   │   ├── auth-oauth2/             # OAuth2 auth command
│   │   ├── auth-openid/             # OpenID auth command
│   │   ├── auth-saml2/              # SAML2 auth command
│   │   ├── device/                  # Android device command
│   │   ├── ios-device/              # iOS device command
│   │   ├── ios-provider/            # iOS provider command
│   │   ├── provider/                # Android provider command
│   │   │   └── ADBObserver.ts       # ADB connection monitor
│   │   ├── processor/               # Message processor command
│   │   ├── reaper/                  # Heartbeat monitor command
│   │   ├── triproxy/                # ZMQ proxy command
│   │   ├── websocket/               # WebSocket server command
│   │   ├── groups-engine/           # Groups engine command
│   │   ├── storage-plugin-apk/      # APK storage command
│   │   ├── storage-plugin-image/    # Image storage command
│   │   ├── storage-s3/              # S3 storage command
│   │   ├── storage-temp/            # Temp storage command
│   │   ├── migrate/                 # DB migration command
│   │   ├── migrate-to-mongo/        # RethinkDB → Mongo migration
│   │   ├── doctor/                  # System health check
│   │   ├── generate-fake-device/    # Test device generator
│   │   ├── generate-fake-user/      # Test user generator
│   │   ├── generate-fake-group/     # Test group generator
│   │   ├── generate-service-user/   # Service account generator
│   │   ├── local/                   # Single process mode
│   │   ├── log-mongodb/             # MongoDB log writer
│   │   ├── poorxy/                  # HTTP proxy
│   │   └── vnc-device/              # VNC device command
│   │
│   ├── units/                       # Service business logic
│   │   ├── api/                     # REST API (Express + Swagger)
│   │   │   ├── controllers/         # Endpoint handlers
│   │   │   ├── paths/               # Route definitions
│   │   │   ├── swagger/             # OpenAPI specification
│   │   │   └── helpers/             # Helper functions
│   │   ├── app/                     # SPA server
│   │   ├── auth/                    # Auth strategies
│   │   │   ├── mock.js              # Mock auth
│   │   │   ├── ldap.js              # LDAP auth
│   │   │   ├── oauth2/              # OAuth2 auth
│   │   │   ├── openid.js            # OpenID auth
│   │   │   └── saml2.js             # SAML2 auth
│   │   ├── base-device/             # Base device functionality
│   │   │   ├── plugins/             # Common plugins (heartbeat, group, solo)
│   │   │   └── support/             # ZMQ push/router/connector
│   │   ├── device/                  # Android device
│   │   │   └── plugins/             # 25 plugins (screen, touch, shell, etc.)
│   │   ├── ios-device/              # iOS device
│   │   │   └── plugins/             # WDA, screen, info plugins
│   │   ├── tizen-device/            # Tizen TV device
│   │   ├── vnc-device/              # VNC device
│   │   ├── provider/                # Android device provider
│   │   │   └── ProcessManager       # Worker process management
│   │   ├── ios-provider/            # iOS device provider
│   │   ├── processor/               # Central message router
│   │   ├── websocket/               # Socket.IO server
│   │   ├── groups-engine/           # Group scheduling engine
│   │   ├── reaper/                  # Heartbeat monitor
│   │   ├── storage/                 # Storage services
│   │   └── log/                     # Logging unit
│   │
│   ├── db/                          # Database layer
│   │   ├── index.ts                 # Connection + ZMQ sockets
│   │   ├── api.ts                   # Aggregated model API
│   │   ├── setup.ts                 # Collection/index creation
│   │   ├── tables.ts                # Collection definitions
│   │   ├── models/                  # Data models
│   │   └── handlers/                # Change Stream listeners
│   │
│   ├── wire/                        # Message protocol
│   │   ├── wire.proto               # Protocol Buffer definitions
│   │   ├── router.ts                # Message router
│   │   └── index.ts                 # Wire helpers
│   │
│   ├── util/                        # Utility modules
│   │   ├── logger.ts                # Structured logging
│   │   ├── zmqutil.js               # ZeroMQ socket factory
│   │   ├── wireutil.js              # Wire protocol helpers
│   │   ├── jwtutil.js               # JWT operations
│   │   ├── ProcessManager.ts        # Process management
│   │   ├── lifecycle.ts             # Process lifecycle
│   │   ├── srv.ts                   # DNS SRV resolution
│   │   ├── lockutil.js              # Distributed locking
│   │   ├── ttlset.ts                # TTL-based set data structure
│   │   └── ...                      # 30+ utility modules
│   │
│   └── types/                       # TypeScript type definitions
│
├── ui/                              # Frontend application
│   ├── src/
│   │   ├── api/                     # API clients (Axios, Socket.IO)
│   │   ├── components/
│   │   │   ├── app/                 # Application shell and router
│   │   │   ├── views/               # Page components
│   │   │   ├── ui/                  # Reusable components
│   │   │   └── lib/                 # Base UI components
│   │   ├── config/
│   │   │   ├── i18n/                # Language configuration
│   │   │   ├── inversify/           # DI containers
│   │   │   └── queries/             # React Query configuration
│   │   ├── store/                   # MobX stores
│   │   ├── services/                # Business logic services
│   │   ├── lib/
│   │   │   ├── hooks/               # 45+ custom React hooks
│   │   │   └── utils/               # 40+ utility functions
│   │   ├── types/                   # TypeScript types
│   │   ├── constants/               # Constants
│   │   ├── generated/               # Orval-generated types
│   │   └── styles/                  # Global styles
│   ├── auth/                        # Auth HTML pages
│   └── public/                      # Static files
│
├── WebDriverAgent/                  # iOS automation tool
│   ├── lib/                         # WDA TypeScript library
│   ├── WebDriverAgentLib/           # Objective-C library
│   ├── WebDriverAgentRunner/        # Xcode test runner
│   └── WebDriverAgent.xcodeproj/    # Xcode project
│
├── vendor/                          # Third-party tools
│   ├── minirev/                     # Screen reverse tool
│   └── STFService/                  # Android service APK
│
├── scripts/                         # Deployment scripts
│   ├── nginx.conf                   # Nginx configuration
│   ├── variables.env                # Environment variables
│   ├── mongo_setup.sh               # MongoDB RS setup
│   ├── start-ios-provider.sh        # iOS provider launcher
│   └── ...                          # Other helper scripts
│
├── docs/                            # Documentation
├── docker-compose-macos.yaml        # Docker Compose definition
├── Dockerfile                       # Multi-stage Docker image
├── package.json                     # Backend dependencies
└── tsconfig.json                    # TypeScript configuration
```

---

## 10. Security Architecture

### Authentication and Authorization

| Layer | Mechanism |
|-------|-----------|
| **API Requests** | JWT Bearer token (`Authorization` header) |
| **WebSocket** | Cookie-session + JWT subprotocol |
| **Screen Streaming** | JWT validation + device ownership check |
| **Auth Strategies** | 5 different strategies (Mock, LDAP, OAuth2, OpenID, SAML2) |
| **Rate Limiting** | API protection via express-rate-limit |
| **CSRF** | csurf middleware |

### Network Security

| Layer | Mechanism |
|-------|-----------|
| **TLS** | TLSv1.2 + TLSv1.3 termination at Nginx |
| **Internal Network** | Docker bridge network (no external access) |
| **Inter-service** | ZeroMQ TCP (internal network only) |
| **Proxy** | Real IP tracking via X-Forwarded-For |

### Device Security

- Devices can only be controlled by the assigned user
- Ownership checks happen at the ZMQ message layer
- No direct device control via API — all through ZMQ/WebSocket

### Docker Security

- Non-root user (`mercury-user`) for container execution
- Multi-stage build (runtime dependencies only)
- Minimal base image (node:20.18.0-bullseye-slim)

---

> **Note:** This document reflects Mercury Device Farm v1.5.0.
