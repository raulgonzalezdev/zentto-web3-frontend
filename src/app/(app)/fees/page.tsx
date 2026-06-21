"use client";

/**
 * /fees — Tesorería: consolidado de comisiones (fees) ganadas por la plataforma.
 *
 * Backoffice (admin/operator). Consume GET /admin/treasury, que devuelve:
 *   - rates:      tarifas vigentes (p2p, depósito, retiro, fee de red, mínimo).
 *   - feeRevenue: ingresos por comisiones por asset (cuenta system/fees) → lo que ganamos.
 *   - custody:    respaldo on-chain (saldos de usuarios) por asset.
 *   - masterWallet + onchain: hot wallet de tesorería y su saldo real on-chain.
 */

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  Alert,
  Skeleton,
  Divider,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import RefreshIcon from "@mui/icons-material/Refresh";
import SavingsIcon from "@mui/icons-material/Savings";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import { Copyable } from "@/components/ui/Copyable";
import {
  ZenttoDataGrid,
  type ColumnDef,
  type GridRow,
} from "@/components/data-grid/ZenttoDataGrid";
import { useAdminTreasury } from "@/lib/hooks";

/** Formatea un string decimal a número legible (mismo patrón que /cuenta). */
function fmt(v?: string | null): string {
  if (v === null || v === undefined || v === "") return "0";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 8 }).format(n);
}

function pct(n?: number): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${(n * 100).toLocaleString("es-ES", { maximumFractionDigits: 4 })} %`;
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function FeesPage() {
  const query = useAdminTreasury();
  const data = query.data;

  const feeRevenue = React.useMemo(() => data?.feeRevenue ?? [], [data]);
  const custody = React.useMemo(() => data?.custody ?? [], [data]);

  // Filas para el grid de ingresos por comisiones (por asset).
  const feeRows: GridRow[] = React.useMemo(
    () =>
      feeRevenue.map((r) => ({
        id: r.asset,
        asset: r.asset,
        balance: fmt(r.balance),
        available: fmt(r.available),
        held: fmt(r.held),
      })),
    [feeRevenue],
  );

  const feeCols: ColumnDef[] = [
    { field: "asset", header: "Asset", width: 120 },
    { field: "balance", header: "Total ganado", minWidth: 160, flex: 1 },
    { field: "available", header: "Disponible", minWidth: 150, flex: 1 },
    { field: "held", header: "Retenido", minWidth: 150, flex: 1 },
  ];

  const custodyRows: GridRow[] = React.useMemo(
    () =>
      custody.map((r) => ({
        id: r.asset,
        asset: r.asset,
        balance: fmt(r.balance),
      })),
    [custody],
  );

  const custodyCols: ColumnDef[] = [
    { field: "asset", header: "Asset", width: 120 },
    { field: "balance", header: "Respaldo (saldos de usuarios)", minWidth: 200, flex: 1 },
  ];

  const rates = data?.rates;
  const onchainNative =
    data?.onchain && typeof data.onchain === "object"
      ? (data.onchain as Record<string, unknown>).native
      : undefined;
  const onchainUsdc =
    data?.onchain && typeof data.onchain === "object"
      ? (data.onchain as Record<string, unknown>).usdc
      : undefined;

  return (
    <Box>
      <PageHeader
        title="Fees / Tesorería"
        subtitle="Comisiones ganadas por la plataforma, consolidadas por asset."
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

      <InfoNote title="¿Qué muestra esta vista?">
        Los <strong>fees</strong> son las comisiones que cobra Zentto por cada
        operación (P2P, depósito, retiro). Se acumulan en la cuenta de tesorería{" "}
        <code>system/fees</code>. Aquí ves el total ganado por asset, las tarifas
        vigentes y el respaldo on-chain de los saldos de usuarios.
      </InfoNote>

      {query.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo cargar la tesorería. Verifica tu sesión de operador y el
          backend (GET /admin/treasury).
        </Alert>
      )}

      {/* Tarifas vigentes */}
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Tarifas vigentes
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {query.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Grid key={i} size={{ xs: 6, sm: 4, md: 4 }}>
              <Skeleton variant="rounded" height={96} />
            </Grid>
          ))
        ) : (
          <>
            <Grid size={{ xs: 6, sm: 4, md: 4 }}>
              <MetricCard label="Comisión P2P" value={pct(rates?.p2pPct)} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 4 }}>
              <MetricCard label="Comisión depósito" value={pct(rates?.depositPct)} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 4 }}>
              <MetricCard label="Comisión retiro" value={pct(rates?.withdrawPct)} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 4 }}>
              <MetricCard
                label="Fee de red (retiro)"
                value={fmt(String(rates?.withdrawNetworkFee ?? 0))}
                sub="Gas fijo por retiro"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 4 }}>
              <MetricCard
                label="Fee mínimo"
                value={fmt(String(rates?.minFee ?? 0))}
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Ingresos por comisiones (lo que ganamos) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <SavingsIcon color="success" />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Comisiones ganadas (consolidado)
            </Typography>
          </Stack>
          <ZenttoDataGrid
            columns={feeCols}
            rows={feeRows}
            loading={query.isLoading}
            pageSize={10}
            showTotals
          />
          {!query.isLoading && feeRows.length === 0 && !query.isError && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Aún no hay comisiones acumuladas.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Hot wallet / on-chain */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <AccountBalanceWalletIcon color="primary" />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Billetera maestra (tesorería)
            </Typography>
          </Stack>
          {query.isLoading ? (
            <Skeleton variant="text" height={32} />
          ) : data?.masterWallet ? (
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Dirección hot wallet
                </Typography>
                <Copyable value={data.masterWallet} />
              </Box>
              <Divider />
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Chip
                  label={`Nativo (ETH): ${
                    onchainNative !== undefined ? fmt(String(onchainNative)) : "—"
                  }`}
                />
                <Chip
                  label={`USDC: ${
                    onchainUsdc !== undefined ? fmt(String(onchainUsdc)) : "—"
                  }`}
                />
              </Stack>
            </Stack>
          ) : (
            <Typography color="text.secondary">
              La custodia on-chain no está habilitada en este entorno.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Respaldo / custodia */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Respaldo de saldos de usuarios (custodia)
          </Typography>
          <ZenttoDataGrid
            columns={custodyCols}
            rows={custodyRows}
            loading={query.isLoading}
            pageSize={10}
          />
          {!query.isLoading && custodyRows.length === 0 && !query.isError && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Sin datos de custodia.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
