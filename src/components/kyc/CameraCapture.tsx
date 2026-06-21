"use client";

/**
 * CameraCapture — captura de una foto (documento o selfie) con la cámara del
 * dispositivo vía getUserMedia, con overlay visual:
 *   - mode="document" → recuadro, cámara trasera (environment).
 *   - mode="selfie"   → óvalo, cámara frontal (user) y video espejado.
 *
 * Si getUserMedia falla o no está disponible (permiso denegado, http sin
 * localhost, navegador sin soporte), cae a un `<input type=file capture>`.
 *
 * Replica el flujo de captura de la app móvil. Devuelve un Blob JPEG vía
 * `onCapture`. El componente es client-only (usa APIs del browser).
 */

import * as React from "react";
import { Box, Button, Stack, Typography, Alert } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ReplayIcon from "@mui/icons-material/Replay";
import CheckIcon from "@mui/icons-material/Check";
import PhotoCameraBackIcon from "@mui/icons-material/PhotoCameraBack";

export type CaptureMode = "document" | "selfie";

export interface CameraCaptureProps {
  mode: CaptureMode;
  /** Texto de instrucción mostrado sobre el visor. */
  label: string;
  /** Llamado con el Blob JPEG capturado/confirmado. */
  onCapture: (blob: Blob) => void;
  /** Calidad JPEG 0..1 (default 0.85). */
  quality?: number;
}

function isSecureForCamera(): boolean {
  if (typeof window === "undefined") return false;
  // getUserMedia requiere contexto seguro (https) salvo en localhost.
  return (
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export function CameraCapture({
  mode,
  label,
  onCapture,
  quality = 0.85,
}: CameraCaptureProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [active, setActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const previewBlobRef = React.useRef<Blob | null>(null);
  const mirror = mode === "selfie";

  const stopStream = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  React.useEffect(() => () => stopStream(), [stopStream]);

  const startCamera = React.useCallback(async () => {
    setError(null);
    if (
      !isSecureForCamera() ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError(
        "No se pudo abrir la cámara en este dispositivo. Usa el botón de subir foto.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode === "selfie" ? "user" : { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setActive(true);
      // El <video> se monta cuando active=true; lo conectamos en el efecto.
    } catch {
      setError(
        "No pudimos acceder a la cámara (permiso denegado o no disponible). Usa el botón de subir foto.",
      );
    }
  }, [mode]);

  // Conecta el stream al <video> una vez montado.
  React.useEffect(() => {
    if (active && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [active]);

  const capture = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (mirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        previewBlobRef.current = blob;
        setPreview(URL.createObjectURL(blob));
        stopStream();
        setActive(false);
      },
      "image/jpeg",
      quality,
    );
  }, [mirror, quality, stopStream]);

  const confirm = React.useCallback(() => {
    if (previewBlobRef.current) onCapture(previewBlobRef.current);
  }, [onCapture]);

  const retake = React.useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    previewBlobRef.current = null;
    startCamera();
  }, [preview, startCamera]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onCapture(file);
  };

  return (
    <Stack spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
      <Typography variant="body2" color="text.secondary" align="center">
        {label}
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ width: "100%" }}>
          {error}
        </Alert>
      )}

      {/* Visor de la cámara */}
      {active && (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 420,
            aspectRatio: "3 / 4",
            bgcolor: "#000",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: mirror ? "scaleX(-1)" : undefined,
            }}
          />
          {/* Overlay SVG: óvalo (selfie) o recuadro (documento) */}
          <Box
            component="svg"
            viewBox="0 0 100 133"
            preserveAspectRatio="none"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            <defs>
              <mask id={`mask-${mode}`}>
                <rect x="0" y="0" width="100" height="133" fill="white" />
                {mode === "selfie" ? (
                  <ellipse cx="50" cy="60" rx="33" ry="44" fill="black" />
                ) : (
                  <rect
                    x="10"
                    y="38"
                    width="80"
                    height="56"
                    rx="4"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100"
              height="133"
              fill="rgba(0,0,0,0.55)"
              mask={`url(#mask-${mode})`}
            />
            {mode === "selfie" ? (
              <ellipse
                cx="50"
                cy="60"
                rx="33"
                ry="44"
                fill="none"
                stroke="#fff"
                strokeWidth="0.7"
                strokeDasharray="3 2"
              />
            ) : (
              <rect
                x="10"
                y="38"
                width="80"
                height="56"
                rx="4"
                fill="none"
                stroke="#fff"
                strokeWidth="0.7"
                strokeDasharray="3 2"
              />
            )}
          </Box>
        </Box>
      )}

      {/* Preview de la foto tomada */}
      {preview && (
        <Box
          sx={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Foto capturada"
            style={{ width: "100%", display: "block" }}
          />
        </Box>
      )}

      {/* Controles */}
      {!active && !preview && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ width: "100%", maxWidth: 420 }}
        >
          <Button
            variant="contained"
            startIcon={<CameraAltIcon />}
            onClick={startCamera}
            fullWidth
            size="large"
          >
            Abrir cámara
          </Button>
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCameraBackIcon />}
            fullWidth
            size="large"
          >
            Subir foto
            <input
              type="file"
              accept="image/*"
              capture={mode === "selfie" ? "user" : "environment"}
              hidden
              onChange={onFile}
            />
          </Button>
        </Stack>
      )}

      {active && (
        <Button
          variant="contained"
          onClick={capture}
          startIcon={<CameraAltIcon />}
          size="large"
          sx={{ borderRadius: 99, px: 4 }}
        >
          Capturar
        </Button>
      )}

      {preview && (
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<ReplayIcon />} onClick={retake}>
            Repetir
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            onClick={confirm}
          >
            Usar esta foto
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
