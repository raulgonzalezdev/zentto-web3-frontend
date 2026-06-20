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

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, displayName || undefined);
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo crear la cuenta.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Crear cuenta"
      subtitle="Te damos un entorno seguro para aprender blockchain sin riesgo real."
    >
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nombre (opcional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <TextField
            label="Contrasena"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            helperText="Minimo 8 caracteres."
            required
          />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? "Creando…" : "Crear cuenta"}
          </Button>
        </Stack>
      </Box>
      <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }} color="text.secondary">
        Ya tienes cuenta?{" "}
        <MuiLink component={Link} href="/login" underline="hover">
          Entrar
        </MuiLink>
      </Typography>
    </AuthCard>
  );
}
