"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import {
  ZenttoDataGrid,
  type ColumnDef,
  type GridRow,
} from "@/components/data-grid/ZenttoDataGrid";
import { useAdminUsers } from "@/lib/hooks";
import type { AdminUser, AccountBalance } from "@/lib/types";

/** Normaliza un timestamp (epoch seg/ms o ISO) a ISO-8601 para el grid. */
function toIso(ts: number | string | null | undefined): string {
  if (ts === null || ts === undefined) return "";
  let ms: number;
  if (typeof ts === "string" && /^\d+$/.test(ts)) {
    const n = Number(ts);
    ms = n < 1e12 ? n * 1000 : n;
  } else if (typeof ts === "number") {
    ms = ts < 1e12 ? ts * 1000 : ts;
  } else {
    const d = new Date(ts as string);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/** Saldo `available` de un asset concreto, formateado para mostrar. */
function availableOf(balances: AccountBalance[] | undefined, asset: string): string {
  const b = balances?.find((x) => x.asset?.toUpperCase() === asset);
  if (!b) return "0";
  const n = Number(b.available);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("es-ES", { maximumFractionDigits: 6 }).format(n)
    : b.available;
}

export default function UsuariosPage() {
  const users = useAdminUsers();
  const data = React.useMemo(() => users.data ?? [], [users.data]);

  const rows: GridRow[] = React.useMemo(
    () =>
      data.map((u: AdminUser) => ({
        id: u.id,
        email: u.email ?? "—",
        displayName: u.displayName ?? "—",
        kycStatus: u.kycStatus ?? "not_started",
        usdt: availableOf(u.balances, "USDT"),
        usdc: availableOf(u.balances, "USDC"),
        totp: u.totpEnabled ? "Sí" : "No",
        createdAt: toIso(u.createdAt),
      })),
    [data],
  );

  const cols: ColumnDef[] = [
    { field: "email", header: "Email", minWidth: 220, flex: 1 },
    { field: "displayName", header: "Nombre", minWidth: 160 },
    {
      field: "kycStatus",
      header: "KYC",
      width: 130,
      statusColors: {
        approved: "success",
        in_review: "warning",
        pending: "info",
        rejected: "error",
        needs_more_info: "warning",
        not_started: "default",
      },
    },
    { field: "usdt", header: "USDT", width: 120 },
    { field: "usdc", header: "USDC", width: 120 },
    {
      field: "totp",
      header: "2FA",
      width: 90,
      statusColors: { Sí: "success", No: "default" },
    },
    { field: "createdAt", header: "Alta", type: "datetime", minWidth: 170 },
  ];

  return (
    <Box>
      <PageHeader
        title="Usuarios"
        subtitle="Clientes de Zentto con su estado KYC, saldos custodiados y 2FA."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => users.refetch()}
          >
            Actualizar
          </Button>
        }
      />

      <InfoNote title="Directorio de clientes">
        Cada fila es una cuenta. Los saldos mostrados son el{" "}
        <strong>disponible</strong> (no incluye fondos retenidos). Usa el buscador
        del grid para filtrar por email o nombre.
      </InfoNote>

      {users.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo cargar el listado de usuarios. Verifica tu sesión de operador
          y el backend (/admin/users).
        </Alert>
      )}

      <Card>
        <CardContent>
          <ZenttoDataGrid
            columns={cols}
            rows={rows}
            loading={users.isLoading}
            pageSize={25}
            enableSearch
          />
          {!users.isLoading && rows.length === 0 && !users.isError && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No hay usuarios registrados todavía.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
