"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Box,
  Alert,
  TextField,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote, HelpTip, GLOSSARY } from "@/components/ui/InfoNote";
import { Copyable } from "@/components/ui/Copyable";
import { useSignTx, useSendTx } from "@/lib/hooks";
import { useWalletStore } from "@/lib/wallet-store";
import { shortHash, formatAmount } from "@/lib/format";
import type { SignedPayload, Transaction } from "@/lib/types";

const STEPS = ["Firmar la transaccion", "Enviar a la red"];

export default function EnviarPage() {
  const { wallets } = useWalletStore();
  const sign = useSignTx();
  const send = useSendTx();

  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [fee, setFee] = React.useState("1");
  const [signed, setSigned] = React.useState<SignedPayload | null>(null);
  const [sentTx, setSentTx] = React.useState<Transaction | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const wallet = wallets.find((w) => w.address === from);
  const activeStep = sentTx ? 2 : signed ? 1 : 0;

  const onSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSentTx(null);
    if (!wallet) {
      setError("Selecciona una wallet de origen (con su clave privada).");
      return;
    }
    try {
      const payload = await sign.mutateAsync({
        privateKey: wallet.privateKey,
        toAddress: to.trim(),
        amount: Number(amount),
        fee: Number(fee),
      });
      setSigned(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo firmar.");
    }
  };

  const onSend = async () => {
    if (!signed) return;
    setError(null);
    try {
      const tx = await send.mutateAsync(signed);
      setSentTx(tx);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    }
  };

  const reset = () => {
    setSigned(null);
    setSentTx(null);
    setError(null);
    setAmount("");
  };

  return (
    <Box>
      <PageHeader
        title="Enviar fondos"
        subtitle="Firma una transferencia con tu clave privada y enviala a la red."
      />

      <InfoNote title="Como funciona un envio?">
        Primero se <strong>firma</strong> la transaccion con tu clave privada
        (prueba criptografica de que eres el dueno, sin revelar la clave).
        Despues se <strong>envia</strong> a la red y queda en la{" "}
        <strong>mempool</strong> hasta que un minero la incluya en un bloque.{" "}
        {GLOSSARY.fee}
      </InfoNote>

      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card component="form" onSubmit={onSign}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                1. Firmar
              </Typography>
              <Stack spacing={2}>
                {wallets.length === 0 ? (
                  <Alert severity="info">
                    No tienes wallets en esta sesion. Crea una en la seccion
                    Wallets para poder firmar.
                  </Alert>
                ) : (
                  <TextField
                    select
                    label="Origen (tu wallet)"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    required
                  >
                    {wallets.map((w) => (
                      <MenuItem key={w.address} value={w.address}>
                        {shortHash(w.address, 12, 8)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                <TextField
                  label={
                    <span>
                      Destino (address) <HelpTip text={GLOSSARY.address} />
                    </span>
                  }
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="address del receptor"
                  required
                />
                <TextField
                  label="Cantidad"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputProps={{ min: 0, step: "any" }}
                  required
                />
                <TextField
                  label={
                    <span>
                      Comision (fee) <HelpTip text={GLOSSARY.fee} />
                    </span>
                  }
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  inputProps={{ min: 0, step: "any" }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={sign.isPending || wallets.length === 0}
                >
                  {sign.isPending ? "Firmando…" : "Firmar"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                2. Enviar
              </Typography>
              {!signed ? (
                <Typography color="text.secondary">
                  Firma primero una transaccion. Aqui veras el payload firmado
                  listo para enviar.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      De
                    </Typography>
                    <Copyable value={signed.fromAddress} display={shortHash(signed.fromAddress)} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      A
                    </Typography>
                    <Copyable value={signed.toAddress} display={shortHash(signed.toAddress)} />
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label={`Cantidad: ${formatAmount(signed.amount)}`} />
                    <Chip size="small" label={`Fee: ${formatAmount(signed.fee)}`} />
                  </Stack>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Firma
                    </Typography>
                    <Copyable value={signed.signature} display={shortHash(signed.signature, 14, 10)} />
                  </Box>
                  <Divider />
                  {sentTx ? (
                    <Alert severity="success">
                      Transaccion enviada. Estado:{" "}
                      <strong>{sentTx.status || "pending"}</strong>. ID:{" "}
                      <Copyable value={sentTx.id} display={shortHash(sentTx.id)} />.
                      Mina un bloque para confirmarla.
                    </Alert>
                  ) : (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={onSend}
                      disabled={send.isPending}
                    >
                      {send.isPending ? "Enviando…" : "Enviar a la red"}
                    </Button>
                  )}
                  <Button variant="text" onClick={reset}>
                    Nueva transaccion
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
