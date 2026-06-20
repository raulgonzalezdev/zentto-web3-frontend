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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import {
  ZenttoDataGrid,
  type ColumnDef,
  type GridRow,
} from "@/components/data-grid/ZenttoDataGrid";
import { useKycPending, useKycDecision } from "@/lib/hooks";
import type { KycPending } from "@/lib/types";

/** Normaliza un timestamp (epoch seg/ms o ISO) a ISO-8601 para el grid. */
function toIso(ts: number | string | null | undefined): string {
  if (ts === null || ts === undefined) return "";
  let ms: number;
  if (typeof ts === "string" && /^\d+$/.test(ts)) {
    const n = Number(ts);
    ms = n < 1e12 ? n * 1000 : n;
  } else if (typeof ts === "number") {
    ms = ts < 1e12 ? ts * 1000 : ts;
  } else {
    const d = new Date(ts as string);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

interface DecisionDialogState {
  open: boolean;
  approve: boolean;
  verification: KycPending | null;
}

export default function KycPage() {
  const pending = useKycPending();
  const decision = useKycDecision();
  const data = React.useMemo(() => pending.data ?? [], [pending.data]);

  const [toast, setToast] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [dialog, setDialog] = React.useState<DecisionDialogState>({
    open: false,
    approve: true,
    verification: null,
  });

  const byId = React.useMemo(() => {
    const m = new Map<string, KycPending>();
    for (const v of data) m.set(v.id, v);
    return m;
  }, [data]);

  const rows: GridRow[] = React.useMemo(
    () =>
      data.map((v) => ({
        id: v.id,
        fullName: v.fullName ?? "—",
        documento:
          [v.documentType, v.documentNumber].filter(Boolean).join(" · ") || "—",
        nationality: v.nationality ?? "—",
        mrz: v.mrzValid ? "Válida" : "Inválida",
        aml: v.amlMatch ? "Coincidencia" : "Limpio",
        provider: v.provider,
        status: v.status,
        createdAt: toIso(v.createdAt),
      })),
    [data],
  );

  const cols: ColumnDef[] = [
    { field: "fullName", header: "Nombre", minWidth: 180, flex: 1 },
    { field: "documento", header: "Documento", minWidth: 180 },
    { field: "nationality", header: "Nacionalidad", width: 130 },
    {
      field: "mrz",
      header: "MRZ",
      width: 120,
      statusColors: { Válida: "success", Inválida: "error" },
    },
    {
      field: "aml",
      header: "AML",
      width: 140,
      statusColors: { Limpio: "success", Coincidencia: "error" },
    },
    { field: "provider", header: "Proveedor", width: 120 },
    {
      field: "status",
      header: "Estado",
      width: 130,
      statusColors: {
        in_review: "warning",
        pending: "info",
        approved: "success",
        rejected: "error",
        needs_more_info: "warning",
      },
    },
    { field: "createdAt", header: "Fecha", type: "datetime", minWidth: 170 },
    {
      field: "acciones",
      header: "Decisión",
      width: 150,
      type: "actions",
      actions: [
        { icon: "check", label: "Aprobar", action: "approve", color: "success" },
        { icon: "close", label: "Rechazar", action: "reject", color: "error" },
      ],
    },
  ];

  const openDecision = (action: string, row: GridRow) => {
    const v = byId.get(String(row.id));
    if (!v) return;
    setReason("");
    setError(null);
    setDialog({ open: true, approve: action === "approve", verification: v });
  };

  const closeDialog = () =>
    setDialog((d) => ({ ...d, open: false }));

  const submitDecision = async () => {
    const v = dialog.verification;
    if (!v) return;
    setError(null);
    try {
      await decision.mutateAsync({
        id: v.id,
        approve: dialog.approve,
        reason: reason.trim() || undefined,
      });
      setToast(
        dialog.approve
          ? `Verificación de ${v.fullName ?? v.id} aprobada.`
          : `Verificación de ${v.fullName ?? v.id} rechazada.`,
      );
      closeDialog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar la decisión.");
    }
  };

  const amlCount = data.filter((v) => v.amlMatch).length;

  return (
    <Box>
      <PageHeader
        title="KYC / Revisión"
        subtitle="Cola de verificaciones de identidad pendientes de decisión del operador."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => pending.refetch()}
          >
            Actualizar
          </Button>
        }
      />

      <InfoNote title="Cola del operador">
        Cada fila es una verificación que requiere tu decisión. Revisa la
        validez del <strong>MRZ</strong> y el resultado <strong>AML</strong>{" "}
        (screening OFAC) antes de aprobar. Una <strong>coincidencia AML</strong>{" "}
        nunca se auto-aprueba: exige revisión manual de los hits.
      </InfoNote>

      {amlCount > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 2 }}
        >
          {amlCount}{" "}
          {amlCount === 1
            ? "verificación con posible coincidencia OFAC"
            : "verificaciones con posibles coincidencias OFAC"}{" "}
          en la cola — revísalas con cuidado antes de decidir.
        </Alert>
      )}

      {toast && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setToast(null)}>
          {toast}
        </Alert>
      )}

      {pending.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo cargar la cola KYC. Verifica tu sesión y el backend (:4100).
        </Alert>
      )}

      <Card>
        <CardContent>
          <ZenttoDataGrid
            columns={cols}
            rows={rows}
            loading={pending.isLoading}
            pageSize={25}
            onActionClick={openDecision}
          />
          {!pending.isLoading && rows.length === 0 && !pending.isError && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No hay verificaciones pendientes de revisión.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de decisión */}
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.approve ? "Aprobar verificación" : "Rechazar verificación"}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {dialog.verification && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={dialog.verification.fullName ?? dialog.verification.id}
                />
                <Chip
                  size="small"
                  color={dialog.verification.mrzValid ? "success" : "error"}
                  label={`MRZ ${dialog.verification.mrzValid ? "válida" : "inválida"}`}
                />
                <Chip
                  size="small"
                  color={dialog.verification.amlMatch ? "error" : "success"}
                  label={dialog.verification.amlMatch ? "AML: coincidencia" : "AML: limpio"}
                />
              </Stack>

              {dialog.verification.amlMatch && (
                <Alert severity="warning">
                  Posible coincidencia OFAC. Revisa los hits antes de continuar:
                  <Box
                    component="pre"
                    sx={{
                      mt: 1,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "action.hover",
                      fontSize: 12,
                      overflow: "auto",
                      maxHeight: 160,
                    }}
                  >
                    {JSON.stringify(dialog.verification.amlHits ?? [], null, 2)}
                  </Box>
                </Alert>
              )}

              <TextField
                label={
                  dialog.approve
                    ? "Motivo / nota (opcional)"
                    : "Motivo del rechazo (recomendado)"
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button
            variant="contained"
            color={dialog.approve ? "success" : "error"}
            onClick={submitDecision}
            disabled={decision.isPending}
          >
            {decision.isPending
              ? "Registrando…"
              : dialog.approve
                ? "Aprobar"
                : "Rechazar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
