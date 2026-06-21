"use client";

/**
 * /verificar — página pública multipropósito:
 *
 *   - ?t=<token>     → handoff KYC desde el móvil (escaneo de QR del desktop).
 *                      Captura documentos + selfie y los sube a /kyc/handoff/verify
 *                      (público, se autentica con el token). NO requiere login.
 *   - ?token=<token> → verificación de correo electrónico (flujo previo).
 *
 * Responsive / mobile-first: es la pantalla que abre el teléfono al escanear el QR.
 */

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
  Container,
  Paper,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { AuthCard } from "@/components/auth/AuthCard";
import { KycDocsCapture, type KycDocsResult } from "@/components/kyc/KycDocsCapture";
import { useKycHandoffVerify } from "@/lib/hooks";
import { api, ApiError } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

/* ====================== Handoff KYC móvil (?t=) ====================== */

function HandoffCapture({ token }: { token: string }) {
  const verify = useKycHandoffVerify();
  const [done, setDone] = React.useState(false);

  const onSubmit = async (r: KycDocsResult) => {
    await verify.mutateAsync({
      token,
      frontImage: r.frontImage,
      backImage: r.backImage,
      selfie: r.selfie,
      fullName: r.fullName,
      documentType: r.documentType,
    });
    setDone(true);
  };

  if (done) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 72 }} />
        <Typography variant="h6" align="center">
          ✅ Listo, vuelve a tu computadora
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Recibimos tus documentos. Tu verificación continúa automáticamente en
          la pantalla del computador. Ya puedes cerrar esta página.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Stack spacing={1} alignItems="center">
        <VerifiedUserIcon color="primary" sx={{ fontSize: 44 }} />
        <Typography variant="h6" align="center">
          Verifica tu identidad
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Toma una foto de tu documento y una selfie. Es rápido y seguro.
        </Typography>
      </Stack>
      <KycDocsCapture onSubmit={onSubmit} submitting={verify.isPending} />
    </Stack>
  );
}

/* ====================== Verificación de correo (?token=) ====================== */

type EstadoEmail = "verificando" | "ok" | "error";

function EmailVerify({ token }: { token: string }) {
  const [estado, setEstado] = React.useState<EstadoEmail>("verificando");
  const [mensaje, setMensaje] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        await api.post(ENDPOINTS.verifyEmail, { token });
        if (!cancelado) setEstado("ok");
      } catch (err) {
        if (cancelado) return;
        setEstado("error");
        setMensaje(
          err instanceof ApiError ? err.message : "No se pudo verificar el correo.",
        );
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [token]);

  return (
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
          <Button component={Link} href="/login" variant="contained" size="large" fullWidth>
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
          <Button component={Link} href="/login" variant="outlined" size="large" fullWidth>
            Ir a iniciar sesión
          </Button>
        </>
      )}
    </Stack>
  );
}

/* ====================== Router de la página ====================== */

function VerificarInner() {
  const params = useSearchParams();
  const handoffToken = params.get("t");
  const emailToken = params.get("token");

  // Handoff KYC: layout propio mobile-first (más espacio para la cámara).
  if (handoffToken) {
    return (
      <Box sx={{ minHeight: "100dvh", bgcolor: "background.default", py: { xs: 2, sm: 4 } }}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }} variant="outlined">
            <HandoffCapture token={handoffToken} />
          </Paper>
        </Container>
      </Box>
    );
  }

  // Verificación de correo (flujo previo).
  if (emailToken) {
    return (
      <AuthCard
        title="Verificar correo"
        subtitle="Confirmamos tu dirección de correo electrónico."
      >
        <EmailVerify token={emailToken} />
      </AuthCard>
    );
  }

  // Sin token.
  return (
    <AuthCard title="Verificación">
      <Stack spacing={3} alignItems="center">
        <ErrorOutlineIcon color="error" sx={{ fontSize: 56 }} />
        <Alert severity="error" sx={{ width: "100%" }}>
          Falta el enlace de verificación. Escanea el código QR desde tu cuenta o
          abre el enlace que te enviamos por correo.
        </Alert>
        <Button component={Link} href="/login" variant="outlined" size="large" fullWidth>
          Ir a iniciar sesión
        </Button>
      </Stack>
    </AuthCard>
  );
}

export default function VerificarPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Verificación">
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
