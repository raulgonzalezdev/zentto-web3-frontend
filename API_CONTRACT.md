# Contrato de API — backend Zentto Web3

Base URL (dev): `http://localhost:4100/api`
El frontend corre en `http://localhost:3100` (el backend ya tiene CORS con credenciales para ese origen).

## Reglas de autenticación (críticas)

- **JWT en cookies httpOnly** — NUNCA usar localStorage/sessionStorage para tokens.
- Toda llamada `fetch`/axios debe ir con **`credentials: 'include'`**.
- Cookies que setea el backend: `zw3_access` (15m, httpOnly), `zw3_refresh` (7d, httpOnly), `zw3_csrf` (legible por JS).
- **CSRF double-submit:** en métodos que mutan (`POST/PUT/PATCH/DELETE`) hay que enviar el header `x-csrf-token` con el valor de la cookie `zw3_csrf`. Obtener el token con `GET /auth/csrf` (o leyendo la cookie).
- Si una llamada protegida devuelve `401`, intentar `POST /auth/refresh` una vez y reintentar; si vuelve a fallar, redirigir a login.

## Endpoints de auth

| Método | Ruta | Body | Respuesta | Notas |
|---|---|---|---|---|
| GET | `/auth/csrf` | — | `{ csrfToken }` | También siembra la cookie csrf |
| POST | `/auth/register` | `{ email, password, displayName? }` | `{ user }` + cookies | password ≥ 8 |
| POST | `/auth/login` | `{ email, password }` | `{ mfaRequired:false, user }` **o** `{ mfaRequired:true, mfaToken }` | si 2FA activo → mfaToken |
| POST | `/auth/login/2fa` | `{ mfaToken, code }` | `{ user }` + cookies | code = TOTP 6 dígitos |
| POST | `/auth/refresh` | — (usa cookie) | `{ user }` + rota cookies | |
| GET | `/auth/me` | — | `{ user }` | requiere sesión |
| POST | `/auth/logout` | — | `{ ok }` | requiere sesión + csrf |
| POST | `/auth/2fa/setup` | — | `{ otpauthUrl, qrDataUrl, secret }` | `qrDataUrl` = `<img src>` |
| POST | `/auth/2fa/enable` | `{ code }` | `{ ok }` | verifica primer código |
| POST | `/auth/2fa/disable` | `{ code }` | `{ ok }` | |

`user` = `{ id, email, displayName, totpEnabled }`.

## Endpoints Web3 (públicos — sin auth)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Healthcheck |
| GET | `/chain` | `{ height, blocks[] }` (cada block con `transactions[]`) |
| GET | `/chain/validate` | `{ valid, height, errors[] }` |
| GET | `/blocks/:index` | Bloque por índice |
| GET | `/transactions/pending` | Mempool |
| GET | `/transactions/:id` | Detalle de tx |
| GET | `/wallets/:address/balance` | `{ address, confirmed, available }` |
| GET | `/analytics/graph` | `{ nodes[], edges[] }` |
| GET | `/analytics/hubs?minDegree=5` | Hubs tipo exchange |
| GET | `/analytics/address/:address/relations` | Relaciones in/out |
| GET | `/analytics/trace?from=&to=` | Ruta de fondos (BFS) |
| GET | `/compliance/status` | `{ aiEnabled }` |

## Endpoints Web3 (protegidos — requieren sesión; POST requiere csrf)

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/wallets` | — | `{ address, publicKey, privateKey, warning }` (la privateKey se devuelve UNA vez) |
| POST | `/wallets/sign` | `{ privateKey, toAddress, amount, fee }` | payload firmado `{ fromAddress, toAddress, amount, fee, timestamp, signature }` |
| POST | `/transactions` | payload firmado (el de `/wallets/sign`) | tx creada `{ id, status:'pending', ... }` |
| POST | `/mining` | `{ minerAddress }` | `{ jobId, status:'queued' }` |
| GET | `/mining/jobs/:jobId` | — | `{ jobId, state, result, ... }` (state: queued/active/completed/failed) |
| POST | `/compliance/screen` | `{ address }` | evaluación de riesgo AML |
| POST | `/compliance/report` | `{ address }` | `{ assessment, report }` (report con narrativa IA) |
| GET | `/compliance/screen/:address` | — | evaluación AML |

## Flujo típico (para la demo)

1. Registrarse / login (cookies httpOnly).
2. Crear wallet (guardar `privateKey` en memoria del front, avisar al usuario que no se recupera).
3. Minar un bloque con la address → recibe recompensa (coinbase).
4. Firmar (`/wallets/sign`) y enviar (`/transactions`) una transferencia a otra address.
5. Minar de nuevo → confirma la tx.
6. Ver balances, explorer (bloques/tx), validar cadena.
7. Screening AML + informe de cumplimiento (IA).
8. Analytics: grafo y hubs.

Swagger del backend: `http://localhost:4100/api/docs`.
