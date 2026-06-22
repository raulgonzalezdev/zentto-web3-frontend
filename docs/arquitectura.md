---
title: Arquitectura del frontend
description: Stack, capas, providers, layout y la integración con los paquetes @zentto/*.
---

# Arquitectura del frontend

[← Volver al índice](index.md)

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **MUI 6** + Emotion (tema oscuro por defecto)
- **@tanstack/react-query 5** — fetching, cache, polling y estado de auth
- **@zentto/datagrid** / **@zentto/datagrid-core** 1.5.0 — tablas (web component Lit)
- **@zentto/vertical-layout** 0.1.0 — shell/layout (`ZenttoVerticalLayout`)
- **react-markdown** (+ remark-gfm, rehype-sanitize) — informes IA de compliance
- **qrcode.react** — QR del handoff KYC al móvil
- **zod**, **dayjs**
- **Tauri v2** — empaquetado escritorio + móvil

## Capas

```
app/ (rutas, App Router)
  └─ providers.tsx ── QueryClient · ThemeProvider(MUI) · AuthProvider · WalletStore
       └─ (app)/layout ── AuthGuard (sesión + rol) → ZenttoAppShell (menú por rol)
            └─ páginas ── usan hooks de lib/hooks.ts (react-query)
                              └─ lib/api.ts (cliente HTTP: CSRF, refresh, idempotencia)
                                   └─ lib/endpoints.ts (mapa central + API_BASE)
```

| Archivo | Responsabilidad |
|---|---|
| `src/lib/endpoints.ts` | Mapa central de endpoints y `API_BASE` (`NEXT_PUBLIC_API_BASE`). |
| `src/lib/api.ts` | Cliente HTTP: `credentials:'include'`, CSRF double-submit, auto-refresh ante 401, `Idempotency-Key`, subida multipart (`apiPostForm`). |
| `src/lib/hooks.ts` | Hooks react-query por dominio (banca, KYC, P2P, admin, EVM, sandbox). |
| `src/lib/auth-context.tsx` | `AuthProvider` propio: mantiene `user` (`GET /auth/me`); login/2FA/registro/logout. |
| `src/lib/types.ts` | Tipos del dominio (User, AccountBalance, Payment, KYC, P2P, Admin, EVM…). |
| `src/lib/wallet-store.tsx` | `privateKey` del sandbox solo en memoria React (nunca persiste). |

## Providers

`src/app/providers.tsx` envuelve la app en (de fuera a dentro):

1. `QueryClientProvider` — react-query (`staleTime` 30s, `retry` 1, sin refetch on focus).
2. `ThemeProvider` (MUI) + `CssBaseline` — tema oscuro por defecto.
3. `AuthProvider` — sesión propia contra el backend.
4. `WalletStoreProvider` — almacén en memoria de claves del sandbox.

El root layout (`src/app/layout.tsx`) fija `defaultMode="dark"` con
`InitColorSchemeScript` para evitar parpadeo de hidratación.

## Layout y control de acceso

- **`(app)/layout.tsx`** = `AuthGuard` + `ZenttoAppShell`.
- **`AuthGuard`** (`components/layout/AuthGuard.tsx`): si no hay sesión redirige a
  `/login`; si el rol es `user` y la ruta es de backoffice (`isAdminRoute`),
  muestra "Sin acceso" (y `/` se redirige a `/cuenta`).
- **`ZenttoAppShell`** (`components/layout/ZenttoAppShell.tsx`): usa
  `ZenttoVerticalLayout` de `@zentto/vertical-layout`. Construye el menú con
  `buildNavSections(user.role)` y traduce el modelo de `nav.ts` al descriptor
  jerárquico (`header` / `page` / `divider`) que espera el layout.

## Integración con paquetes `@zentto/*`

| Componente local | Paquete |
|---|---|
| `components/data-grid/ZenttoDataGrid.tsx` (wrapper client-only via `next/dynamic` `ssr:false`) | `@zentto/datagrid` / `@zentto/datagrid-core` |
| `components/layout/ZenttoAppShell.tsx` → `ZenttoVerticalLayout` | `@zentto/vertical-layout` |

**Shim de next-auth.** `ZenttoVerticalLayout` importa `next-auth/react` a nivel
de módulo. Esta app **no** usa next-auth (auth propia contra el backend), así que
el import se redirige a un shim inerte (`src/lib/next-auth-react-shim.tsx`) vía
alias en `next.config.mjs` (tanto en Turbopack como en webpack); al layout se le
pasan `userName` y `onLogout` explícitos.

## Componentes de UI propios

| Componente | Uso |
|---|---|
| `ui/PageHeader` | Título + subtítulo de cada página. |
| `ui/InfoNote` | Cajas explicativas ("¿qué es esto?"). |
| `ui/RiskBadge` | Badge de severidad de riesgo (AML/compliance). |
| `ui/Copyable` | Texto copiable (direcciones, hashes). |
| `ui/LegalDoc` | Render de documentos legales. |
| `auth/AuthCard` | Tarjeta de las páginas públicas de auth. |
| `kyc/CameraCapture`, `kyc/KycDocsCapture` | Captura de documento + selfie por webcam. |
| `analytics/GraphView` | Grafo de direcciones (sandbox). |

## Empaquetado Tauri

`src-tauri/tauri.conf.json`: `identifier` `net.zentto.web3`, `frontendDist`
`../out`, `devUrl` `http://localhost:3100`, `beforeBuildCommand` `npm run export`.
El export estático solo se activa con `TAURI_BUILD=1` (lo fija `npm run export`).
