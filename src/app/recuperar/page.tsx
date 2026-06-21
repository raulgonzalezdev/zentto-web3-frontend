"use client";

import * as React from "react";
import Link from "next/link";
import {
  TextField,
  Button,
  Stack,
  Alert,
  Typography,
  Box,
} from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { AuthCard } from "@/components/auth/AuthCard";
import { api, ApiError } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

export default function RecuperarPage() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post(ENDPOINTS.forgotPassword, { email });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo procesar la solicitud. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthCard
        title="Revisa tu correo"
        subtitle="Te enviamos las instrucciones si tu cuenta existe."
      >
        <Stack spacing={3} alignItems="center">
          <MarkEmailReadOutlinedIcon color="primary" sx={{ fontSize: 56 }} />
          <Alert severity="info" sx={{ width: "100%" }}>
            Si el correo existe, te enviamos un enlace para restablecer tu
            contraseña.
          </Alert>
          <Button
            component={Link}
            href="/login"
            variant="contained"
            size="large"
            fullWidth
          >
            Volver a iniciar sesión
          </Button>
        </Stack>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Introduce tu correo y te enviaremos un enlace para restablecerla."
    >
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
          >
            {loading ? "Enviando…" : "Enviar enlace"}
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
