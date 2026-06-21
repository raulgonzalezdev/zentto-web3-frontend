"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Stack,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Divider,
  IconButton,
  Skeleton,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import { Copyable } from "@/components/ui/Copyable";
import {
  usePaymentMethods,
  useAddPaymentMethod,
  useDeletePaymentMethod,
} from "@/lib/hooks";
import type { PaymentMethod, PaymentMethodType } from "@/lib/types";

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Copyable value={value} mono={false} />
    </Box>
  );
}

function MethodCard({
  m,
  onDelete,
  deleting,
}: {
  m: PaymentMethod;
  onDelete: () => void;
  deleting: boolean;
}) {
  const isPm = m.type === "pago_movil";
  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          {isPm ? <PhoneIphoneIcon color="primary" /> : <AccountBalanceIcon color="primary" />}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
            {m.label}
          </Typography>
          <Chip
            size="small"
            label={isPm ? "Pago Móvil" : "Cuenta bancaria"}
            color={isPm ? "secondary" : "default"}
          />
        </Stack>
        <Divider sx={{ mb: 1.5 }} />
        <Stack spacing={1}>
          <Field label="Banco" value={m.bankName} />
          <Field label="Titular" value={m.accountHolder} />
          <Field label="Cédula / RIF" value={m.idNumber} />
          {isPm ? (
            <Field label="Teléfono" value={m.phone} />
          ) : (
            <Field label="Número de cuenta" value={m.accountNumber} />
          )}
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: "flex-end" }}>
        <IconButton
          color="error"
          size="small"
          onClick={onDelete}
          disabled={deleting}
          aria-label="eliminar método"
        >
          <DeleteOutlineIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}

export default function MetodosPagoPage() {
  const methods = usePaymentMethods();
  const add = useAddPaymentMethod();
  const del = useDeletePaymentMethod();

  const [toast, setToast] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<PaymentMethodType>("pago_movil");
  const [label, setLabel] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [accountHolder, setAccountHolder] = React.useState("");
  const [idNumber, setIdNumber] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const openDialog = () => {
    setType("pago_movil");
    setLabel("");
    setBankName("");
    setAccountHolder("");
    setIdNumber("");
    setPhone("");
    setAccountNumber("");
    setFormError(null);
    setOpen(true);
  };

  const submit = async () => {
    setFormError(null);
    const isPm = type === "pago_movil";
    try {
      await add.mutateAsync({
        type,
        label: label.trim(),
        bankName: bankName.trim() || undefined,
        accountHolder: accountHolder.trim() || undefined,
        idNumber: idNumber.trim() || undefined,
        phone: isPm ? phone.trim() || undefined : undefined,
        accountNumber: !isPm ? accountNumber.trim() || undefined : undefined,
      });
      setOpen(false);
      setToast("Método de pago agregado.");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo agregar el método.");
    }
  };

  const onDelete = async (m: PaymentMethod) => {
    setError(null);
    try {
      await del.mutateAsync({ id: m.id });
      setToast("Método de pago eliminado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el método.");
    }
  };

  const data = methods.data ?? [];
  const isPm = type === "pago_movil";
  const canSubmit =
    label.trim() &&
    (isPm ? phone.trim() : accountNumber.trim());

  return (
    <Box>
      <PageHeader
        title="Métodos de pago"
        subtitle="Tus datos de Pago Móvil y cuentas bancarias para cobrar en P2P."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => methods.refetch()}
            >
              Actualizar
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog}>
              Agregar método
            </Button>
          </Stack>
        }
      />

      <InfoNote title="¿Para qué sirven?">
        Estos métodos identifican <strong>cómo te pagan en bolívares</strong> cuando
        vendes cripto en el mercado P2P. Cada dato tiene un botón para{" "}
        <strong>copiar</strong> y compartirlo con tu contraparte.
      </InfoNote>

      {toast && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setToast(null)}>
          {toast}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {methods.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudieron cargar tus métodos de pago.
        </Alert>
      )}

      {methods.isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={220} />
            </Grid>
          ))}
        </Grid>
      ) : data.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">
              Aún no tienes métodos de pago. Usa <strong>Agregar método</strong>{" "}
              para registrar tu Pago Móvil o una cuenta bancaria.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {data.map((m) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.id}>
              <MethodCard
                m={m}
                onDelete={() => onDelete(m)}
                deleting={del.isPending}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogo agregar */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Agregar método de pago</DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Tipo"
              value={type}
              onChange={(e) => setType(e.target.value as PaymentMethodType)}
            >
              <MenuItem value="pago_movil">Pago Móvil</MenuItem>
              <MenuItem value="bank_account">Cuenta bancaria</MenuItem>
            </TextField>
            <TextField
              label="Etiqueta"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={isPm ? "Mi Pago Móvil" : "Mi cuenta corriente"}
            />
            <TextField
              label="Banco"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Banco de Venezuela, Banesco…"
            />
            <TextField
              label="Titular"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
            />
            <TextField
              label="Cédula / RIF"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="V-12345678"
            />
            {isPm ? (
              <TextField
                label="Teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0414-1234567"
              />
            ) : (
              <TextField
                label="Número de cuenta"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0102-0000-00-0000000000"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={add.isPending || !canSubmit}
          >
            {add.isPending ? "Guardando…" : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
