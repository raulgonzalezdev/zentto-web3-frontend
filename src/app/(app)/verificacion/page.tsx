"use client";

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
  TextField,
  MenuItem,
  Divider,
  Skeleton,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import {
  useKycStatus,
  useKycSubmit,
  useKycVerifyDocuments,
} from "@/lib/hooks";
import type { KycStatus } from "@/lib/types";

const STATUS_META: Record<
  string,
  { label: string; color: "default" | "success" | "warning" | "error" | "info"; desc: string }
> = {
  not_started: {
    label: "No iniciado",
    color: "default",
    desc: "Aún no has enviado tus datos de identidad.",
  },
  pending: {
    label: "En proceso",
    color: "info",
    desc: "Tus datos fueron recibidos y se están procesando.",
  },
  in_review: {
    label: "En revisión",
    color: "warning",
    desc: "Un operador está revisando tu verificación.",
  },
  approved: {
    label: "Verificado",
    color: "success",
    desc: "Tu identidad fue verificada. Tienes acceso completo al neobanco.",
  },
  rejected: {
    label: "Rechazado",
    color: "error",
    desc: "Tu verificación fue rechazada. Revisa el motivo y vuelve a enviar tus datos.",
  },
  needs_more_info: {
    label: "Falta información",
    color: "warning",
    desc: "Necesitamos más datos para completar tu verificación.",
  },
};

const DOC_TYPES = [
  { value: "passport", label: "Pasaporte" },
  { value: "national_id", label: "Cédula de identidad" },
  { value: "drivers_license", label: "Licencia de conducir" },
];

function statusMeta(status?: KycStatus) {
  return STATUS_META[String(status)] ?? STATUS_META.not_started;
}

export default function VerificacionPage() {
  const statusQuery = useKycStatus();
  const submit = useKycSubmit();
  const verify = useKycVerifyDocuments();

  const [fullName, setFullName] = React.useState("");
  const [documentType, setDocumentType] = React.useState("passport");
  const [documentNumber, setDocumentNumber] = React.useState("");
  const [nationality, setNationality] = React.useState("");
  const [toast, setToast] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const status = statusQuery.data?.status;
  const meta = statusMeta(status);
  const approved = status === "approved";
  const inProgress = status === "pending" || status === "in_review";

  const submitData = async () => {
    setError(null);
    try {
      await submit.mutateAsync({
        fullName: fullName.trim() || undefined,
        documentType,
        documentNumber: documentNumber.trim() || undefined,
        nationality: nationality.trim() || undefined,
      });
      setToast("Datos enviados. Continúa con la verificación de documentos.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron enviar los datos.");
    }
  };

  const runVerify = async () => {
    setError(null);
    try {
      const res = await verify.mutateAsync({
        fullName: fullName.trim() || undefined,
        documentType,
        documentNumber: documentNumber.trim() || undefined,
        nationality: nationality.trim() || undefined,
      });
      if (res?.redirectUrl) {
        window.open(res.redirectUrl, "_blank", "noopener,noreferrer");
        setToast("Abrimos el proveedor de verificación en una pestaña nueva.");
      } else {
        setToast("Verificación de documentos iniciada.");
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo iniciar la verificación.",
      );
    }
  };

  return (
    <Box>
      <PageHeader
        title="Verificación KYC"
        subtitle="Verifica tu identidad para operar sin límites en el neobanco."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => statusQuery.refetch()}
          >
            Actualizar
          </Button>
        }
      />

      <InfoNote title="¿Por qué verificar?">
        La verificación de identidad (KYC) es obligatoria para cumplir con la
        normativa de prevención de lavado de dinero. Tus datos se procesan de forma
        segura y solo se usan para validar tu identidad.
      </InfoNote>

      {toast && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setToast(null)}>
          {toast}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
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
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Estado
            </Typography>
            {statusQuery.isLoading ? (
              <Skeleton variant="rounded" width={110} height={28} />
            ) : (
              <Chip label={meta.label} color={meta.color} />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {meta.desc}
          </Typography>
          {statusQuery.data?.decisionReason && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Nota del operador:</strong>{" "}
              {statusQuery.data.decisionReason}
            </Alert>
          )}
          {statusQuery.data?.redirectUrl && !approved && (
            <Button
              sx={{ mt: 2 }}
              variant="text"
              startIcon={<OpenInNewIcon />}
              href={statusQuery.data.redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Continuar con el proveedor de verificación
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Formulario de datos (oculto si ya está verificado) */}
      {!approved && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Tus datos de identidad
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ingresa tus datos tal como aparecen en tu documento.
              {inProgress &&
                " Puedes actualizarlos mientras tu verificación está en proceso."}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2} sx={{ maxWidth: 480 }}>
              <TextField
                label="Nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <TextField
                select
                label="Tipo de documento"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                {DOC_TYPES.map((d) => (
                  <MenuItem key={d.value} value={d.value}>
                    {d.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Número de documento"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
              <TextField
                label="Nacionalidad"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="Venezolana"
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="outlined"
                  onClick={submitData}
                  disabled={submit.isPending}
                >
                  {submit.isPending ? "Enviando…" : "Guardar datos"}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<VerifiedUserIcon />}
                  onClick={runVerify}
                  disabled={verify.isPending}
                >
                  {verify.isPending ? "Iniciando…" : "Verificar documentos"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
