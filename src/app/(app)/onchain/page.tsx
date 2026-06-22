"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  TextField,
  Chip,
  Divider,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import { Copyable } from "@/components/ui/Copyable";
import {
  ZenttoDataGrid,
  type ColumnDef,
  type GridRow,
} from "@/components/data-grid/ZenttoDataGrid";
import {
  useEvmInfo,
  useEvmAddress,
  useEvmTx,
  useAdminOnchainActivity,
} from "@/lib/hooks";
import { shortHash } from "@/lib/format";

/** Base del explorer por defecto (BSC mainnet); el backend puede sobreescribirla en /evm/info. */
const DEFAULT_EXPLORER = "https://bscscan.com";

function explorerBase(info?: { explorer?: string }): string {
  const e = info?.explorer;
  if (typeof e === "string" && e.startsWith("http")) return e.replace(/\/$/, "");
  return DEFAULT_EXPLORER;
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

export default function OnchainPage() {
  const info = useEvmInfo();
  const activity = useAdminOnchainActivity();

  // address lookup
  const [addrInput, setAddrInput] = React.useState("");
  const [addr, setAddr] = React.useState<string | null>(null);
  const addrQuery = useEvmAddress(addr);

  // tx lookup
  const [hashInput, setHashInput] = React.useState("");
  const [hash, setHash] = React.useState<string | null>(null);
  const txQuery = useEvmTx(hash);

  const base = explorerBase(info.data);

  // Filas consolidadas de la traza on-chain real (depósitos + retiros).
  const activityRows: GridRow[] = React.useMemo(() => {
    const data = activity.data;
    if (!data) return [];
    const deposits = (data.deposits ?? []).map((d) => ({
      id: `dep:${d.txHash}:${d.network}`,
      kind: "Depósito",
      network: d.network,
      asset: d.asset,
      amount: d.amount,
      txHash: d.txHash,
      explorerUrl: d.explorerUrl ?? "",
      detalle: d.blockNumber != null ? `bloque ${d.blockNumber}` : "—",
      userId: d.userId,
      createdAt: toIso(d.createdAt),
    }));
    const withdrawals = (data.withdrawals ?? []).map((w) => ({
      id: `wd:${w.txHash}:${w.network}`,
      kind: "Retiro",
      network: w.network,
      asset: w.asset,
      amount: w.amount,
      txHash: w.txHash,
      explorerUrl: w.explorerUrl ?? "",
      detalle: w.status ?? "—",
      userId: w.userId,
      createdAt: toIso(w.createdAt),
    }));
    return [...deposits, ...withdrawals].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
  }, [activity.data]);

  const activityCols: ColumnDef[] = [
    {
      field: "kind",
      header: "Tipo",
      width: 120,
      statusColors: { Depósito: "success", Retiro: "warning" },
    },
    { field: "network", header: "Red", width: 110 },
    { field: "asset", header: "Asset", width: 90 },
    { field: "amount", header: "Monto", minWidth: 120 },
    {
      field: "txHash",
      header: "Tx on-chain",
      minWidth: 200,
      // Hash acortado + link al explorer (explorerUrl ya viene armado del backend).
      renderCell: (value, row) => {
        const hashStr = String(value ?? "");
        if (!hashStr) return "—";
        const short = esc(shortHash(hashStr, 10, 8));
        const url = String((row as GridRow).explorerUrl ?? "");
        if (!url) return `<span title="${esc(hashStr)}">${short}</span>`;
        return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(hashStr)}" style="text-decoration:underline">${short} ↗</a>`;
      },
    },
    { field: "detalle", header: "Estado / bloque", minWidth: 140 },
    { field: "createdAt", header: "Fecha", type: "datetime", minWidth: 170 },
  ];

  return (
    <Box>
      <PageHeader
        title="On-chain (EVM)"
        subtitle="Redes EVM reales de producción (BSC, Ethereum, Polygon mainnet) — dinero on-chain real."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              info.refetch();
              activity.refetch();
            }}
          >
            Actualizar
          </Button>
        }
      />

      <InfoNote title="¿Qué es esto?">
        Consulta las <strong>redes EVM reales de producción</strong> que usa el
        neobanco: <strong>BSC</strong> (chainId 56), <strong>Ethereum</strong> y{" "}
        <strong>Polygon</strong> mainnet, con stablecoins{" "}
        <strong>USDT / USDC</strong>. Puedes ver el último bloque, el saldo
        nativo y de stablecoin de cualquier dirección, el estado de una
        transacción on-chain y la <strong>traza real</strong> de depósitos y
        retiros del custodio.
      </InfoNote>

      <Grid container spacing={2}>
        {/* Estado de la red */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Red EVM
              </Typography>
              {info.isLoading ? (
                <CircularProgress size={20} />
              ) : info.isError ? (
                <Alert severity="error">No se pudo leer /evm/info.</Alert>
              ) : (
                <Stack spacing={1.25}>
                  <Row label="Red">
                    {String(info.data?.network ?? "—")}
                  </Row>
                  {info.data?.chainId !== undefined && (
                    <Row label="Chain ID">{String(info.data.chainId)}</Row>
                  )}
                  <Row label="Último bloque">
                    <Chip
                      size="small"
                      color="primary"
                      label={String(info.data?.blockNumber ?? "—")}
                    />
                  </Row>
                  <Divider />
                  <MuiLink
                    href={base}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                  >
                    Abrir explorer <OpenInNewIcon sx={{ fontSize: 16 }} />
                  </MuiLink>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Saldo de una address */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Saldo de una dirección
              </Typography>
              <Stack
                component="form"
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                onSubmit={(e) => {
                  e.preventDefault();
                  setAddr(addrInput.trim() || null);
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Address (0x…)"
                  value={addrInput}
                  onChange={(e) => setAddrInput(e.target.value)}
                  placeholder="0x0000000000000000000000000000000000000000"
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SearchIcon />}
                  disabled={!addrInput.trim()}
                >
                  Consultar
                </Button>
              </Stack>

              <Box sx={{ mt: 2 }}>
                {addr && addrQuery.isLoading && <CircularProgress size={20} />}
                {addrQuery.isError && (
                  <Alert severity="error">
                    No se pudo consultar esa dirección.
                  </Alert>
                )}
                {addrQuery.data && (
                  <Stack spacing={1.25}>
                    <Row label="Dirección">
                      <Copyable
                        value={addrQuery.data.address || addr || ""}
                        display={shortHash(addrQuery.data.address || addr || "", 12, 8)}
                      />
                    </Row>
                    <Row label="ETH (nativo)">
                      <Chip size="small" variant="outlined" label={String(addrQuery.data.native ?? "0")} />
                    </Row>
                    <Row label="USDC">
                      <Chip size="small" variant="outlined" label={String(addrQuery.data.usdc ?? "0")} />
                    </Row>
                    <Divider />
                    <MuiLink
                      href={`${base}/address/${addrQuery.data.address || addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                    >
                      Ver en explorer <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </MuiLink>
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Estado de una tx */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Estado de una transacción
              </Typography>
              <Stack
                component="form"
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                onSubmit={(e) => {
                  e.preventDefault();
                  setHash(hashInput.trim() || null);
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Hash de tx (0x…)"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  placeholder="0x…"
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SearchIcon />}
                  disabled={!hashInput.trim()}
                >
                  Consultar
                </Button>
              </Stack>

              <Box sx={{ mt: 2 }}>
                {hash && txQuery.isLoading && <CircularProgress size={20} />}
                {txQuery.isError && (
                  <Alert severity="error">
                    No se pudo consultar esa transacción.
                  </Alert>
                )}
                {txQuery.data && (
                  <Stack spacing={1.25}>
                    <Row label="Hash">
                      <Copyable
                        value={txQuery.data.hash || hash || ""}
                        display={shortHash(txQuery.data.hash || hash || "", 14, 10)}
                      />
                    </Row>
                    <Row label="Estado">
                      <Chip
                        size="small"
                        color={
                          /success|confirmed|1/i.test(String(txQuery.data.status))
                            ? "success"
                            : /fail|reverted|0/i.test(String(txQuery.data.status))
                              ? "error"
                              : "warning"
                        }
                        label={String(txQuery.data.status ?? "desconocido")}
                      />
                    </Row>
                    {txQuery.data.blockNumber != null && (
                      <Row label="Bloque">{String(txQuery.data.blockNumber)}</Row>
                    )}
                    {txQuery.data.from && (
                      <Row label="De">
                        <Copyable value={txQuery.data.from} display={shortHash(txQuery.data.from)} />
                      </Row>
                    )}
                    {txQuery.data.to && (
                      <Row label="A">
                        <Copyable value={txQuery.data.to} display={shortHash(txQuery.data.to)} />
                      </Row>
                    )}
                    <Divider />
                    <MuiLink
                      href={`${base}/tx/${txQuery.data.hash || hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                    >
                      Ver en explorer <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </MuiLink>
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Actividad on-chain real (traza de depósitos + retiros del custodio) */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                Actividad on-chain
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Traza real de depósitos detectados y retiros ejecutados en
                cadena. Cada fila enlaza al explorer de su red.
              </Typography>

              {activity.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  No se pudo cargar la actividad on-chain. Verifica tu sesión de
                  operador y el backend (/admin/onchain-activity).
                </Alert>
              )}

              <ZenttoDataGrid
                columns={activityCols}
                rows={activityRows}
                loading={activity.isLoading}
                pageSize={25}
                enableSearch
              />
              {!activity.isLoading &&
                activityRows.length === 0 &&
                !activity.isError && (
                  <Typography color="text.secondary" sx={{ mt: 2 }}>
                    No hay actividad on-chain registrada todavía.
                  </Typography>
                )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ fontWeight: 500, textAlign: "right" }}>
        {children}
      </Typography>
    </Stack>
  );
}
