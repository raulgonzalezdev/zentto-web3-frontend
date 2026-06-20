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
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/Add";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote, GLOSSARY } from "@/components/ui/InfoNote";
import { Copyable } from "@/components/ui/Copyable";
import { useCreateWallet, useBalance } from "@/lib/hooks";
import { useWalletStore } from "@/lib/wallet-store";
import { shortHash, formatAmount } from "@/lib/format";
import type { WalletCreated } from "@/lib/types";

function BalanceRow({ address }: { address: string }) {
  const { data, isLoading } = useBalance(address);
  if (isLoading)
    return <CircularProgress size={14} />;
  return (
    <Stack direction="row" spacing={1}>
      <Chip
        size="small"
        color="success"
        variant="outlined"
        label={`Disponible: ${formatAmount(data?.available)}`}
      />
      <Chip
        size="small"
        variant="outlined"
        label={`Confirmado: ${formatAmount(data?.confirmed)}`}
      />
    </Stack>
  );
}

export default function WalletsPage() {
  const { wallets, add, remove } = useWalletStore();
  const createWallet = useCreateWallet();
  const [created, setCreated] = React.useState<WalletCreated | null>(null);
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onCreate = async () => {
    setError(null);
    try {
      const w = await createWallet.mutateAsync();
      add(w);
      setCreated(w);
      setAcknowledged(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la wallet.");
    }
  };

  return (
    <Box>
      <PageHeader
        title="Wallets"
        subtitle="Crea monederos y consulta su saldo."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreate}
            disabled={createWallet.isPending}
          >
            {createWallet.isPending ? "Creando…" : "Crear wallet"}
          </Button>
        }
      />

      <InfoNote title="Que es una wallet?">
        Una wallet es un par de claves. La <strong>address</strong> (publica) es
        tu numero de cuenta para recibir fondos. La <strong>privateKey</strong>{" "}
        (privada) es la llave que firma tus envios: {GLOSSARY.privateKey}
      </InfoNote>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {wallets.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              Aun no has creado ninguna wallet en esta sesion. Pulsa “Crear
              wallet”. Recuerda: las wallets viven solo en memoria; al recargar
              la pagina se pierden las claves privadas.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {wallets.map((w) => (
            <Grid size={{ xs: 12, md: 6 }} key={w.address}>
              <Card>
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Typography variant="subtitle2" color="text.secondary">
                      Address
                    </Typography>
                    <Tooltip title="Quitar de esta sesion">
                      <IconButton size="small" onClick={() => remove(w.address)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Copyable value={w.address} display={shortHash(w.address, 14, 10)} />
                  <Divider sx={{ my: 1.5 }} />
                  <BalanceRow address={w.address} />
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Clave privada (solo en memoria)
                    </Typography>
                    <Copyable
                      value={w.privateKey}
                      display={shortHash(w.privateKey, 10, 6)}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal: privateKey se muestra UNA vez */}
      <Dialog open={!!created} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="warning" /> Guarda tu clave privada AHORA
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle sx={{ fontWeight: 700 }}>
              Esta clave se muestra UNA sola vez
            </AlertTitle>
            El backend NO la guarda y NO se puede recuperar. Si la pierdes,
            pierdes el control de esta wallet. No la guardamos en tu navegador
            (ni localStorage ni cookies): solo vive en memoria mientras esta
            pestana este abierta. Copiala a un lugar seguro.
          </Alert>

          <Typography variant="caption" color="text.secondary">
            Address
          </Typography>
          <Box sx={{ mb: 1.5 }}>
            <Copyable value={created?.address || ""} />
          </Box>

          <Typography variant="caption" color="text.secondary">
            Clave publica
          </Typography>
          <Box sx={{ mb: 1.5 }}>
            <Copyable value={created?.publicKey || ""} />
          </Box>

          <Typography variant="caption" color="error">
            Clave privada (secreta)
          </Typography>
          <Box
            sx={{
              p: 1.5,
              mt: 0.5,
              borderRadius: 2,
              border: 1,
              borderColor: "warning.main",
              bgcolor: "rgba(245,158,11,0.08)",
            }}
          >
            <Copyable value={created?.privateKey || ""} />
          </Box>

          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Checkbox
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
            }
            label="He copiado mi clave privada y entiendo que no se puede recuperar."
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            disabled={!acknowledged}
            onClick={() => setCreated(null)}
          >
            Entendido, cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
