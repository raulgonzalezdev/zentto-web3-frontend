"use client";

/**
 * /custodia — Control de fondos / Custodia (operador backoffice).
 *
 * Da control total de los fondos de custodia del neobanco:
 *   - GET /admin/custody : saldo on-chain REAL del hot wallet (que firma los
 *     retiros) por red — gas nativo (BNB/ETH/POL) + cada stablecoin (USDT/USDC).
 *   - GET /admin/treasury: comisiones ganadas (feeRevenue) + respaldo de custodia.
 *   - POST /admin/sweep  : barrido de depósitos → hot wallet.
 *
 * Alerta de gas bajo: si una red tiene `lowGas`, el hot wallet no puede barrer
 * ni firmar retiros en esa red hasta que se le recargue gas nativo.
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
  AlertTitle,
  Skeleton,
  Divider,
  Chip,
  Link as MuiLink,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import RefreshIcon from "@mui/icons-material/Refresh";
import BoltIcon from "@mui/icons-material/Bolt";
import SavingsIcon from "@mui/icons-material/Savings";
import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BalanceIcon from "@mui/icons-material/Balance";
import { QRCodeSVG } from "qrcode.react";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import { Copyable } from "@/components/ui/Copyable";
import {
  ZenttoDataGrid,
  type ColumnDef,
  type GridRow,
} from "@/components/data-grid/ZenttoDataGrid";
import {
  useAdminCustody,
  useAdminSweep,
  useAdminTreasury,
} from "@/lib/hooks";
import type { CustodyNetwork } from "@/lib/types";

/** Formatea un string decimal a número legible (mismo patrón que /fees). */
function fmt(v?: string | null): string {
  if (v === null || v === undefined || v === "") return "0";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 8 }).format(n);
}

function toNum(v?: string | null): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Card de una red: gas nativo + alerta de gas bajo + tabla de stablecoins. */
function NetworkCard({
  net,
  hotWallet,
}: {
  net: CustodyNetwork;
  hotWallet: string | null;
}) {
  const tokenRows: GridRow[] = net.tokens.map((t) => ({
    id: `${net.network}:${t.asset}`,
    asset: t.asset,
    balance: fmt(t.balance),
  }));

  const tokenCols: ColumnDef[] = [
    { field: "asset", header: "Token", width: 120 },
    { field: "balance", header: "Saldo on-chain", minWidth: 160, flex: 1 },
  ];

  const explorer = net.explorerUrl ?? null;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderColor: net.lowGas ? "error.main" : undefined,
        borderWidth: net.lowGas ? 2 : 1,
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 1.5 }}
          flexWrap="wrap"
          useFlexGap
        >
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {net.name}
          </Typography>
          {net.lowGas ? (
            <Chip
              size="small"
              color="error"
              icon={<WarningAmberIcon />}
              label="Sin gas"
            />
          ) : (
            <Chip size="small" color="success" label="Operativa" />
          )}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 1 }}>
          <BoltIcon
            fontSize="small"
            color={net.lowGas ? "error" : "warning"}
          />
          <Typography variant="body2" color="text.secondary">
            Gas nativo
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {fmt(net.gas)} {net.gasSymbol}
          </Typography>
        </Stack>

        {net.lowGas && (
          <Alert
            severity="error"
            icon={<WarningAmberIcon fontSize="inherit" />}
            sx={{ mb: 1.5 }}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>Sin gas</AlertTitle>
            No puede barrer ni retirar en esta red. Envía{" "}
            <strong>{net.gasSymbol}</strong> a la dirección del hot wallet
            {hotWallet ? (
              <Box sx={{ mt: 1 }}>
                <Copyable value={hotWallet} />
              </Box>
            ) : null}
          </Alert>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="overline" color="text.secondary">
          Stablecoins
        </Typography>
        {tokenRows.length > 0 ? (
          <Box sx={{ mt: 0.5 }}>
            <ZenttoDataGrid
              columns={tokenCols}
              rows={tokenRows}
              pageSize={10}
              enableSearch={false}
              enableExport={false}
            />
          </Box>
        ) : (
          <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
            Sin tokens configurados en esta red.
          </Typography>
        )}

        {explorer && (
          <Box sx={{ mt: 1.5 }}>
            <MuiLink
              href={explorer}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
            >
              Ver en explorer <OpenInNewIcon sx={{ fontSize: 16 }} />
            </MuiLink>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function CustodiaPage() {
  const custodyQ = useAdminCustody();
  const treasuryQ = useAdminTreasury();
  const sweep = useAdminSweep();

  const [toast, setToast] = React.useState<{
    severity: "success" | "error";
    msg: string;
  } | null>(null);

  const custody = custodyQ.data;
  const networks = React.useMemo(
    () => custody?.networks ?? [],
    [custody],
  );
  const hotWallet = custody?.hotWallet ?? null;
  const anyLowGas = networks.some((n) => n.lowGas);

  const treasury = treasuryQ.data;
  const feeRevenue = React.useMemo(
    () => treasury?.feeRevenue ?? [],
    [treasury],
  );
  const custodyBackup = React.useMemo(
    () => treasury?.custody ?? [],
    [treasury],
  );

  // Solvencia (best-effort): tokens on-chain en el hot wallet (suma por asset)
  // vs respaldo que se debe a usuarios (treasury.custody por asset).
  const solvency = React.useMemo(() => {
    const held: Record<string, number> = {};
    for (const n of networks) {
      for (const t of n.tokens) {
        held[t.asset] = (held[t.asset] ?? 0) + toNum(t.balance);
      }
    }
    // La cuenta contable de custodia es NEGATIVA por doble entrada (se debita al
    // acreditar a usuarios). El pasivo "se debe a usuarios" es su valor en positivo.
    const owed: Record<string, number> = {};
    for (const c of custodyBackup) {
      owed[c.asset] = (owed[c.asset] ?? 0) + -toNum(c.balance);
    }
    const assets = Array.from(
      new Set([...Object.keys(held), ...Object.keys(owed)]),
    ).sort();
    return assets.map((asset) => {
      const onchain = held[asset] ?? 0;
      const debt = owed[asset] ?? 0;
      return {
        id: asset,
        asset,
        onchain: fmt(String(onchain)),
        debt: fmt(String(debt)),
        diff: fmt(String(onchain - debt)),
        solvent: onchain >= debt,
      };
    });
  }, [networks, custodyBackup]);

  const handleSweep = async () => {
    setToast(null);
    try {
      const res = await sweep.mutateAsync();
      setToast({
        severity: "success",
        msg: `Barrido completado: ${res.swept} depósito(s) barrido(s), ${res.gasTopUps} recarga(s) de gas.`,
      });
      custodyQ.refetch();
      treasuryQ.refetch();
    } catch (e) {
      setToast({
        severity: "error",
        msg:
          e instanceof Error
            ? e.message
            : "No se pudo ejecutar el barrido. Revisa el gas del hot wallet.",
      });
    }
  };

  const refreshAll = () => {
    custodyQ.refetch();
    treasuryQ.refetch();
  };

  // ----- Grids tesorería (mismo patrón que /fees) -----
  const feeRows: GridRow[] = feeRevenue.map((r) => ({
    id: r.asset,
    asset: r.asset,
    balance: fmt(r.balance),
    available: fmt(r.available),
    held: fmt(r.held),
  }));
  const feeCols: ColumnDef[] = [
    { field: "asset", header: "Asset", width: 120 },
    { field: "balance", header: "Total ganado", minWidth: 150, flex: 1 },
    { field: "available", header: "Disponible", minWidth: 130, flex: 1 },
    { field: "held", header: "Retenido", minWidth: 130, flex: 1 },
  ];

  const backupRows: GridRow[] = custodyBackup.map((r) => ({
    id: r.asset,
    asset: r.asset,
    balance: fmt(r.balance),
  }));
  const backupCols: ColumnDef[] = [
    { field: "asset", header: "Asset", width: 120 },
    {
      field: "balance",
      header: "Respaldo (saldos de usuarios)",
      minWidth: 200,
      flex: 1,
    },
  ];

  const solvencyCols: ColumnDef[] = [
    { field: "asset", header: "Asset", width: 100 },
    { field: "onchain", header: "On-chain (hot wallet)", minWidth: 160, flex: 1 },
    { field: "debt", header: "Se debe a usuarios", minWidth: 160, flex: 1 },
    { field: "diff", header: "Diferencia", minWidth: 130, flex: 1 },
    { field: "estado", header: "Estado", minWidth: 120 },
  ];
  const solvencyRows: GridRow[] = solvency.map((r) => ({
    ...r,
    estado: r.solvent ? "✅ Solvente" : "⚠️ Déficit",
  }));

  const disabled = !custody?.enabled;

  return (
    <Box>
      <PageHeader
        title="Custodia / Control de fondos"
        subtitle="Hot wallet on-chain por red, gas, barrido de depósitos y solvencia."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshAll}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={
                sweep.isPending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <BoltIcon />
                )
              }
              onClick={handleSweep}
              disabled={sweep.isPending || disabled}
            >
              {sweep.isPending ? "Barriendo…" : "Barrer ahora"}
            </Button>
          </Stack>
        }
      />

      <InfoNote title="¿Qué controla esta vista?">
        El <strong>hot wallet</strong> es la billetera que firma los retiros y a
        la que se barren los depósitos de los usuarios. Aquí ves su saldo{" "}
        <strong>on-chain real</strong> por red: el <strong>gas nativo</strong>{" "}
        (necesario para mover fondos) y cada <strong>stablecoin</strong>. Si una
        red se queda <strong>sin gas</strong>, no puede barrer ni retirar hasta
        que la recargues.
      </InfoNote>

      {toast && (
        <Alert
          severity={toast.severity}
          sx={{ mb: 2 }}
          onClose={() => setToast(null)}
        >
          {toast.msg}
        </Alert>
      )}

      {custodyQ.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo cargar la custodia. Verifica tu sesión de operador y el
          backend (GET /admin/custody).
        </Alert>
      )}

      {!custodyQ.isLoading && disabled && !custodyQ.isError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          La custodia on-chain no está habilitada en este entorno.
        </Alert>
      )}

      {anyLowGas && (
        <Alert
          severity="error"
          icon={<WarningAmberIcon fontSize="inherit" />}
          sx={{ mb: 2 }}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>
            Una o más redes sin gas
          </AlertTitle>
          El hot wallet no puede barrer ni firmar retiros en las redes marcadas
          en rojo. Recárgalas con su gas nativo cuanto antes.
        </Alert>
      )}

      {/* Hot wallet (dirección + QR) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <SecurityIcon color="primary" />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Hot wallet (firma retiros)
            </Typography>
          </Stack>
          {custodyQ.isLoading ? (
            <Skeleton variant="text" height={40} />
          ) : hotWallet ? (
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 8 }}>
                <Typography variant="caption" color="text.secondary">
                  Dirección on-chain
                </Typography>
                <Copyable value={hotWallet} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Misma dirección en todas las redes EVM. Envía gas nativo
                  (BNB/ETH/POL) o stablecoins a esta dirección.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    display: "inline-block",
                    p: 1,
                    bgcolor: "#fff",
                    borderRadius: 1,
                  }}
                >
                  <QRCodeSVG value={hotWallet} size={140} />
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">
              No hay hot wallet configurado.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Redes (gas + tokens) */}
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Saldo del hot wallet por red
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {custodyQ.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, md: 6, lg: 4 }}>
              <Skeleton variant="rounded" height={280} />
            </Grid>
          ))
        ) : networks.length > 0 ? (
          networks.map((net) => (
            <Grid key={net.network} size={{ xs: 12, md: 6, lg: 4 }}>
              <NetworkCard net={net} hotWallet={hotWallet} />
            </Grid>
          ))
        ) : (
          !disabled && (
            <Grid size={12}>
              <Typography color="text.secondary">
                No hay redes configuradas.
              </Typography>
            </Grid>
          )
        )}
      </Grid>

      {/* Solvencia */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <BalanceIcon color="info" />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Solvencia (on-chain vs lo que se debe)
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Compara los stablecoins que el hot wallet tiene on-chain (sumando
            todas las redes) contra el respaldo que se debe a los usuarios. Nota:
            no incluye depósitos aún sin barrer ni fondos en cold storage; es una
            referencia operativa, no un balance contable.
          </Typography>
          {custodyQ.isLoading || treasuryQ.isLoading ? (
            <Skeleton variant="rounded" height={120} />
          ) : solvencyRows.length > 0 ? (
            <ZenttoDataGrid
              columns={solvencyCols}
              rows={solvencyRows}
              pageSize={10}
            />
          ) : (
            <Typography color="text.secondary">
              Sin datos suficientes para calcular solvencia.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Tesorería: fees ganados */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <SavingsIcon color="success" />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Comisiones ganadas (tesorería)
            </Typography>
            <MuiLink
              href="/fees"
              sx={{ fontSize: 14 }}
            >
              Ver detalle en Fees
            </MuiLink>
          </Stack>
          {treasuryQ.isError ? (
            <Alert severity="error">
              No se pudo cargar la tesorería (GET /admin/treasury).
            </Alert>
          ) : (
            <ZenttoDataGrid
              columns={feeCols}
              rows={feeRows}
              loading={treasuryQ.isLoading}
              pageSize={10}
              showTotals
            />
          )}
        </CardContent>
      </Card>

      {/* Tesorería: respaldo de custodia */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Respaldo de saldos de usuarios (custodia)
          </Typography>
          <ZenttoDataGrid
            columns={backupCols}
            rows={backupRows}
            loading={treasuryQ.isLoading}
            pageSize={10}
          />
          {!treasuryQ.isLoading &&
            backupRows.length === 0 &&
            !treasuryQ.isError && (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Sin datos de custodia.
              </Typography>
            )}
        </CardContent>
      </Card>
    </Box>
  );
}
