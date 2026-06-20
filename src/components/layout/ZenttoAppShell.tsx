"use client";

/**
 * ZenttoAppShell — layout principal de la app usando `@zentto/vertical-layout`
 * (`ZenttoVerticalLayout`). Reemplaza el stand-in MUI `AppShell.tsx`.
 *
 * Auth: sigue contra el backend Web3 propio via `useAuth()` (NO next-auth).
 * Se pasan `userName` y `onLogout` explicitos para que el layout no dependa de
 * la sesion de next-auth (su import esta alias-eado a un shim inerte en
 * `next.config.mjs`).
 *
 * El responsive (drawer permanente/colapsable en desktop, temporal en movil) lo
 * provee el propio `ZenttoVerticalLayout`.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { ZenttoVerticalLayout } from "@zentto/vertical-layout";
import HexagonIcon from "@mui/icons-material/Hexagon";
import { NAV_SECTIONS } from "./nav";
import { useAuth } from "@/lib/auth-context";

/**
 * Convierte `NAV_SECTIONS` (formato propio { title, items:[{label, href, icon}] })
 * al descriptor jerarquico que espera ZenttoVerticalLayout:
 *   { kind: 'header', title } | { kind: 'page', segment, title, icon } | { kind: 'divider' }
 * `segment` es la ruta sin el slash inicial ('' para la raiz '/').
 */
function buildNavigationFields(): Array<Record<string, unknown>> {
  const fields: Array<Record<string, unknown>> = [];
  NAV_SECTIONS.forEach((section, i) => {
    fields.push({ kind: "header", title: section.title });
    section.items.forEach((item) => {
      const Icon = item.icon;
      fields.push({
        kind: "page",
        segment: item.href.replace(/^\//, ""),
        title: item.label,
        icon: <Icon fontSize="small" />,
      });
    });
    if (i < NAV_SECTIONS.length - 1) fields.push({ kind: "divider" });
  });
  return fields;
}

export function ZenttoAppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const navigationFields = React.useMemo(() => buildNavigationFields(), []);

  const handleLogout = React.useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [logout, router]);

  const userName = user?.displayName || user?.email || "Usuario";

  return (
    <ZenttoVerticalLayout
      navigationFields={navigationFields}
      appTitle="Zentto Web3"
      logoIcon={<HexagonIcon color="primary" />}
      userName={userName}
      onLogout={handleLogout}
    >
      {children}
    </ZenttoVerticalLayout>
  );
}

export default ZenttoAppShell;
