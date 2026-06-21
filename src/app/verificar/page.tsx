"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Button,
  Stack,
  Alert,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { AuthCard } from "@/components/auth/AuthCard";
import { api, ApiError } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

type Estado = "verificando" | "ok" | "error" | "sin-token";

function VerificarInner() {
  const params = useSearchParams();
  const token = params.get("token");

  const [estado, setEstado] = React.useState<Estado>(
    token ? "verificando" : "sin-token",
  );
  const [mensaje, setMensaje] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) {
      setEstado("sin-token");
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        await api.post(ENDPOINTS.verifyEmail, { token });
        if (!cancelado) setEstado("ok");
      } catch (err) {
        if (cancelado) return;
        setEstado("error");
        setMensaje(
          err instanceof ApiError
            ? err.message
            : "No se pudo verificar el correo.",
        );
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [token]);

  return (
    <AuthCard
      title="Verificar correo"
      subtitle="Confirmamos tu dirección de correo electrónico."
    >
      <Stack spacing={3} alignItems="center">
        {estado === "verificando" && (
          <>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Verificando tu correo…
            </Typography>
          </>
        )}

        {estado === "ok" && (
          <>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56 }} />
            <Alert severity="success" sx={{ width: "100%" }}>
              Tu correo fue verificado correctamente.
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
          </>
        )}

        {estado === "error" && (
          <>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 56 }} />
            <Alert severity="error" sx={{ width: "100%" }}>
              {mensaje || "El enlace es inválido o ha expirado."}
            </Alert>
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              size="large"
              fullWidth
            >
              Ir a iniciar sesión
            </Button>
          </>
        )}

        {estado === "sin-token" && (
          <>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 56 }} />
            <Alert severity="error" sx={{ width: "100%" }}>
              Falta el token de verificación. Abre el enlace que te enviamos por
              correo.
            </Alert>
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              size="large"
              fullWidth
            >
              Ir a iniciar sesión
            </Button>
          </>
        )}
      </Stack>
    </AuthCard>
  );
}

export default function VerificarPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Verificar correo">
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress />
          </Box>
        </AuthCard>
      }
    >
      <VerificarInner />
    </Suspense>
  );
}
