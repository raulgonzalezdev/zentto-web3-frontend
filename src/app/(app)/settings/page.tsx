"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import ShieldIcon from "@mui/icons-material/Shield";
import LogoutIcon from "@mui/icons-material/Logout";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import { Copyable } from "@/components/ui/Copyable";
import { useAuth } from "@/lib/auth-context";
import type { TwoFactorSetup } from "@/lib/types";

export default function SettingsPage() {
  const { user, setup2fa, enable2fa, disable2fa, logout } = useAuth();
  const router = useRouter();

  const [setup, setSetup] = React.useState<TwoFactorSetup | null>(null);
  const [code, setCode] = React.useState("");
  const [disableCode, setDisableCode] = React.useState("");
  const [disableOpen, setDisableOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const startSetup = async () => {
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      const data = await setup2fa();
      setSetup(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar la configuracion 2FA.");
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async () => {
    setError(null);
    setBusy(true);
    try {
      await enable2fa(code.trim());
      setOk("2FA activado correctamente.");
      setSetup(null);
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Codigo incorrecto.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDisable = async () => {
    setError(null);
    setBusy(true);
    try {
      await disable2fa(disableCode.trim());
      setOk("2FA desactivado.");
      setDisableOpen(false);
      setDisableCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Codigo incorrecto.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <Box>
      <PageHeader title="Ajustes" subtitle="Seguridad de la cuenta y sesion." />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {ok && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {ok}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <ShieldIcon color="primary" />
                <Typography variant="h6">
                  Verificacion en dos pasos (2FA)
                </Typography>
                {user?.totpEnabled ? (
                  <Chip size="small" color="success" label="Activa" />
                ) : (
                  <Chip size="small" label="Inactiva" />
                )}
              </Stack>

              <InfoNote title="Por que activar 2FA?">
                Anade una segunda barrera: aunque alguien sepa tu contrasena,
                necesitara el codigo temporal de tu app de autenticacion para
                entrar.
              </InfoNote>

              {!user?.totpEnabled ? (
                !setup ? (
                  <Button variant="contained" onClick={startSetup} disabled={busy}>
                    {busy ? "Generando…" : "Activar 2FA"}
                  </Button>
                ) : (
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      1. Escanea este QR con Google Authenticator, Authy o
                      similar:
                    </Typography>
                    <Box sx={{ textAlign: "center" }}>
                      {/* El backend ya entrega el QR como data URL */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={setup.qrDataUrl}
                        alt="Codigo QR para 2FA"
                        width={200}
                        height={200}
                        style={{ borderRadius: 8, background: "#fff", padding: 8 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        O introduce esta clave manualmente:
                      </Typography>
                      <Copyable value={setup.secret} />
                    </Box>
                    <Divider />
                    <Typography variant="body2" color="text.secondary">
                      2. Escribe el codigo de 6 digitos que muestra la app:
                    </Typography>
                    <TextField
                      label="Codigo de 6 digitos"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      inputProps={{ inputMode: "numeric", maxLength: 6 }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        onClick={confirmEnable}
                        disabled={busy || code.length < 6}
                      >
                        Confirmar y activar
                      </Button>
                      <Button variant="text" onClick={() => setSetup(null)}>
                        Cancelar
                      </Button>
                    </Stack>
                  </Stack>
                )
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setDisableOpen(true)}
                >
                  Desactivar 2FA
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Cuenta
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Nombre:</strong> {user?.displayName || "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {user?.email}
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                fullWidth
              >
                Cerrar sesion
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={disableOpen} onClose={() => setDisableOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Desactivar 2FA</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Introduce un codigo actual de tu app para confirmar.
          </Typography>
          <TextField
            label="Codigo de 6 digitos"
            value={disableCode}
            onChange={(e) =>
              setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputProps={{ inputMode: "numeric", maxLength: 6 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableOpen(false)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDisable}
            disabled={busy || disableCode.length < 6}
          >
            Desactivar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
