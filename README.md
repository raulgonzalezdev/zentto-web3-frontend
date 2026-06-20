# Zentto Web3 — Frontend

Frontend educativo para el backend **Zentto Web3** (blockchain didáctica:
wallets, minado, explorer, cumplimiento AML e analítica de grafo).

Pensado para personas **nuevas en web3**: cada pantalla incluye textos
explicativos y tooltips (qué es una address, un bloque, PoW, la mempool, AML…).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **MUI 6** (`@mui/material` + `@mui/icons-material`) + Emotion
- **@tanstack/react-query 5** para datos y autenticación
- **react-markdown** + remark-gfm + rehype-sanitize (informe IA en markdown)
- **qrcode.react** disponible; el QR de 2FA se pinta con el `qrDataUrl` que ya
  entrega el backend (`<img src>`)
- **zod**, **dayjs**
- **Tauri v2** para empaquetar como app de escritorio y móvil

## Requisitos

- Node.js ≥ 20
- El **backend Zentto Web3** corriendo en `http://localhost:4100/api`
  (con CORS y cookies habilitados para `http://localhost:3100`).
- Para compilar Tauri (opcional): **Rust** (`rustup`) — ver más abajo.

## Cómo correr

```bash
npm install            # si hay conflictos de peer con React 19: npm install --legacy-peer-deps
cp .env.local.example .env.local
npm run dev            # http://localhost:3100
```

Scripts:

| Script | Acción |
|---|---|
| `npm run dev` | Dev server en `:3100` |
| `npm run build` | Build de producción (Next) |
| `npm run start` | Sirve el build en `:3100` |
| `npm run export` | `TAURI_BUILD=1 next build` → genera `./out` (export estático para Tauri) |
| `npm run lint` | Lint |

## Variables de entorno

`.env.local`:

```
NEXT_PUBLIC_API_BASE=http://localhost:4100/api
```

## Autenticación (cookies httpOnly + CSRF + 2FA)

- Los tokens viven **solo en cookies httpOnly** del backend
  (`zw3_access`, `zw3_refresh`, `zw3_csrf`). **Nunca** se usa localStorage.
- Todas las llamadas van con `credentials: 'include'`.
- En mutaciones (POST/PUT/PATCH/DELETE) se envía el header `x-csrf-token`
  leído de la cookie `zw3_csrf` (double-submit). Si no existe, se pide a
  `GET /auth/csrf`.
- Ante un `401`, el cliente intenta **una** vez `POST /auth/refresh` y reintenta.
- Páginas: `/login`, `/register`, reto **2FA** (cuando `mfaRequired`), y
  activar/desactivar **2FA** con QR en `/settings`.

Implementación: `src/lib/api.ts`, `src/lib/auth-context.tsx`.

## Páginas

| Ruta | Descripción |
|---|---|
| `/login`, `/register` | Acceso + registro; reto 2FA inline |
| `/` (Panel) | Estado de la cadena (altura, validez, pendientes), accesos rápidos, explicación para novatos |
| `/wallets` | Crear wallet (la **privateKey** se muestra UNA vez, solo en memoria), ver balance |
| `/enviar` | Firmar (`/wallets/sign`) + enviar (`/transactions`) una transferencia |
| `/minado` | Lanzar minado y ver el job **en vivo** (polling a `/mining/jobs/:id`) |
| `/explorer` | Grids de bloques y transacciones + botón "Validar cadena" |
| `/compliance` | Screening AML + informe IA (markdown) con badges de riesgo |
| `/analytics` | Grafo (nodos/aristas) + hubs |
| `/settings` | 2FA (QR), datos de cuenta, logout |

## Seguridad de claves privadas

La `privateKey` de una wallet:

- la devuelve el backend **una sola vez** y **no se recupera**;
- se guarda **exclusivamente en memoria React** (`src/lib/wallet-store.tsx`);
- **nunca** se persiste en localStorage, sessionStorage ni cookies;
- al recargar la página se pierde (es intencional). Hay un aviso fuerte en la UI.

## Componentes stand-in (pendientes de swap a `@zentto/*`)

Los paquetes privados `@zentto/*` y `next-auth` **no** están instalados todavía
(token npm privado pendiente). Se reemplazarán cuando el token esté listo. Por
ahora hay stand-ins con la **misma forma de props** para un swap directo:

| Stand-in local | Reemplaza a |
|---|---|
| `src/components/data-grid/ZenttoDataGrid.tsx` (MUI `<Table>`, nunca `<table>` HTML) | `@zentto/datagrid` / `@zentto/datagrid-core` |
| `src/components/layout/AppShell.tsx` (sidebar colapsable + topbar) | `@zentto/vertical-layout` |
| `src/lib/auth-context.tsx` (cliente propio con react-query) | `@zentto/auth-client` / `next-auth` |

## Tauri (escritorio + móvil)

Config lista en `src-tauri/` (Tauri v2):

- `identifier`: `net.zentto.web3`, `productName`: "Zentto Web3"
- `build.frontendDist`: `../out`, `build.devUrl`: `http://localhost:3100`
- Next configurado para export estático en `next.config.mjs`
  (`output: 'export'` + `images.unoptimized` cuando `TAURI_BUILD=1`).

**Requiere Rust** (no incluido). Para compilar:

```bash
# 1. Instalar Rust: https://rustup.rs
# 2. Generar iconos (una vez): npm run tauri icon ./logo.png
# 3. Escritorio:
npm run tauri:dev      # dev (arranca Next en :3100 y la ventana nativa)
npm run tauri:build    # binarios de escritorio

# Móvil (requiere SDKs Android/iOS):
npm run android:dev
npm run ios:dev
```

> Este repo **no** compila Tauri en CI; la config queda lista para cuando haya
> toolchain de Rust disponible.

## Notas

- Diseño **mobile-first** / responsive (sidebar colapsa a Drawer en móvil).
- **Sin datos mock**: todo va contra la API real en `:4100`.
- `@zentto/*` y `next-auth` se añadirán cuando el token npm privado esté listo.
