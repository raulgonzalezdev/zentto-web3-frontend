"use client";

import * as React from "react";
import {
  Box,
  Button,
  Tabs,
  Tab,
  Alert,
  Stack,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VerifiedIcon from "@mui/icons-material/Verified";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote, GLOSSARY } from "@/components/ui/InfoNote";
import {
  ZenttoDataGrid,
  type ColumnDef,
  type GridRow,
} from "@/components/data-grid/ZenttoDataGrid";
import { useChain, useChainValidation } from "@/lib/hooks";

/** Normaliza un timestamp (epoch en seg/ms o ISO) a ISO-8601 para el grid. */
function toIso(ts: number | string | null | undefined): string {
  if (ts === null || ts === undefined) return "";
  let ms: number;
  if (typeof ts === "string" && /^\d+$/.test(ts)) {
    const n = Number(ts);
    ms = n < 1e12 ? n * 1000 : n;
  } else if (typeof ts === "number") {
    ms = ts < 1e12 ? ts * 1000 : ts;
  } else {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export default function ExplorerPage() {
  const [tab, setTab] = React.useState(0);
  const chain = useChain();
  const validation = useChainValidation(false);

  const blocks = chain.data?.blocks ?? [];

  const blockRows: GridRow[] = React.useMemo(
    () =>
      [...blocks].reverse().map((b) => ({
        index: b.index,
        hash: b.hash,
        txCount: b.transactions?.length ?? 0,
        nonce: b.nonce,
        timestamp: toIso(b.timestamp),
      })),
    [blocks],
  );

  const txRows: GridRow[] = React.useMemo(() => {
    const all = blocks.flatMap((b) =>
      (b.transactions || []).map((t) => ({ ...t, blockIndex: b.index })),
    );
    return [...all].reverse().map((t) => ({
      blockIndex: t.blockIndex,
      fromAddress: t.fromAddress ?? "coinbase",
      toAddress: t.toAddress,
      amount: t.amount,
      fee: t.fee,
      status: t.status ?? "confirmed",
    }));
  }, [blocks]);

  const blockCols: ColumnDef[] = [
    { field: "index", header: "#", type: "number", width: 90 },
    { field: "hash", header: "Hash", flex: 2, minWidth: 220 },
    { field: "txCount", header: "Txs", type: "number", width: 100 },
    { field: "nonce", header: "Nonce", type: "number", width: 120 },
    { field: "timestamp", header: "Fecha", type: "datetime", minWidth: 180 },
  ];

  const txCols: ColumnDef[] = [
    { field: "blockIndex", header: "Bloque", type: "number", width: 110 },
    { field: "fromAddress", header: "De", flex: 2, minWidth: 200 },
    { field: "toAddress", header: "A", flex: 2, minWidth: 200 },
    { field: "amount", header: "Cantidad", type: "number", width: 130 },
    { field: "fee", header: "Fee", type: "number", width: 110 },
    {
      field: "status",
      header: "Estado",
      width: 130,
      statusColors: {
        confirmed: "success",
        mined: "success",
        pending: "warning",
        failed: "error",
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Explorer"
        subtitle="Inspecciona bloques y transacciones de la cadena."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => chain.refetch()}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<VerifiedIcon />}
              onClick={() => validation.refetch()}
              disabled={validation.isFetching}
            >
              {validation.isFetching ? "Validando…" : "Validar cadena"}
            </Button>
          </Stack>
        }
      />

      <InfoNote title="Que estoy viendo?">
        Cada fila de <strong>Bloques</strong> es un eslabon de la cadena enlazado
        por su hash. {GLOSSARY.block} En <strong>Transacciones</strong> ves los
        movimientos; las marcadas <em>coinbase</em> son la recompensa al minero.
      </InfoNote>

      {validation.data && (
        <Alert
          severity={validation.data.valid ? "success" : "error"}
          sx={{ mb: 2 }}
          icon={<VerifiedIcon />}
        >
          {validation.data.valid ? (
            <>Cadena valida — altura {validation.data.height}. Ningun bloque fue alterado.</>
          ) : (
            <>
              Cadena INVALIDA. Errores: {validation.data.errors?.join("; ") || "—"}
            </>
          )}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label={`Bloques (${blockRows.length})`} />
            <Tab label={`Transacciones (${txRows.length})`} />
          </Tabs>

          {tab === 0 ? (
            <ZenttoDataGrid
              columns={blockCols}
              rows={blockRows}
              loading={chain.isLoading}
              pageSize={25}
            />
          ) : (
            <ZenttoDataGrid
              columns={txCols}
              rows={txRows}
              loading={chain.isLoading}
              pageSize={25}
            />
          )}

          {chain.isError && (
            <Typography color="error" sx={{ mt: 2 }}>
              No se pudo cargar la cadena. Verifica que el backend este activo en
              :4100.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
