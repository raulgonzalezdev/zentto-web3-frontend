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
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import {
  useAccountBalance,
  useCredit,
  useTransfer,
} from "@/lib/hooks";
import type { AccountBalance } from "@/lib/types";

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

  const [toast, setToast] = React.useState<string | null>(null);

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
        Estos son los saldos que el neobanco custodia por ti. <strong>Disponible</strong>{" "}
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
