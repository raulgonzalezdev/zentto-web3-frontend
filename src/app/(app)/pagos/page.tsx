"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
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
import { usePayments } from "@/lib/hooks";

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

export default function PagosPage() {
  const payments = usePayments();
  const data = payments.data ?? [];

  const rows: GridRow[] = React.useMemo(
    () =>
      data.map((p) => ({
        id: p.id,
        type: p.type,
        asset: p.asset,
        amount: p.amount,
        status: p.status,
        counterparty: p.counterparty ?? "—",
        createdAt: toIso(p.createdAt),
      })),
    [data],
  );

  const cols: ColumnDef[] = [
    {
      field: "type",
      header: "Tipo",
      width: 130,
      statusColors: {
        transfer: "info",
        credit: "success",
        deposit: "success",
        debit: "warning",
        withdrawal: "warning",
      },
    },
    { field: "asset", header: "Asset", width: 110 },
    { field: "amount", header: "Monto", minWidth: 140 },
    {
      field: "status",
      header: "Estado",
      width: 140,
      statusColors: {
        completed: "success",
        confirmed: "success",
        pending: "warning",
        failed: "error",
        reversed: "error",
      },
    },
    { field: "counterparty", header: "Contraparte", flex: 1, minWidth: 200 },
    { field: "createdAt", header: "Fecha", type: "datetime", minWidth: 180 },
  ];

  return (
    <Box>
      <PageHeader
        title="Pagos"
        subtitle="Historial de movimientos de tu cuenta."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => payments.refetch()}
          >
            Actualizar
          </Button>
        }
      />

      <InfoNote title="Tu historial">
        Cada fila es un movimiento custodiado: transferencias internas, créditos
        de faucet y otros. El <strong>estado</strong> indica si ya se liquidó.
      </InfoNote>

      {payments.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo cargar el historial. Verifica tu sesión y el backend (:4100).
        </Alert>
      )}

      <Card>
        <CardContent>
          <ZenttoDataGrid
            columns={cols}
            rows={rows}
            loading={payments.isLoading}
            pageSize={25}
          />
          {!payments.isLoading && rows.length === 0 && !payments.isError && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Aún no hay movimientos. Acredita saldo o realiza una transferencia
              desde Cuenta / Saldo.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
