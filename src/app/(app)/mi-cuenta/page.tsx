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
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import ShieldIcon from "@mui/icons-material/Shield";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/auth-context";
import { useWalletStore } from "@/lib/wallet-store";

export default function MiCuentaPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const walletStore = useWalletStore();

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
