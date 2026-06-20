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
  Tabs,
  Tab,
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
import { useAdminKyc, useKycDecision } from "@/lib/hooks";
import type { AdminKyc, KycStatus } from "@/lib/types";

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

/** Tabs -> filtro de estado para GET /admin/kyc?status=. */
const TABS: { label: string; status?: KycStatus }[] = [
  { label: "Todas", status: undefined },
  { label: "Pendientes", status: "pending" },
  { label: "Aprobadas", status: "approved" },
  { label: "Rechazadas", status: "rejected" },
];

/** Estados en los que el operador aún puede decidir. */
const DECIDABLE = new Set<KycStatus>(["in_review", "pending"]);

interface DecisionDialogState {
  open: boolean;
  approve: boolean;
  verification: AdminKyc | null;
}

export default function KycPage() {
  const [tab, setTab] = React.useState(0);
  const status = TABS[tab].status;
  const query = useAdminKyc(status);
  const decision = useKycDecision();
  const data = React.useMemo(() => query.data ?? [], [query.data]);

  const [toast, setToast] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [dialog, setDialog] = React.useState<DecisionDialogState>({
    open: false,
    approve: true,
    verification: null,
  });

  const byId = React.useMemo(() => {
    const m = new Map<string, AdminKyc>();
    for (const v of data) m.set(v.id, v);
    return m;
  }, [data]);

  const rows: GridRow[] = React.useMemo(
    () =>
      data.map((v) => ({
        id: v.id,
        email: v.email ?? "—",
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
    { field: "email", header: "Email", minWidth: 200, flex: 1 },
    { field: "fullName", header: "Nombre", minWidth: 160 },
    { field: "documento", header: "Documento", minWidth: 170 },
    { field: "nationality", header: "Nacionalidad", width: 120 },
    {
      field: "mrz",
      header: "MRZ",
      width: 110,
      statusColors: { Válida: "success", Inválida: "error" },
    },
    {
      field: "aml",
      header: "AML",
      width: 130,
      statusColors: { Limpio: "success", Coincidencia: "error" },
    },
    { field: "provider", header: "Proveedor", width: 110 },
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
        not_started: "default",
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
    // Solo se decide sobre verificaciones aún en revisión / pendientes.
    if (!DECIDABLE.has(v.status)) {
      setToast(
        `Esta verificación ya está ${v.status}; no admite una nueva decisión.`,
      );
      return;
    }
    setReason("");
    setError(null);
    setDialog({ open: true, approve: action === "approve", verification: v });
  };

  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

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
          ? `Verificación de ${v.fullName ?? v.email ?? v.id} aprobada.`
          : `Verificación de ${v.fullName ?? v.email ?? v.id} rechazada.`,
      );
      closeDialog();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo registrar la decisión.",
      );
    }
  };

  const amlCount = data.filter((v) => v.amlMatch).length;

  return (
    <Box>
      <PageHeader
        title="KYC / Revisión"
        subtitle="Todas las verificaciones de identidad del neobanco, con decisión del operador."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => query.refetch()}
          >
            Actualizar
          </Button>
        }
      />

      <InfoNote title="Cola del operador">
        Filtra por estado con las pestañas. Revisa la validez del{" "}
        <strong>MRZ</strong> y el resultado <strong>AML</strong> (screening OFAC)
        antes de aprobar. Solo las verificaciones{" "}
        <strong>pendientes / en revisión</strong> admiten Aprobar o Rechazar.
      </InfoNote>

      {amlCount > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
          {amlCount}{" "}
          {amlCount === 1
            ? "verificación con posible coincidencia OFAC"
            : "verificaciones con posibles coincidencias OFAC"}{" "}
          en esta vista — revísalas con cuidado antes de decidir.
        </Alert>
      )}

      {toast && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setToast(null)}>
          {toast}
        </Alert>
      )}

      {query.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo cargar la lista KYC. Verifica tu sesión de operador y el
          backend (/admin/kyc).
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ mb: 2 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {TABS.map((t) => (
              <Tab key={t.label} label={t.label} />
            ))}
          </Tabs>

          <ZenttoDataGrid
            columns={cols}
            rows={rows}
            loading={query.isLoading}
            pageSize={25}
            onActionClick={openDecision}
          />
          {!query.isLoading && rows.length === 0 && !query.isError && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No hay verificaciones en esta vista.
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
                  label={
                    dialog.verification.fullName ??
                    dialog.verification.email ??
                    dialog.verification.id
                  }
                />
                {dialog.verification.email && (
                  <Chip size="small" variant="outlined" label={dialog.verification.email} />
                )}
                <Chip
                  size="small"
                  color={dialog.verification.mrzValid ? "success" : "error"}
                  label={`MRZ ${dialog.verification.mrzValid ? "válida" : "inválida"}`}
                />
                <Chip
                  size="small"
                  color={dialog.verification.amlMatch ? "error" : "success"}
                  label={
                    dialog.verification.amlMatch
                      ? "AML: coincidencia"
                      : "AML: limpio"
                  }
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
