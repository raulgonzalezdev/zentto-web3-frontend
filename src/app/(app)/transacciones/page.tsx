"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import {
  ZenttoDataGrid,
  type ColumnDef,
  type GridRow,
} from "@/components/data-grid/ZenttoDataGrid";
import { useAdminPayments } from "@/lib/hooks";
import type { PaymentType } from "@/lib/types";

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

/** Tabs -> filtro de tipo para GET /admin/payments?type=. */
const TABS: { label: string; type?: PaymentType }[] = [
  { label: "Todos", type: undefined },
  { label: "Depósitos", type: "deposit" },
  { label: "Retiros", type: "withdrawal" },
  { label: "Transferencias", type: "transfer" },
  { label: "Créditos", type: "credit" },
];

export default function TransaccionesPage() {
  const [tab, setTab] = React.useState(0);
  const type = TABS[tab].type;
  const query = useAdminPayments(type);
  const data = React.useMemo(() => query.data ?? [], [query.data]);

  const rows: GridRow[] = React.useMemo(
    () =>
      data.map((p) => ({
        id: p.id,
        email: p.email ?? "—",
        type: p.type,
        asset: p.asset,
        amount: p.amount,
        status: p.status,
        counterparty: p.counterparty ?? "—",
        failureReason: p.failureReason ?? "—",
        createdAt: toIso(p.createdAt),
      })),
    [data],
  );

  const cols: ColumnDef[] = [
    { field: "email", header: "Email", minWidth: 200, flex: 1 },
    {
      field: "type",
      header: "Tipo",
      width: 130,
      statusColors: {
        transfer: "info",
        credit: "success",
        debit: "warning",
        deposit: "success",
        withdrawal: "warning",
      },
    },
    { field: "asset", header: "Asset", width: 100 },
    { field: "amount", header: "Monto", minWidth: 130 },
    {
      field: "status",
      header: "Estado",
      width: 140,
      statusColors: {
        completed: "success",
        confirmed: "success",
        pending: "warning",
        processing: "info",
        failed: "error",
        reversed: "error",
      },
    },
    { field: "counterparty", header: "Contraparte", minWidth: 180 },
    { field: "failureReason", header: "Motivo de fallo", minWidth: 180 },
    { field: "createdAt", header: "Fecha", type: "datetime", minWidth: 170 },
  ];

  return (
    <Box>
      <PageHeader
        title="Transacciones"
        subtitle="Todos los movimientos del neobanco: depósitos, retiros, transferencias y créditos."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => query.refetch()}
          >
            Actualizar
          </Button>
        }
      />

      <InfoNote title="Libro de movimientos">
        Filtra por tipo con las pestañas. El <strong>estado</strong> indica si el
        movimiento ya se liquidó; los retiros en proceso pueden requerir
        reconciliación manual. La columna <strong>motivo de fallo</strong> explica
        los movimientos fallidos.
      </InfoNote>

      {query.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudieron cargar las transacciones. Verifica tu sesión de operador
          y el backend (/admin/payments).
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ mb: 2 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {TABS.map((t) => (
              <Tab key={t.label} label={t.label} />
            ))}
          </Tabs>

          <ZenttoDataGrid
            columns={cols}
            rows={rows}
            loading={query.isLoading}
            pageSize={25}
            enableSearch
          />
          {!query.isLoading && rows.length === 0 && !query.isError && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No hay transacciones en esta vista.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
