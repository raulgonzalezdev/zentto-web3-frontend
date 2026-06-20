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
  Chip,
  Divider,
  Avatar,
  Alert,
  TextField,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import ShieldIcon from "@mui/icons-material/Shield";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { PageHeader } from "@/components/ui/PageHeader";
import { Copyable } from "@/components/ui/Copyable";
import { useAuth } from "@/lib/auth-context";
import { useWalletStore } from "@/lib/wallet-store";
import { useKycStatus } from "@/lib/hooks";
import type { TwoFactorSetup, KycStatus } from "@/lib/types";

const KYC_STATUS_LABEL: Record<string, { label: string; color: "default" | "success" | "warning" | "error" | "info" }> = {
  not_started: { label: "No iniciado", color: "default" },
  pending: { label: "En proceso", color: "info" },
  in_review: { label: "En revisión", color: "warning" },
  approved: { label: "Verificado", color: "success" },
  rejected: { label: "Rechazado", color: "error" },
  needs_more_info: { label: "Falta info", color: "warning" },
};

function kycChip(status: KycStatus) {
  const m = KYC_STATUS_LABEL[status] ?? { label: status, color: "default" as const };
  return <Chip size="small" color={m.color} label={m.label} />;
}

export default function MiCuentaPage() {
  const { user, logout, setup2fa, enable2fa } = useAuth();
  const router = useRouter();
  const walletStore = useWalletStore();
  const kyc = useKycStatus();

  // 2FA inline setup (necesario para retirar).
  const [setup, setSetup] = React.useState<TwoFactorSetup | null>(null);
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [twoFaError, setTwoFaError] = React.useState<string | null>(null);
  const [twoFaOk, setTwoFaOk] = React.useState<string | null>(null);

  const startSetup = async () => {
    setTwoFaError(null);
    setTwoFaOk(null);
    setBusy(true);
    try {
      setSetup(await setup2fa());
    } catch (e) {
      setTwoFaError(e instanceof Error ? e.message : "No se pudo iniciar 2FA.");
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async () => {
    setTwoFaError(null);
    setBusy(true);
    try {
      await enable2fa(code.trim());
      setTwoFaOk("2FA activado. Ya puedes autorizar retiros.");
      setSetup(null);
      setCode("");
    } catch (e) {
      setTwoFaError(e instanceof Error ? e.message : "Código incorrecto.");
    } finally {
      setBusy(false);
    }
  };

  const name = user?.displayName || user?.email || "Usuario";
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <Box>
      <PageHeader title="Mi cuenta" subtitle="Tu perfil y seguridad." />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", fontWeight: 700 }}>
                  {initials}
                </Avatar>
                <Box>
                  <Typography variant="h6">{name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1.25}>
                <Row label="Nombre">{user?.displayName || "—"}</Row>
                <Row label="Email">{user?.email || "—"}</Row>
                <Row label="Verificación 2FA">
                  {user?.totpEnabled ? (
                    <Chip size="small" color="success" label="Activa" />
                  ) : (
                    <Chip size="small" label="Inactiva" />
                  )}
                </Row>
                <Row label="Verificación de identidad (KYC)">
                  {kyc.isLoading ? (
                    <Chip size="small" label="…" />
                  ) : (
                    kycChip(kyc.data?.status ?? "not_started")
                  )}
                </Row>
                {kyc.data?.decisionReason && (
                  <Row label="Motivo de la decisión">
                    {kyc.data.decisionReason}
                  </Row>
                )}
                <Row label="Wallets en esta sesión">
                  {walletStore.wallets.length}
                </Row>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<ShieldIcon />}
                  onClick={() => router.push("/settings")}
                >
                  Seguridad y 2FA
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => router.push("/settings")}
                >
                  Ajustes
                </Button>
                <Button
                  variant="text"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <VerifiedUserIcon color="primary" />
                  <Typography variant="h6">2FA para retiros</Typography>
                  {user?.totpEnabled ? (
                    <Chip size="small" color="success" label="Activa" />
                  ) : (
                    <Chip size="small" label="Inactiva" />
                  )}
                </Stack>

                {twoFaError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {twoFaError}
                  </Alert>
                )}
                {twoFaOk && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {twoFaOk}
                  </Alert>
                )}

                {user?.totpEnabled ? (
                  <Typography variant="body2" color="text.secondary">
                    La verificación en dos pasos está activa. Necesitarás el
                    código de Google Authenticator para autorizar retiros
                    on-chain.
                  </Typography>
                ) : !setup ? (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Activa 2FA para poder retirar fondos. Necesitas Google
                      Authenticator (o similar).
                    </Typography>
                    <Button variant="contained" onClick={startSetup} disabled={busy}>
                      {busy ? "Generando…" : "Activar 2FA"}
                    </Button>
                  </>
                ) : (
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      1. Escanea este QR con Google Authenticator:
                    </Typography>
                    <Box sx={{ textAlign: "center" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={setup.qrDataUrl}
                        alt="Código QR para 2FA"
                        width={180}
                        height={180}
                        style={{ borderRadius: 8, background: "#fff", padding: 8 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        O introduce esta clave manualmente:
                      </Typography>
                      <Copyable value={setup.secret} />
                    </Box>
                    <TextField
                      label="Código de 6 dígitos"
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
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Sobre tu sesión
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tu sesión se mantiene con cookies seguras (httpOnly). Las claves
                  privadas de tus wallets <strong>nunca</strong> se guardan: solo
                  viven en memoria mientras esta pestaña está abierta. Si recargas,
                  tendrás que volver a importarlas.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ fontWeight: 500 }}>
        {children}
      </Typography>
    </Stack>
  );
}
