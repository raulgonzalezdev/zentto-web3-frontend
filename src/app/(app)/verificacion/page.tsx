"use client";

/**
 * /verificacion — flujo KYC del USUARIO (portado de la app móvil).
 *
 * Muestra el estado KYC (chip por status) y, si no está aprobado, ofrece dos caminos:
 *   (a) Continuar en el teléfono (recomendado): genera un token de handoff,
 *       muestra un QR a ${origin}/verificar?t=<token>, y hace polling de /kyc/status.
 *   (b) Verificar aquí: captura con webcam/archivo y sube a /kyc/verify-documents.
 *
 * Nota: esta es la ruta de usuario (en USER_NAV). El backoffice del operador
 * (cola de revisión) sigue en /kyc.
 */

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  Alert,
  Chip,
  Skeleton,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import RefreshIcon from "@mui/icons-material/Refresh";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import { KycDocsCapture, type KycDocsResult } from "@/components/kyc/KycDocsCapture";
import {
  useKycStatusPolling,
  useKycHandoffStart,
  useKycVerifyDocumentsUpload,
} from "@/lib/hooks";
import type { KycStatus } from "@/lib/types";

const STATUS_META: Record<
  string,
  { label: string; color: "default" | "success" | "warning" | "error" | "info"; desc: string }
> = {
  not_started: { label: "No iniciado", color: "default", desc: "Aún no has enviado tus datos de identidad." },
  pending: { label: "En proceso", color: "info", desc: "Tus datos fueron recibidos y se están procesando." },
  in_review: { label: "En revisión", color: "warning", desc: "Un operador está revisando tu verificación." },
  approved: { label: "Verificado", color: "success", desc: "Tu identidad fue verificada. Tienes acceso completo a Zentto." },
  rejected: { label: "Rechazado", color: "error", desc: "Tu verificación fue rechazada. Revisa el motivo y vuelve a intentar." },
  needs_more_info: { label: "Falta información", color: "warning", desc: "Necesitamos más datos para completar tu verificación." },
};

function statusMeta(status?: KycStatus) {
  return STATUS_META[String(status)] ?? STATUS_META.not_started;
}

function fmtSecs(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/* ---------- Camino (a): handoff al teléfono con QR + polling ---------- */

function PhoneHandoff() {
  const start = useKycHandoffStart();
  const [url, setUrl] = React.useState<string | null>(null);
  const [remaining, setRemaining] = React.useState(0);
  const polling = useKycStatusPolling(!!url);
  const status = polling.data?.status;

  // Cuenta regresiva de expiración del token.
  React.useEffect(() => {
    if (!url || remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [url, remaining]);

  const generate = async () => {
    const res = await start.mutateAsync();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    setUrl(`${origin}/verificar?t=${encodeURIComponent(res.token)}`);
    setRemaining(res.expiresInSec);
  };

  const expired = !!url && remaining <= 0;
  const resolved = status === "approved" || status === "rejected" || status === "in_review";

  if (resolved) {
    const meta = statusMeta(status);
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 2 }}>
        <VerifiedUserIcon color={status === "approved" ? "success" : "warning"} sx={{ fontSize: 56 }} />
        <Chip label={meta.label} color={meta.color} />
        <Typography variant="body2" color="text.secondary" align="center">
          {status === "approved"
            ? "Recibimos tus documentos desde el teléfono y tu identidad fue verificada."
            : "Recibimos tus documentos desde el teléfono. Estamos terminando de procesar tu verificación."}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5} alignItems="center" sx={{ py: 1 }}>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 460 }}>
        La cámara del teléfono ofrece mejor calidad. Genera un código y escanéalo
        con tu teléfono para continuar la verificación allí.
      </Typography>

      {!url && (
        <Button
          variant="contained"
          size="large"
          startIcon={start.isPending ? <CircularProgress size={18} color="inherit" /> : <QrCode2Icon />}
          onClick={generate}
          disabled={start.isPending}
        >
          {start.isPending ? "Generando…" : "Generar código QR"}
        </Button>
      )}

      {start.isError && (
        <Alert severity="error">No se pudo generar el código. Intenta de nuevo.</Alert>
      )}

      {url && !expired && (
        <>
          <Box
            sx={{
              p: 2,
              bgcolor: "#fff",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <QRCodeSVG value={url} size={220} includeMargin />
          </Box>
          <Typography variant="body2" align="center">
            <strong>Escanea con tu teléfono</strong> para continuar la verificación.
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
            <CircularProgress size={16} />
            <Typography variant="caption">
              Esperando tus documentos… el código expira en {fmtSecs(remaining)}
            </Typography>
          </Stack>
          <Button size="small" variant="text" onClick={generate} disabled={start.isPending}>
            Generar uno nuevo
          </Button>
        </>
      )}

      {expired && (
        <Stack spacing={1.5} alignItems="center">
          <Alert severity="warning">El código expiró. Genera uno nuevo.</Alert>
          <Button variant="contained" onClick={generate} disabled={start.isPending}>
            Generar código nuevo
          </Button>
        </Stack>
      )}
    </Stack>
  );
}

/* ---------- Camino (b): verificar aquí con webcam ---------- */

function HereCapture() {
  const upload = useKycVerifyDocumentsUpload();
  const [done, setDone] = React.useState(false);

  const onSubmit = async (r: KycDocsResult) => {
    await upload.mutateAsync({
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
      <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
        <VerifiedUserIcon color="success" sx={{ fontSize: 56 }} />
        <Typography variant="h6" align="center">Verificación enviada</Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Recibimos tus documentos. Actualiza el estado en unos momentos.
        </Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <KycDocsCapture onSubmit={onSubmit} submitting={upload.isPending} />
    </Box>
  );
}

/* ---------- Página ---------- */

export default function VerificacionPage() {
  const statusQuery = useKycStatusPolling(false);
  const [tab, setTab] = React.useState(0);

  const status = statusQuery.data?.status;
  const meta = statusMeta(status);
  const approved = status === "approved";

  return (
    <Box>
      <PageHeader
        title="Verificación KYC"
        subtitle="Verifica tu identidad para operar sin límites en Zentto."
        actions={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => statusQuery.refetch()}>
            Actualizar
          </Button>
        }
      />

      <InfoNote title="¿Por qué verificar?">
        La verificación de identidad (KYC) es obligatoria para cumplir con la
        normativa de prevención de lavado de dinero. Tus datos se procesan de forma
        segura y solo se usan para validar tu identidad.
      </InfoNote>

      {statusQuery.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo cargar el estado de tu verificación.
        </Alert>
      )}

      {/* Estado actual */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <VerifiedUserIcon color={approved ? "success" : "disabled"} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Estado</Typography>
            {statusQuery.isLoading ? (
              <Skeleton variant="rounded" width={110} height={28} />
            ) : (
              <Chip label={meta.label} color={meta.color} />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">{meta.desc}</Typography>
          {statusQuery.data?.decisionReason && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Nota del operador:</strong> {statusQuery.data.decisionReason}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Caminos de verificación (ocultos si ya está aprobado) */}
      {!approved && (
        <Card>
          <CardContent>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="fullWidth">
              <Tab icon={<PhoneIphoneIcon />} iconPosition="start" label="Continuar en mi teléfono" />
              <Tab icon={<CameraAltIcon />} iconPosition="start" label="Verificar aquí" />
            </Tabs>

            {tab === 0 && <PhoneHandoff />}
            {tab === 1 && <HereCapture />}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
