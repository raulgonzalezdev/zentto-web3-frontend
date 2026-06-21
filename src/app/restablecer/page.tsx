"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  TextField,
  Button,
  Stack,
  Alert,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { AuthCard } from "@/components/auth/AuthCard";
import { api, ApiError } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

function RestablecerInner() {
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Falta el token. Abre el enlace que te enviamos por correo.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await api.post(ENDPOINTS.resetPassword, { token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo restablecer la contraseña. El enlace puede haber expirado.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard
        title="Contraseña actualizada"
        subtitle="Ya puedes entrar con tu nueva contraseña."
      >
        <Stack spacing={3} alignItems="center">
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56 }} />
          <Alert severity="success" sx={{ width: "100%" }}>
            Tu contraseña se restableció correctamente.
          </Alert>
          <Button
            component={Link}
            href="/login"
            variant="contained"
            size="large"
            fullWidth
          >
            Iniciar sesión
          </Button>
        </Stack>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Restablecer contraseña"
      subtitle="Elige una nueva contraseña para tu cuenta."
    >
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {!token && (
            <Alert severity="warning">
              Este enlace no es válido. Solicita uno nuevo desde{" "}
              <Link href="/recuperar">recuperar contraseña</Link>.
            </Alert>
          )}
          <TextField
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            helperText="Mínimo 8 caracteres."
            required
          />
          <TextField
            label="Confirmar contraseña"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || !token}
          >
            {loading ? "Guardando…" : "Restablecer contraseña"}
          </Button>
        </Stack>
      </Box>
      <Typography
        variant="body2"
        sx={{ mt: 3, textAlign: "center" }}
        color="text.secondary"
      >
        <Link href="/login">Volver a iniciar sesión</Link>
      </Typography>
    </AuthCard>
  );
}

export default function RestablecerPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Restablecer contraseña">
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress />
          </Box>
        </AuthCard>
      }
    >
      <RestablecerInner />
    </Suspense>
  );
}
