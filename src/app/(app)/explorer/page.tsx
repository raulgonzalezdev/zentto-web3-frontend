"use client";

import * as React from "react";
import {
  Box,
  Button,
  Tabs,
  Tab,
  Alert,
  Chip,
  Stack,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VerifiedIcon from "@mui/icons-material/Verified";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote, GLOSSARY } from "@/components/ui/InfoNote";
import { Copyable } from "@/components/ui/Copyable";
import { ZenttoDataGrid, type ZenttoColumn } from "@/components/data-grid/ZenttoDataGrid";
import { useChain, useChainValidation } from "@/lib/hooks";
import { shortHash, formatAmount, fromNow } from "@/lib/format";
import type { Block, Transaction } from "@/lib/types";

export default function ExplorerPage() {
  const [tab, setTab] = React.useState(0);
  const chain = useChain();
  const validation = useChainValidation(false);

  const blocks = chain.data?.blocks ?? [];
  const txs: (Transaction & { blockIndex: number })[] = React.useMemo(
    () =>
      blocks.flatMap((b) =>
        (b.transactions || []).map((t) => ({ ...t, blockIndex: b.index })),
      ),
    [blocks],
  );

  const blockCols: ZenttoColumn<Block>[] = [
    { field: "index", headerName: "#", width: 70 },
    {
      field: "hash",
      headerName: "Hash",
      renderCell: (v) => <Copyable value={v} display={shortHash(v, 10, 8)} />,
    },
    {
      field: "transactions",
      headerName: "Txs",
      align: "right",
      renderCell: (v: Transaction[]) => (
        <Chip size="small" label={v?.length ?? 0} />
      ),
    },
    { field: "nonce", headerName: "Nonce", align: "right" },
    {
      field: "timestamp",
      headerName: "Edad",
      renderCell: (v) => fromNow(v),
    },
  ];

  const txCols: ZenttoColumn<Transaction & { blockIndex: number }>[] = [
    {
      field: "blockIndex",
      headerName: "Bloque",
      width: 80,
      renderCell: (v) => <Chip size="small" variant="outlined" label={`#${v}`} />,
    },
    {
      field: "fromAddress",
      headerName: "De",
      renderCell: (v) =>
        v ? <Copyable value={v} display={shortHash(v)} /> : <Chip size="small" color="secondary" label="coinbase" />,
    },
    {
      field: "toAddress",
      headerName: "A",
      renderCell: (v) => <Copyable value={v} display={shortHash(v)} />,
    },
    {
      field: "amount",
      headerName: "Cantidad",
      align: "right",
      renderCell: (v) => formatAmount(v),
    },
    {
      field: "fee",
      headerName: "Fee",
      align: "right",
      renderCell: (v) => formatAmount(v),
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
            <Tab label={`Bloques (${blocks.length})`} />
            <Tab label={`Transacciones (${txs.length})`} />
          </Tabs>

          {tab === 0 ? (
            <ZenttoDataGrid
              columns={blockCols}
              rows={[...blocks].reverse()}
              getRowId={(b) => b.index}
              loading={chain.isLoading}
              emptyMessage="La cadena aun no tiene bloques. Mina el primero."
            />
          ) : (
            <ZenttoDataGrid
              columns={txCols}
              rows={[...txs].reverse()}
              getRowId={(t, i) => t.id ?? i}
              loading={chain.isLoading}
              emptyMessage="Aun no hay transacciones confirmadas."
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
