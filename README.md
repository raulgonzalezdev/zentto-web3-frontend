# Zentto Web3 — Frontend

Frontend (web + escritorio + móvil) del **neobanco cripto custodial Zentto Web3**.
Una sola app Next.js sirve dos experiencias según el **rol** del usuario que
inicia sesión:

- **Backoffice de operación** (`admin` / `operator`): panel de métricas, gestión
  de usuarios, revisión KYC, arbitraje de disputas P2P, tesorería/fees, custodia
  on-chain y parámetros de la plataforma.
- **Banca personal** (`user`): saldo custodiado, movimientos, mercado P2P,
  verificación de identidad (KYC) y métodos de pago.

Consume exclusivamente la API del backend **zentto-web3** (NestJS). Auth con
**cookies httpOnly + CSRF double-submit + 2FA TOTP** (patrón Zentto Web3); nunca
usa `localStorage` para tokens. Se empaqueta además como app de escritorio/móvil
con **Tauri v2**.

> Documentación técnica completa (arquitectura, mapa de rutas, flujo de auth,
> integración por endpoint, build & deploy):
> **https://raulgonzalezdev.github.io/zentto-web3-frontend/**

## Lugar en el ecosistema

| Repo | Rol | Enlace |
|---|---|---|
| **zentto-web3** | Backend NestJS — neobanco custodial (ledger interno, depósitos on-chain, retiros, TOTP, KYC, P2P). Esta app lo consume. | https://github.com/raulgonzalezdev/zentto-web3 |
| **zentto-web3-frontend** (este repo) | Frontend Next.js — backoffice de operación + banca personal. | https://github.com/raulgonzalezdev/zentto-web3-frontend |
| **zentto-web3-mobile** | App móvil de usuario final (Ionic/Capacitor). | https://github.com/raulgonzalezdev/zentto-web3-mobile |
| **zentto-kyc** | Servicio KYC self-hosted multi-tenant (kyc.zentto.net). El backoffice enlaza al detalle de sesión KYC allí. | https://github.com/zentto-erp/zentto-kyc |

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **MUI 6** (`@mui/material` + `@mui/icons-material`) + Emotion
- **@tanstack/react-query 5** para data fetching, auth y polling
- **@zentto/datagrid** / **@zentto/datagrid-core** 1.5.0 — grids (web component Lit `<zentto-grid>`)
- **@zentto/vertical-layout** 0.1.0 — shell/layout principal (`ZenttoVerticalLayout`)
- **react-markdown** + remark-gfm + rehype-sanitize — informes IA de compliance
- **qrcode.react** — QR del handoff KYC al móvil
- **zod**, **dayjs**
- **Tauri v2** — empaquetado de escritorio (Windows/macOS/Linux) y móvil (Android/iOS)

## Requisitos

- Node.js ≥ 20
- El **backend zentto-web3** corriendo (por defecto `http://localhost:4100/api`),
  con CORS y cookies habilitados para el origen del frontend (`http://localhost:3100`).
- Para compilar Tauri (opcional): **Rust** (`rustup`).

## Setup local

```bash
npm install                       # si hay conflictos peer con React 19: --legacy-peer-deps
cp .env.local.example .env.local  # ajustar NEXT_PUBLIC_API_BASE si el backend no está en :4100
npm run dev                       # http://localhost:3100
```

### Variables de entorno

`.env.local`:

```
# Base de la API del backend Zentto Web3 (NestJS).
NEXT_PUBLIC_API_BASE=http://localhost:4100/api
```

`NEXT_PUBLIC_API_BASE` es la única variable. Si se omite, el frontend usa
`http://localhost:4100/api` (ver `src/lib/endpoints.ts`).

### Scripts (`package.json`)

| Script | Acción |
|---|---|
| `npm run dev` | Dev server en `:3100` |
| `npm run build` | Build de producción (Next) |
| `npm run start` | Sirve el build en `:3100` |
| `npm run export` | `TAURI_BUILD=1 next build` → export estático en `./out` (para Tauri) |
| `npm run lint` | Lint |
| `npm run tauri:dev` / `tauri:build` | Escritorio (dev / binarios) |
| `npm run android:dev` / `ios:dev` | Móvil (requiere SDKs Android/iOS) |

## Estructura de carpetas

```
src/
├─ app/
│  ├─ layout.tsx              # root layout (metadata, color scheme dark)
│  ├─ providers.tsx          # QueryClient + ThemeProvider + AuthProvider + WalletStore
│  ├─ login | register       # acceso + registro (reto 2FA inline)
│  ├─ recuperar | restablecer# recuperación / reset de contraseña
│  ├─ verificar              # PÚBLICA: verificación de correo (?token) + handoff KYC móvil (?t)
│  └─ (app)/                 # área autenticada (AuthGuard + ZenttoAppShell)
│     ├─ layout.tsx          # AuthGuard (sesión + rol) + shell con menú por rol
│     ├─ page.tsx            # Panel de operación (backoffice)
│     ├─ usuarios | transacciones | kyc | disputas | fees | custodia | configuracion
│     ├─ cuenta | pagos | metodos-pago | onchain | p2p | verificacion | mi-cuenta | settings
│     ├─ wallets | enviar | minado | explorer | analytics | compliance  (sandbox cadena didáctica, ocultos del menú)
│     └─ legal/{terminos,privacidad,responsabilidad}
├─ components/
│  ├─ layout/  AuthGuard · ZenttoAppShell · nav.ts · LegalFooter
│  ├─ data-grid/ZenttoDataGrid.tsx        # wrapper client-only del web component Lit
│  ├─ kyc/ CameraCapture · KycDocsCapture # captura de documentos + selfie
│  ├─ analytics/GraphView.tsx
│  ├─ auth/AuthCard.tsx
│  └─ ui/ PageHeader · InfoNote · RiskBadge · Copyable · LegalDoc
└─ lib/
   ├─ endpoints.ts           # mapa central de endpoints + API_BASE
   ├─ api.ts                 # cliente HTTP (CSRF, auto-refresh 401, idempotencia, multipart)
   ├─ hooks.ts               # hooks react-query por dominio
   ├─ auth-context.tsx       # AuthProvider propio (sustituye next-auth)
   ├─ wallet-store.tsx       # privateKeys SOLO en memoria React (sandbox)
   ├─ types.ts               # tipos del dominio
   └─ next-auth-react-shim.tsx  # shim inerte (vertical-layout importa next-auth)
src-tauri/                   # config Tauri v2 (identifier net.zentto.web3)
```

## Mapa de rutas / páginas

El menú lateral se arma por **rol** en `src/components/layout/nav.ts`
(`buildNavSections`). `AuthGuard` protege el área `(app)` y bloquea a un `user`
de las rutas de backoffice (`isAdminRoute`).

### Públicas (sin sesión)

| Ruta | Propósito |
|---|---|
| `/login` | Acceso + reto **2FA** inline cuando el backend pide `mfaRequired` |
| `/register` | Alta de cuenta |
| `/recuperar` | Solicitar enlace de recuperación de contraseña |
| `/restablecer` | Fijar nueva contraseña con token |
| `/verificar` | Verificación de correo (`?token=`) **y** handoff KYC desde el móvil (`?t=`, sin login) |

### Backoffice — operación (`admin` / `operator`)

| Ruta | Propósito |
|---|---|
| `/` | Panel de operación: métricas del neobanco en tiempo real |
| `/usuarios` | Clientes con KYC, saldos custodiados y 2FA; editar nombre / resetear contraseña |
| `/transacciones` | Todos los movimientos: depósitos, retiros, transferencias y créditos |
| `/kyc` | Cola de revisión de identidad + decisión (aprobar/rechazar); enlace al detalle en kyc.zentto.net |
| `/disputas` | Arbitraje de trades P2P en disputa (revisar evidencia, release/refund) |
| `/fees` | Fees/tesorería: comisiones consolidadas por asset |
| `/custodia` | Hot wallet on-chain por red, gas, barrido de depósitos y solvencia |
| `/configuracion` | Tarifas y parámetros editables de la plataforma |

### Banca personal (todos los roles — sección "Mi cuenta")

| Ruta | Propósito |
|---|---|
| `/cuenta` | Saldo por asset, dirección de depósito, transferencias y retiros |
| `/pagos` | Historial de movimientos propios |
| `/metodos-pago` | Pago Móvil y cuentas bancarias (para cobrar en P2P) |
| `/p2p` | Mercado P2P: comprar/vender USDT/USDC en bolívares (order book + trades) |
| `/onchain` | Redes EVM reales (saldos y transacciones on-chain) |
| `/verificacion` | Verificación KYC propia (documentos + selfie, o handoff a móvil por QR) |
| `/settings` | 2FA (QR), datos de cuenta y logout |
| `/legal/{terminos,privacidad,responsabilidad}` | Documentos legales |

### Sandbox cadena didáctica (código presente, **oculto del menú**)

`/wallets`, `/enviar`, `/minado`, `/explorer`, `/analytics`, `/compliance` —
laboratorio de la blockchain didáctica original. El producto los apagó del nav
(`hidden` en `nav.ts`) pero conserva el código.

## Integración con la API zentto-web3

### Flujo de autenticación (cookies httpOnly + CSRF + 2FA)

- Los tokens viven **solo en cookies httpOnly** del backend: `zw3_access` (15m),
  `zw3_refresh` (7d) y `zw3_csrf` (legible por JS). **Nunca** `localStorage`.
- Todas las llamadas van con `credentials: 'include'` (`src/lib/api.ts`).
- En mutaciones (`POST/PUT/PATCH/DELETE`) se envía el header `x-csrf-token` con el
  valor de la cookie `zw3_csrf` (double-submit). Si falta, se pide a `GET /auth/csrf`.
- Ante un `401` en llamada protegida, el cliente intenta **una** vez
  `POST /auth/refresh` y reintenta (lock anti-estampida).
- Operaciones que mutan saldo (`transfer`, `credit`, `withdraw`, `sweep`,
  ofertas P2P) mandan `Idempotency-Key` (uuid por intento).
- 2FA por TOTP: si el login responde `mfaRequired`, se completa con
  `POST /auth/login/2fa`. Activación/desactivación con QR en `/settings`.

`AuthProvider` (`src/lib/auth-context.tsx`) mantiene solo el objeto `user`
(`GET /auth/me`) en react-query; el resto de la sesión vive en cookies.

### Endpoints consumidos (por dominio)

Mapa central en `src/lib/endpoints.ts`; hooks en `src/lib/hooks.ts`.

| Dominio | Endpoints (resumen) |
|---|---|
| Auth | `/auth/csrf` `/auth/register` `/auth/login` `/auth/login/2fa` `/auth/refresh` `/auth/me` `/auth/logout` `/auth/2fa/{setup,enable,disable}` `/auth/{verify-email,forgot-password,reset-password}` |
| Banca | `/accounts/balance` `/accounts/deposit-address` `/accounts/deposits` `/payments` `/payments/{transfer,credit,withdraw}` |
| KYC | `/kyc/{status,submit,verify-documents,pending}` `/kyc/:id/decision` `/kyc/handoff/{start,verify}` |
| P2P | `/p2p/orders` `/p2p/orders/mine` `/p2p/orders/:id/{take,cancel}` `/p2p/trades` `/p2p/trades/:id/{confirm,cancel}` |
| Métodos de pago | `/me/payment-methods` `/me/payment-methods/:id` |
| Admin / backoffice | `/admin/{stats,users,kyc,payments,treasury,custody,sweep,onchain-activity,settings}` `/admin/users/:id[/reset-password]` `/admin/p2p/{disputes,trades/:id[/messages,/resolve]}` |
| On-chain EVM | `/evm/info` `/evm/address/:address` `/evm/tx/:hash` |
| Sandbox cadena | `/chain` `/chain/validate` `/blocks/:i` `/transactions[/pending]` `/wallets[/sign]` `/mining` `/compliance/*` `/analytics/*` |

Ver el contrato detallado del backend en `API_CONTRACT.md`.

## Componentes clave

- **`ZenttoDataGrid`** (`components/data-grid`): wrapper del web component Lit
  `<zentto-grid>` cargado client-only con `next/dynamic` `ssr:false`. Todas las
  tablas del backoffice lo usan (estándar Zentto: nunca `<table>` HTML).
- **`ZenttoAppShell`**: usa `ZenttoVerticalLayout` de `@zentto/vertical-layout`.
  El layout importa `next-auth/react` a nivel de módulo; como esta app usa auth
  propia, el import se redirige a un shim inerte (`next-auth-react-shim.tsx`) vía
  alias en `next.config.mjs`, y se pasan `userName`/`onLogout` explícitos.
- **`AuthGuard`**: exige sesión y aplica control por rol; un `user` que entra a
  una ruta de backoffice ve "Sin acceso" (y `/` redirige a `/cuenta`).
- **`CameraCapture` / `KycDocsCapture`**: captura de documento (anverso/reverso)
  y selfie por webcam para verificación KYC, incluido el handoff público móvil.

## Build & deploy

No hay CI ni Dockerfile en el repo: se distribuye como app **Tauri** (escritorio
+ móvil) a partir del export estático de Next.

```bash
# 1. Instalar Rust: https://rustup.rs
# 2. Generar iconos (una vez): npm run tauri icon ./logo.png
# 3. Escritorio:
npm run tauri:dev      # ventana nativa + Next en :3100
npm run tauri:build    # binarios de escritorio
# Móvil (SDKs Android/iOS):
npm run android:dev
npm run ios:dev
```

`next.config.mjs` activa `output: 'export'` + `images.unoptimized` solo cuando
`TAURI_BUILD=1`; en `next dev`/web normal se ignora.

## Notas

- Diseño **mobile-first** / responsive (el sidebar colapsa a drawer en móvil).
- **Sin datos mock**: todo va contra la API real del backend.
- La `privateKey` del sandbox de wallets vive **solo en memoria React**
  (`wallet-store.tsx`); nunca se persiste y se pierde al recargar (intencional).
