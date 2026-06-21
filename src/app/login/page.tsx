"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TextField,
  Button,
  Stack,
  Alert,
  Typography,
  Link as MuiLink,
  Box,
} from "@mui/material";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login, loginWith2fa, isAuthenticated } = useAuth();
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [mfaToken, setMfaToken] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.mfaRequired) {
        setMfaToken(result.mfaToken);
      } else {
        router.replace("/");
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo iniciar sesion.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken) return;
    setError(null);
    setLoading(true);
    try {
      await loginWith2fa(mfaToken, code.trim());
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Codigo 2FA invalido.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (mfaToken) {
    return (
      <AuthCard
        title="Verificacion en dos pasos"
        subtitle="Introduce el codigo de 6 digitos de tu app de autenticacion (Google Authenticator, Authy, etc.)."
      >
        <Box component="form" onSubmit={onSubmit2fa}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Codigo de 6 digitos"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputProps={{ inputMode: "numeric", maxLength: 6, style: { letterSpacing: 6, textAlign: "center", fontSize: 22 } }}
              autoFocus
            />
            <Button type="submit" variant="contained" size="large" disabled={loading || code.length < 6}>
              {loading ? "Verificando…" : "Verificar"}
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setMfaToken(null);
                setCode("");
                setError(null);
              }}
            >
              Volver
            </Button>
          </Stack>
        </Box>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Entrar a Zentto Web3" subtitle="Tu laboratorio de blockchain.">
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
          <TextField
            label="Contrasena"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
          <MuiLink
            component={Link}
            href="/recuperar"
            underline="hover"
            variant="body2"
            sx={{ textAlign: "center" }}
          >
            ¿Olvidaste tu contraseña?
          </MuiLink>
        </Stack>
      </Box>
      <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }} color="text.secondary">
        Aun no tienes cuenta?{" "}
        <MuiLink component={Link} href="/register" underline="hover">
          Crear una
        </MuiLink>
      </Typography>
    </AuthCard>
  );
}
