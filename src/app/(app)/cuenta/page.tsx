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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Skeleton,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import RefreshIcon from "@mui/icons-material/Refresh";
import SavingsIcon from "@mui/icons-material/Savings";
import SendIcon from "@mui/icons-material/Send";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
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
  useAccountBalance,
  useCredit,
  useTransfer,
  useDepositInfo,
  useDeposits,
  useWithdraw,
} from "@/lib/hooks";
import type { AccountBalance } from "@/lib/types";

/** Normaliza un timestamp a ISO-8601 para el grid. */
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

/** Acorta un hash/address para mostrar. */
function short(v: string, head = 8, tail = 6): string {
  if (!v || v.length <= head + tail + 1) return v;
  return `${v.slice(0, head)}…${v.slice(-tail)}`;
}

/** Formatea un monto string-decimal del backend, sin perder precision. */
function fmt(v?: string | null): string {
  if (v === null || v === undefined || v === "") return "0";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 8 }).format(n);
}

function BalanceCard({ b }: { b: AccountBalance }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {b.asset}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {fmt(b.available)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          disponible
        </Typography>
        <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {fmt(b.balance)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              total
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {fmt(b.held)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              retenido
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function CuentaPage() {
  const balances = useAccountBalance();
  const credit = useCredit();
  const transfer = useTransfer();
  const depositInfo = useDepositInfo();
  const deposits = useDeposits();
  const withdraw = useWithdraw();

  const assets = React.useMemo(
    () => (balances.data ?? []).map((b) => b.asset),
    [balances.data],
  );
  const defaultAsset = assets[0] ?? "USDC";

  // --- Faucet (credit) ---
  const [faucetOpen, setFaucetOpen] = React.useState(false);
  const [fAsset, setFAsset] = React.useState("");
  const [fAmount, setFAmount] = React.useState("");
  const [fError, setFError] = React.useState<string | null>(null);

  // --- Transfer ---
  const [trOpen, setTrOpen] = React.useState(false);
  const [trEmail, setTrEmail] = React.useState("");
  const [trAsset, setTrAsset] = React.useState("");
  const [trAmount, setTrAmount] = React.useState("");
  const [trError, setTrError] = React.useState<string | null>(null);

  // --- Depósito ---
  const [depOpen, setDepOpen] = React.useState(false);

  // --- Retiro ---
  const [wdOpen, setWdOpen] = React.useState(false);
  const [wdAmount, setWdAmount] = React.useState("");
  const [wdAddress, setWdAddress] = React.useState("");
  const [wdCode, setWdCode] = React.useState("");
  const [wdError, setWdError] = React.useState<string | null>(null);

  const [toast, setToast] = React.useState<string | null>(null);

  const openWithdraw = () => {
    setWdAmount("");
    setWdAddress("");
    setWdCode("");
    setWdError(null);
    setWdOpen(true);
  };

  const submitWithdraw = async () => {
    setWdError(null);
    try {
      await withdraw.mutateAsync({
        asset: "USDC",
        amount: wdAmount.trim(),
        toAddress: wdAddress.trim(),
        totpCode: wdCode.trim(),
      });
      setWdOpen(false);
      setToast(
        `Retiro de ${fmt(wdAmount)} USDC en proceso. Se liquidará on-chain en breve.`,
      );
    } catch (e) {
      setWdError(e instanceof Error ? e.message : "No se pudo iniciar el retiro.");
    }
  };

  // Filas de depósitos on-chain detectados.
  const depositRows: GridRow[] = React.useMemo(
    () =>
      (deposits.data ?? []).map((d) => ({
        id: d.id,
        asset: d.asset,
        amount: d.amount,
        txHash: short(d.txHash),
        toAddress: short(d.toAddress),
        blockNumber: d.blockNumber,
        createdAt: toIso(d.createdAt),
      })),
    [deposits.data],
  );

  const depositCols: ColumnDef[] = [
    { field: "asset", header: "Asset", width: 100 },
    { field: "amount", header: "Monto", minWidth: 140 },
    { field: "txHash", header: "Tx", minWidth: 160 },
    { field: "toAddress", header: "Dirección", minWidth: 160 },
    { field: "blockNumber", header: "Bloque", width: 130 },
    { field: "createdAt", header: "Detectado", type: "datetime", minWidth: 170 },
  ];

  const openFaucet = () => {
    setFAsset(defaultAsset);
    setFAmount("10");
    setFError(null);
    setFaucetOpen(true);
  };
  const openTransfer = () => {
    setTrEmail("");
    setTrAsset(defaultAsset);
    setTrAmount("");
    setTrError(null);
    setTrOpen(true);
  };

  const submitFaucet = async () => {
    setFError(null);
    try {
      await credit.mutateAsync({ asset: fAsset.trim(), amount: fAmount.trim() });
      setFaucetOpen(false);
      setToast(`Acreditado ${fmt(fAmount)} ${fAsset} (faucet dev).`);
    } catch (e) {
      setFError(e instanceof Error ? e.message : "No se pudo acreditar.");
    }
  };

  const submitTransfer = async () => {
    setTrError(null);
    try {
      await transfer.mutateAsync({
        toEmail: trEmail.trim(),
        asset: trAsset.trim(),
        amount: trAmount.trim(),
      });
      setTrOpen(false);
      setToast(`Transferencia de ${fmt(trAmount)} ${trAsset} enviada.`);
    } catch (e) {
      setTrError(e instanceof Error ? e.message : "No se pudo transferir.");
    }
  };

  const data = balances.data ?? [];

  return (
    <Box>
      <PageHeader
        title="Cuenta / Saldo"
        subtitle="Tus saldos custodiados por asset."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => balances.refetch()}
            >
              Actualizar
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<SavingsIcon />}
              onClick={openFaucet}
            >
              Acreditar (faucet dev)
            </Button>
            <Button
              variant="outlined"
              startIcon={<CallReceivedIcon />}
              onClick={() => setDepOpen(true)}
            >
              Depositar
            </Button>
            <Button
              variant="outlined"
              startIcon={<NorthEastIcon />}
              onClick={openWithdraw}
            >
              Retirar
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={openTransfer}
            >
              Transferir
            </Button>
          </Stack>
        }
      />

      <InfoNote title="Saldo custodiado">
        Estos son los saldos que Zentto custodia por ti. <strong>Disponible</strong>{" "}
        es lo que puedes usar; <strong>retenido</strong> esta bloqueado por
        operaciones en curso. El boton <strong>faucet</strong> acredita saldo de
        prueba (solo en desarrollo).
      </InfoNote>

      {toast && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setToast(null)}>
          {toast}
        </Alert>
      )}

      {balances.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo cargar el saldo. Verifica tu sesion y que el backend este
          activo en :4100.
        </Alert>
      )}

      {balances.isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={150} />
            </Grid>
          ))}
        </Grid>
      ) : data.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">
              Aun no tienes saldo. Usa <strong>Acreditar (faucet dev)</strong>{" "}
              para crear saldo de prueba.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {data.map((b) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={b.asset}>
              <BalanceCard b={b} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Depósitos on-chain detectados */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Depósitos on-chain
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Transferencias USDC detectadas hacia tu dirección de depósito y
            acreditadas a tu saldo.
          </Typography>
          {deposits.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              No se pudieron cargar los depósitos on-chain.
            </Alert>
          )}
          <ZenttoDataGrid
            columns={depositCols}
            rows={depositRows}
            loading={deposits.isLoading}
            pageSize={10}
          />
          {!deposits.isLoading &&
            depositRows.length === 0 &&
            !deposits.isError && (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Aún no hay depósitos detectados. Usa <strong>Depositar</strong>{" "}
                para obtener tu dirección.
              </Typography>
            )}
        </CardContent>
      </Card>

      {/* Dialogo depósito (dirección on-chain) */}
      <Dialog open={depOpen} onClose={() => setDepOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Depositar USDC (on-chain)</DialogTitle>
        <DialogContent dividers>
          {depositInfo.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              No se pudo obtener la dirección de depósito. Verifica que la
              custodia esté configurada en el backend.
            </Alert>
          )}
          {depositInfo.isLoading ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 2 }}>
              <Skeleton variant="rounded" width={180} height={180} />
              <Skeleton variant="text" width="80%" />
            </Stack>
          ) : depositInfo.data ? (
            <Stack spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, bgcolor: "#fff", borderRadius: 2 }}>
                <QRCodeSVG value={depositInfo.data.address} size={180} />
              </Box>
              <Box sx={{ width: "100%" }}>
                <Typography variant="caption" color="text.secondary">
                  Dirección ({depositInfo.data.chainName})
                </Typography>
                <Copyable value={depositInfo.data.address} />
              </Box>
              <Alert severity="info" sx={{ width: "100%" }}>
                {depositInfo.data.note}
              </Alert>
              <Button
                variant="text"
                size="small"
                startIcon={<OpenInNewIcon />}
                href={depositInfo.data.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver en el explorer
              </Button>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo retiro on-chain */}
      <Dialog open={wdOpen} onClose={() => setWdOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Retirar USDC (on-chain)</DialogTitle>
        <DialogContent dividers>
          {wdError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {wdError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              El retiro requiere tu código de Google Authenticator (2FA). El
              saldo se retiene al instante y la transacción se emite on-chain.
            </Alert>
            <TextField
              label="Dirección de destino (EVM)"
              value={wdAddress}
              onChange={(e) => setWdAddress(e.target.value)}
              placeholder="0x…"
            />
            <TextField
              label="Cantidad (USDC)"
              value={wdAmount}
              onChange={(e) => setWdAmount(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: "any" }}
            />
            <TextField
              label="Código 2FA (6 dígitos)"
              value={wdCode}
              onChange={(e) =>
                setWdCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputProps={{ inputMode: "numeric", maxLength: 6 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWdOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={submitWithdraw}
            disabled={
              withdraw.isPending ||
              !wdAddress.trim() ||
              !wdAmount.trim() ||
              wdCode.length < 6
            }
          >
            {withdraw.isPending ? "Enviando…" : "Retirar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo faucet */}
      <Dialog open={faucetOpen} onClose={() => setFaucetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Acreditar saldo (faucet dev)</DialogTitle>
        <DialogContent dividers>
          {fError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {fError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            {assets.length > 0 ? (
              <TextField
                select
                label="Asset"
                value={fAsset}
                onChange={(e) => setFAsset(e.target.value)}
              >
                {assets.map((a) => (
                  <MenuItem key={a} value={a}>
                    {a}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                label="Asset"
                value={fAsset}
                onChange={(e) => setFAsset(e.target.value)}
                placeholder="USDC"
              />
            )}
            <TextField
              label="Cantidad"
              value={fAmount}
              onChange={(e) => setFAmount(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: "any" }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFaucetOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={submitFaucet}
            disabled={credit.isPending || !fAsset.trim() || !fAmount.trim()}
          >
            {credit.isPending ? "Acreditando…" : "Acreditar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo transferir */}
      <Dialog open={trOpen} onClose={() => setTrOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Transferir</DialogTitle>
        <DialogContent dividers>
          {trError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {trError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email destino"
              value={trEmail}
              onChange={(e) => setTrEmail(e.target.value)}
              type="email"
              placeholder="usuario@ejemplo.com"
            />
            {assets.length > 0 ? (
              <TextField
                select
                label="Asset"
                value={trAsset}
                onChange={(e) => setTrAsset(e.target.value)}
              >
                {assets.map((a) => (
                  <MenuItem key={a} value={a}>
                    {a}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                label="Asset"
                value={trAsset}
                onChange={(e) => setTrAsset(e.target.value)}
                placeholder="USDC"
              />
            )}
            <TextField
              label="Cantidad"
              value={trAmount}
              onChange={(e) => setTrAmount(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: "any" }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={submitTransfer}
            disabled={
              transfer.isPending ||
              !trEmail.trim() ||
              !trAsset.trim() ||
              !trAmount.trim()
            }
          >
            {transfer.isPending ? "Enviando…" : "Transferir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
