---
title: Mapa de rutas y páginas
description: Todas las rutas del frontend con su propósito y el rol que las ve.
---

# Mapa de rutas y páginas

[← Volver al índice](index.md)

El menú lateral se arma por **rol** en `src/components/layout/nav.ts`
(`buildNavSections`). El `AuthGuard` protege el área `(app)` y bloquea a un
`user` de las rutas de backoffice (`isAdminRoute` / `ADMIN_ROUTES`).

## Rutas públicas (sin sesión)

| Ruta | Propósito | Backend |
|---|---|---|
| `/login` | Acceso + reto **2FA** inline cuando el backend pide `mfaRequired` | `/auth/login`, `/auth/login/2fa` |
| `/register` | Alta de cuenta | `/auth/register` |
| `/recuperar` | Solicitar enlace de recuperación de contraseña | `/auth/forgot-password` |
| `/restablecer` | Fijar nueva contraseña con token | `/auth/reset-password` |
| `/verificar` | **Doble función:** verificación de correo (`?token=`) y handoff KYC desde el móvil (`?t=`, sin login) | `/auth/verify-email`, `/kyc/handoff/verify` |

## Backoffice — operación (`admin` / `operator`)

Sección "Operación" del menú. Todas leen datos de **todos** los usuarios.

| Ruta | Propósito | Backend (principal) |
|---|---|---|
| `/` | Panel de operación: métricas del neobanco en tiempo real | `/admin/stats` |
| `/usuarios` | Clientes con KYC, saldos custodiados y 2FA; editar nombre, resetear contraseña | `/admin/users`, `/admin/users/:id[/reset-password]` |
| `/transacciones` | Todos los movimientos: depósitos, retiros, transferencias y créditos | `/admin/payments` |
| `/kyc` | Cola de revisión de identidad + decisión; enlace al detalle en kyc.zentto.net | `/admin/kyc`, `/kyc/:id/decision` |
| `/disputas` | Arbitraje de trades P2P en disputa (evidencia → release/refund) | `/admin/p2p/disputes`, `/admin/p2p/trades/:id[/messages,/resolve]` |
| `/fees` | Fees/tesorería: comisiones consolidadas por asset | `/admin/treasury` |
| `/custodia` | Hot wallet on-chain por red, gas, barrido de depósitos, solvencia | `/admin/custody`, `/admin/sweep`, `/admin/onchain-activity` |
| `/configuracion` | Tarifas y parámetros editables de la plataforma | `/admin/settings` |

## Banca personal (todos los roles — sección "Mi cuenta")

| Ruta | Propósito | Backend (principal) |
|---|---|---|
| `/cuenta` | Saldo por asset, dirección de depósito, transferencias y retiros | `/accounts/balance`, `/accounts/deposit-address`, `/payments/{transfer,withdraw}` |
| `/pagos` | Historial de movimientos propios | `/payments` |
| `/metodos-pago` | Pago Móvil y cuentas bancarias (cobro en P2P) | `/me/payment-methods` |
| `/p2p` | Mercado P2P: comprar/vender USDT/USDC en bolívares | `/p2p/orders`, `/p2p/trades` |
| `/onchain` | Redes EVM reales: saldos y transacciones on-chain | `/evm/info`, `/evm/address/:a`, `/evm/tx/:h` |
| `/verificacion` | Verificación KYC propia (documentos + selfie, o handoff a móvil por QR) | `/kyc/{status,submit,verify-documents}`, `/kyc/handoff/start` |
| `/mi-cuenta` | Perfil y seguridad del usuario | `/auth/me` |
| `/settings` | 2FA (QR), datos de cuenta y logout | `/auth/2fa/*`, `/auth/logout` |
| `/legal/terminos`, `/legal/privacidad`, `/legal/responsabilidad` | Documentos legales (estáticos) | — |

## Sandbox cadena didáctica (código presente, oculto del menú)

Sección "Sandbox" marcada `hidden` en `nav.ts`: las páginas existen pero no se
muestran en el menú. Laboratorio de la blockchain didáctica original.

| Ruta | Propósito | Backend |
|---|---|---|
| `/wallets` | Crear monederos y ver saldo | `/wallets`, `/wallets/:a/balance` |
| `/enviar` | Firmar y enviar una transferencia | `/wallets/sign`, `/transactions` |
| `/minado` | Minar un bloque (recompensa coinbase) | `/mining`, `/mining/jobs/:id` |
| `/explorer` | Bloques y transacciones, validar cadena | `/chain`, `/chain/validate`, `/blocks/:i` |
| `/analytics` | Grafo de direcciones y hubs | `/analytics/graph`, `/analytics/hubs` |
| `/compliance` | Screening AML + informe IA (markdown) | `/compliance/{status,screen,report}` |

## Reglas de acceso (resumen)

- `ADMIN_ROUTES` enumera las rutas exclusivas de backoffice (incluye el sandbox).
- `isAdminRoute(pathname)` decide si una ruta requiere `admin`/`operator`.
- Un `user` autenticado que abre una ruta de backoffice ve "Sin acceso"; `/` lo
  redirige a `/cuenta`.
- `buildNavSections(role)` devuelve `ADMIN_NAV` para `admin`/`operator` y
  `USER_NAV` para `user`, filtrando secciones/items `hidden`.
