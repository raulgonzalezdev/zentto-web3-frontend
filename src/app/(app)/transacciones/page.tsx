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
import { shortHash } from "@/lib/format";

/** ¿Es un hash on-chain? EVM (0x… 66 chars) o Tron (T… base58). */
function isOnchainHash(v: string): boolean {
  return /^0x[0-9a-fA-F]{40,}$/.test(v) || /^T[1-9A-HJ-NP-Za-km-z]{25,}$/.test(v);
}

/** Explorer por defecto (BSC mainnet) o derivado de la red de la fila si existe. */
function explorerTxUrl(hash: string, network?: unknown): string {
  const net = String(network ?? "").toLowerCase();
  if (/tron|trc/.test(net) || /^T[1-9A-HJ-NP-Za-km-z]{25,}$/.test(hash)) {
    return `https://tronscan.org/#/transaction/${hash}`;
  }
  if (/eth|ethereum|mainnet/.test(net)) return `https://etherscan.io/tx/${hash}`;
  if (/polygon|matic/.test(net)) return `https://polygonscan.com/tx/${hash}`;
  // BSC es la red principal y el fallback por defecto.
  return `https://bscscan.com/tx/${hash}`;
}

/** Escapa texto para insertarlo de forma segura en el HTML de una celda del grid. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
        // network puede venir como campo extra del payload (index signature).
        network: (p as Record<string, unknown>).network ?? "",
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
    {
      field: "counterparty",
      header: "Hash on-chain / Contraparte",
      minWidth: 230,
      // Si el valor es un hash 0x… o T… (Tron), lo acorta y enlaza al explorer.
      renderCell: (value, row) => {
        const v = String(value ?? "").trim();
        if (!v || v === "—") return "—";
        if (!isOnchainHash(v)) return esc(v);
        const short = esc(shortHash(v, 10, 8));
        const url = explorerTxUrl(v, (row as Record<string, unknown>).network);
        return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(v)}" style="text-decoration:underline">${short} ↗</a>`;
      },
    },
    { field: "failureReason", header: "Motivo de fallo", minWidth: 180 },
    { field: "createdAt", header: "Fecha", type: "datetime", minWidth: 170 },
  ];

  return (
    <Box>
      <PageHeader
        title="Transacciones"
        subtitle="Todos los movimientos de Zentto: depósitos, retiros, transferencias y créditos."
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
        reconciliación manual. En depósitos y retiros, la columna{" "}
        <strong>Hash on-chain / Contraparte</strong> enlaza al explorer de la red
        cuando el valor es un hash de transacción. La columna{" "}
        <strong>motivo de fallo</strong> explica los movimientos fallidos.
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
