---
title: Zentto Web3 — Frontend
description: Documentación técnica del frontend del neobanco cripto custodial Zentto Web3.
---

# Zentto Web3 — Frontend

Documentación técnica y de uso del **frontend** del neobanco cripto custodial
**Zentto Web3**. Es una app **Next.js 16 (App Router)** que, con una sola base de
código y según el **rol** del usuario autenticado, ofrece:

- un **backoffice de operación** para el equipo de Zentto (`admin` / `operator`), y
- una **banca personal** para el usuario final (`user`).

Consume exclusivamente la API del backend [zentto-web3](https://github.com/raulgonzalezdev/zentto-web3)
(NestJS) y se empaqueta además como app de escritorio/móvil con **Tauri v2**.

## Páginas de esta documentación

| Página | Contenido |
|---|---|
| [Arquitectura del frontend](arquitectura.md) | Stack, capas, providers, layout, integración con `@zentto/*` |
| [Mapa de rutas y páginas](rutas.md) | Todas las rutas con su propósito y rol, y el menú por rol |
| [Autenticación e integración con el backend](auth.md) | Flujo cookies/CSRF/2FA, cliente HTTP, endpoints por dominio |

## El frontend en el ecosistema

| Repo | Rol |
|---|---|
| [zentto-web3](https://github.com/raulgonzalezdev/zentto-web3) | Backend NestJS — neobanco custodial. Esta app lo consume. |
| **zentto-web3-frontend** (este) | Frontend Next.js — backoffice + banca personal. |
| [zentto-web3-mobile](https://github.com/raulgonzalezdev/zentto-web3-mobile) | App móvil de usuario final (Ionic/Capacitor). |
| [zentto-kyc](https://github.com/zentto-erp/zentto-kyc) | Servicio KYC self-hosted (kyc.zentto.net); el backoffice enlaza al detalle de sesión. |

## Visión general

El usuario inicia sesión en `/login`. El backend responde con cookies httpOnly
(`zw3_access`, `zw3_refresh`, `zw3_csrf`) y, si tiene 2FA activo, un reto TOTP.
A partir de ahí, el `AuthGuard` del área `(app)` exige sesión y resuelve el menú
y las rutas accesibles según `user.role`:

- `admin` / `operator` → backoffice (panel, usuarios, transacciones, KYC,
  disputas P2P, fees/tesorería, custodia, configuración) **más** su propia banca.
- `user` → solo banca personal (cuenta, pagos, P2P, verificación KYC, métodos de
  pago). Si intenta entrar a una ruta de backoffice, ve "Sin acceso".

Todo el data fetching usa **react-query** con polling en las vistas vivas
(saldos, cola KYC, disputas, métricas). Las tablas usan el grid corporativo
`@zentto/datagrid` (`<zentto-grid>`).

## Configuración

Una sola variable de entorno (`.env.local`):

```
NEXT_PUBLIC_API_BASE=http://localhost:4100/api
```

Si se omite, por defecto `http://localhost:4100/api` (ver `src/lib/endpoints.ts`).

## Arranque rápido

```bash
npm install
cp .env.local.example .env.local
npm run dev    # http://localhost:3100
```

Requiere el backend zentto-web3 corriendo con CORS+cookies para el origen
`http://localhost:3100`.

## Build & deploy

El repo no tiene CI ni Dockerfile: se distribuye como app **Tauri** (escritorio
+ móvil) a partir del export estático de Next.

```bash
npm run tauri:dev      # ventana nativa + Next en :3100
npm run tauri:build    # binarios de escritorio
npm run android:dev    # móvil (requiere SDK Android)
npm run ios:dev        # móvil (requiere toolchain iOS)
```

`next.config.mjs` activa `output: 'export'` + `images.unoptimized` solo cuando
`TAURI_BUILD=1` (lo fija `npm run export`, que es el `beforeBuildCommand` de
Tauri). En `next dev` / web normal el export se ignora.
