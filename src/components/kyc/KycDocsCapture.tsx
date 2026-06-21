"use client";

/**
 * KycDocsCapture — flujo de captura de documentos paso a paso, reutilizable por:
 *   - /verificacion (usuario logueado → POST /kyc/verify-documents)
 *   - /verificar    (móvil público con token → POST /kyc/handoff/verify)
 *
 * Pasos: tipo de documento → frente → (dorso si el tipo lo requiere) → selfie → enviar.
 * Usa <CameraCapture> con overlay (recuadro/óvalo). Replica el flujo del móvil.
 *
 * El padre decide qué hacer con las imágenes vía `onSubmit` (cada página
 * conecta su mutación: verify-documents o handoff/verify).
 */

import * as React from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import { CameraCapture } from "./CameraCapture";
import { KYC_DOCUMENT_TYPES, type KycDocumentTypeDef } from "@/lib/types";

export interface KycDocsResult {
  frontImage: Blob;
  backImage?: Blob | null;
  selfie?: Blob | null;
  fullName?: string;
  documentType: string;
}

export interface KycDocsCaptureProps {
  onSubmit: (result: KycDocsResult) => Promise<void> | void;
  submitting?: boolean;
  /** Muestra el campo opcional de nombre completo (default true). */
  askFullName?: boolean;
}

function findType(value: string): KycDocumentTypeDef {
  return (
    KYC_DOCUMENT_TYPES.find((t) => t.value === value) ?? KYC_DOCUMENT_TYPES[0]
  );
}

export function KycDocsCapture({
  onSubmit,
  submitting = false,
  askFullName = true,
}: KycDocsCaptureProps) {
  const [documentType, setDocumentType] = React.useState(
    KYC_DOCUMENT_TYPES[0].value,
  );
  const [fullName, setFullName] = React.useState("");
  const [front, setFront] = React.useState<Blob | null>(null);
  const [back, setBack] = React.useState<Blob | null>(null);
  const [selfie, setSelfie] = React.useState<Blob | null>(null);
  const [step, setStep] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const docDef = findType(documentType);
  const needsBack = docDef.hasBack;

  // Pasos dinámicos según el tipo (con/sin dorso).
  const steps = React.useMemo(
    () =>
      needsBack
        ? ["Documento", "Frente", "Dorso", "Selfie", "Enviar"]
        : ["Documento", "Frente", "Selfie", "Enviar"],
    [needsBack],
  );

  const reset = () => {
    setFront(null);
    setBack(null);
    setSelfie(null);
    setStep(0);
  };

  // Índices de paso (dependen de needsBack).
  const STEP_TYPE = 0;
  const STEP_FRONT = 1;
  const STEP_BACK = needsBack ? 2 : -1;
  const STEP_SELFIE = needsBack ? 3 : 2;
  const STEP_SEND = needsBack ? 4 : 3;

  const submit = async () => {
    setError(null);
    if (!front) {
      setError("Falta la foto del frente del documento.");
      return;
    }
    if (needsBack && !back) {
      setError("Falta la foto del dorso del documento.");
      return;
    }
    try {
      await onSubmit({
        frontImage: front,
        backImage: needsBack ? back : null,
        selfie,
        fullName: fullName.trim() || undefined,
        documentType,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la verificación.");
    }
  };

  return (
    <Stack spacing={2.5} sx={{ width: "100%" }}>
      <Stepper activeStep={step} alternativeLabel>
        {steps.map((s) => (
          <Step key={s}>
            <StepLabel>{s}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Paso 0: tipo de documento */}
      {step === STEP_TYPE && (
        <Stack spacing={2} sx={{ maxWidth: 460, mx: "auto", width: "100%" }}>
          <TextField
            select
            label="Tipo de documento"
            value={documentType}
            onChange={(e) => {
              setDocumentType(e.target.value);
              reset();
            }}
            fullWidth
          >
            {KYC_DOCUMENT_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="body2" color="text.secondary">
            {docDef.hint}
          </Typography>
          {askFullName && (
            <TextField
              label="Nombre completo (opcional)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Como aparece en tu documento"
              fullWidth
            />
          )}
          <Button
            variant="contained"
            size="large"
            onClick={() => setStep(STEP_FRONT)}
          >
            Continuar
          </Button>
        </Stack>
      )}

      {/* Paso frente */}
      {step === STEP_FRONT && (
        <CameraCapture
          mode="document"
          label={`Frente de tu ${docDef.label.toLowerCase()}. Encuádralo dentro del recuadro.`}
          onCapture={(b) => {
            setFront(b);
            setStep(needsBack ? STEP_BACK : STEP_SELFIE);
          }}
        />
      )}

      {/* Paso dorso (condicional) */}
      {needsBack && step === STEP_BACK && (
        <CameraCapture
          mode="document"
          label={`Dorso de tu ${docDef.label.toLowerCase()}. Encuádralo dentro del recuadro.`}
          onCapture={(b) => {
            setBack(b);
            setStep(STEP_SELFIE);
          }}
        />
      )}

      {/* Paso selfie */}
      {step === STEP_SELFIE && (
        <CameraCapture
          mode="selfie"
          label="Ahora una selfie. Centra tu rostro dentro del óvalo."
          onCapture={(b) => {
            setSelfie(b);
            setStep(STEP_SEND);
          }}
        />
      )}

      {/* Paso enviar */}
      {step === STEP_SEND && (
        <Stack spacing={2} alignItems="center">
          <Typography variant="body1" align="center">
            Revisa que tus fotos sean legibles y envía tu verificación.
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            justifyContent="center"
            useFlexGap
          >
            <Chip2 label="Frente" ok={!!front} />
            {needsBack && <Chip2 label="Dorso" ok={!!back} />}
            <Chip2 label="Selfie" ok={!!selfie} />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={reset} disabled={submitting}>
              Empezar de nuevo
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={submit}
              disabled={submitting}
              startIcon={
                submitting ? <CircularProgress size={18} color="inherit" /> : undefined
              }
            >
              {submitting ? "Enviando…" : "Enviar verificación"}
            </Button>
          </Stack>
        </Stack>
      )}

      {/* Navegación hacia atrás (excepto en paso 0 y durante envío) */}
      {step !== STEP_TYPE && step !== STEP_SEND && (
        <Box sx={{ textAlign: "center" }}>
          <Button
            variant="text"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Volver
          </Button>
        </Box>
      )}
    </Stack>
  );
}

/** Pequeño chip de estado (OK / pendiente) sin depender de imports extra. */
function Chip2({ label, ok }: { label: string; ok: boolean }) {
  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.5,
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 600,
        color: ok ? "success.contrastText" : "text.secondary",
        bgcolor: ok ? "success.main" : "action.hover",
      }}
    >
      {ok ? "✓ " : "• "}
      {label}
    </Box>
  );
}
