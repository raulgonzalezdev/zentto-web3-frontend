---
title: Autenticación e integración con el backend
description: Flujo cookies httpOnly + CSRF + 2FA, cliente HTTP y endpoints consumidos.
---

# Autenticación e integración con el backend

[← Volver al índice](index.md)

El frontend consume exclusivamente la API del backend
[zentto-web3](https://github.com/raulgonzalezdev/zentto-web3) (NestJS).
Base configurable con `NEXT_PUBLIC_API_BASE` (default `http://localhost:4100/api`).

## Flujo de autenticación

Patrón **Zentto Web3**: tokens en cookies httpOnly + CSRF double-submit + 2FA TOTP.

| Cookie | TTL | Visibilidad |
|---|---|---|
| `zw3_access` | 15 min | httpOnly |
| `zw3_refresh` | 7 días | httpOnly |
| `zw3_csrf` | — | legible por JS (double-submit) |

Reglas implementadas en `src/lib/api.ts`:

1. **`credentials: 'include'`** en toda llamada (las cookies viajan solas).
2. **CSRF**: en métodos que mutan (`POST/PUT/PATCH/DELETE`) se envía el header
   `x-csrf-token` con el valor de la cookie `zw3_csrf`. Si falta, se obtiene con
   `GET /auth/csrf` (`ensureCsrf`).
3. **Auto-refresh**: ante un `401`, se intenta **una** vez `POST /auth/refresh`
   y se reintenta la petición. Un lock (`refreshInFlight`) evita la estampida.
4. **Idempotencia**: operaciones que mutan saldo mandan `Idempotency-Key` (uuid
   por intento): transferencias, créditos, retiros, barrido de custodia y
   creación/toma de órdenes P2P.
5. **Multipart**: `apiPostForm` sube imágenes (KYC) sin fijar `Content-Type`
   (el browser añade el boundary). El handoff público (`/verificar?t=`) usa
   `requireAuth:false`: no manda CSRF ni refresca; se autentica con el token del body.

### Sesión y 2FA

`AuthProvider` (`src/lib/auth-context.tsx`) mantiene solo el objeto `user`:

- sondea `GET /auth/me` al cargar (sin refresh para evitar un 401 extra);
- `login(email, password)` → si responde `mfaRequired`, la UI muestra el reto y
  llama `loginWith2fa(mfaToken, code)` (`POST /auth/login/2fa`);
- `register`, `logout`, y `setup2fa` / `enable2fa` / `disable2fa` (QR en `/settings`).

`user = { id, email, displayName, totpEnabled, role }`. El `role`
(`user` | `operator` | `admin`) determina menú y rutas accesibles.

## Cliente HTTP (`api`)

```ts
api.get(path)                 // GET
api.post(path, body, { idempotencyKey })  // POST (+ CSRF, refresh, idempotencia)
api.put / api.patch / api.del              // mutaciones
api.postForm(path, formData, { requireAuth })  // multipart (KYC)
```

Errores → `ApiError { status, message, body }` (mensaje extraído de
`message` string|string[] del backend).

## Endpoints consumidos por dominio

Mapa central en `src/lib/endpoints.ts`; hooks en `src/lib/hooks.ts`.

### Auth
`/auth/csrf` · `/auth/register` · `/auth/login` · `/auth/login/2fa` ·
`/auth/refresh` · `/auth/me` · `/auth/logout` ·
`/auth/2fa/{setup,enable,disable}` ·
`/auth/{verify-email,forgot-password,reset-password}`

### Banca custodial (usuario)
`/accounts/balance` · `/accounts/deposit-address` · `/accounts/deposits` ·
`/payments` · `/payments/:id` · `/payments/transfer` · `/payments/credit` ·
`/payments/withdraw` (retiro on-chain: requiere `totpCode`)

### KYC
- Usuario: `/kyc/status` · `/kyc/submit` · `/kyc/verify-documents` ·
  `/kyc/handoff/start` · `/kyc/handoff/verify` (público, token en body)
- Operador: `/kyc/pending` · `/kyc/:id/decision`

### P2P (order book entre usuarios)
`/p2p/orders` · `/p2p/orders/mine` · `/p2p/orders/:id/{take,cancel}` ·
`/p2p/trades` · `/p2p/trades/:id/{confirm,cancel}`

### Métodos de pago del perfil
`/me/payment-methods` · `/me/payment-methods/:id`

### Admin / backoffice (datos de todos los usuarios)
`/admin/stats` · `/admin/users` · `/admin/users/:id` ·
`/admin/users/:id/reset-password` · `/admin/kyc` · `/admin/payments` ·
`/admin/treasury` · `/admin/custody` · `/admin/sweep` ·
`/admin/onchain-activity` · `/admin/settings` ·
`/admin/p2p/disputes` · `/admin/p2p/trades/:id[/messages,/resolve]`

### On-chain EVM (redes reales)
`/evm/info` · `/evm/address/:address` · `/evm/tx/:hash`

### Sandbox cadena didáctica
`/chain` · `/chain/validate` · `/blocks/:i` · `/transactions[/pending]` ·
`/transactions/:id` · `/wallets[/sign]` · `/wallets/:a/balance` · `/mining` ·
`/mining/jobs/:id` · `/compliance/{status,screen,report}` · `/analytics/{graph,hubs,...}`

## Polling (react-query)

| Vista | Intervalo |
|---|---|
| Saldo de cuenta, pagos | 15 s |
| Cola KYC, métricas admin, payments admin, tesorería, custodia, onchain | 20–30 s |
| P2P órdenes / trades | 10–12 s |
| Job de minado (sandbox) | 1.5 s hasta estado terminal |
| Estado KYC en handoff (desktop esperando al móvil) | 3 s hasta estado terminal |

Las mutaciones invalidan las queries afectadas (p.ej. una transferencia invalida
saldo + historial; un trade P2P invalida P2P + saldo por el escrow).

## Guía de uso por rol

- **Operador / admin**: entra en `/` (panel). Revisa KYC en `/kyc`, arbitra
  disputas en `/disputas`, controla fondos en `/custodia` (barrido de depósitos,
  solvencia), ajusta tarifas en `/configuracion` y gestiona clientes en
  `/usuarios`. También dispone de su banca personal.
- **Usuario**: entra en `/cuenta`. Deposita on-chain, transfiere, retira (con
  TOTP), opera en P2P, verifica su identidad en `/verificacion` (puede continuar
  la captura en el móvil escaneando el QR del handoff) y gestiona métodos de pago.
