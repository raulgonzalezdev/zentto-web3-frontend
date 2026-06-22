"use client";

/**
 * /configuracion — Ajustes / parámetros editables de la plataforma (operador).
 *
 * Consume GET /admin/settings (lista de parámetros agrupados por `group`) y
 * permite editar cada uno con PUT /admin/settings { key, value }.
 *
 * - `percent`: se muestra como % (value 0.01 ↔ 1%); al guardar se convierte de
 *   vuelta a fracción.
 * - `number`/`string`: valor directo, validado contra min/max si aplican.
 * - `bool`: switch on/off.
 *
 * `value === null` significa que el parámetro usa el default del backend.
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
  Skeleton,
  Snackbar,
  TextField,
  Switch,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import { useAdminSettings, useUpdateSetting } from "@/lib/hooks";
import type { AdminSetting } from "@/lib/types";

/** Etiqueta legible para un `group`. */
const GROUP_LABELS: Record<string, string> = {
  fees: "Tarifas y comisiones",
  sweep: "Barrido de custodia",
  withdraw: "Retiros",
  deposit: "Depósitos",
  p2p: "P2P",
  general: "General",
};

function groupLabel(group: string): string {
  return GROUP_LABELS[group] ?? group;
}

/** Valor de display (percent → %). */
function toDisplay(s: AdminSetting): string {
  if (s.value === null || s.value === undefined) return "";
  if (s.type === "percent") {
    const n = Number(s.value);
    return Number.isFinite(n) ? String(n * 100) : "";
  }
  return String(s.value);
}

/** Convierte el input del usuario al valor que espera el backend. */
function toBackendValue(
  s: AdminSetting,
  raw: string | boolean,
): { value: string | number | boolean | null; error: string | null } {
  if (s.type === "bool") {
    return { value: Boolean(raw), error: null };
  }
  if (s.type === "string") {
    return { value: String(raw), error: null };
  }
  // number / percent
  const text = String(raw).trim();
  if (text === "") return { value: null, error: null }; // vacío → usa default
  const n = Number(text);
  if (!Number.isFinite(n)) return { value: null, error: "Debe ser un número." };
  const actual = s.type === "percent" ? n / 100 : n;
  if (typeof s.min === "number" && actual < s.min) {
    const lim = s.type === "percent" ? s.min * 100 : s.min;
    return { value: null, error: `Mínimo permitido: ${lim}.` };
  }
  if (typeof s.max === "number" && actual > s.max) {
    const lim = s.type === "percent" ? s.max * 100 : s.max;
    return { value: null, error: `Máximo permitido: ${lim}.` };
  }
  return { value: actual, error: null };
}

interface RowProps {
  setting: AdminSetting;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}

function SettingRow({ setting, onSaved, onError }: RowProps) {
  const update = useUpdateSetting();
  const [text, setText] = React.useState(() => toDisplay(setting));
  const [bool, setBool] = React.useState(() => Boolean(setting.value));
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Re-sincroniza cuando el backend devuelve la lista actualizada.
  React.useEffect(() => {
    setText(toDisplay(setting));
    setBool(Boolean(setting.value));
    setLocalError(null);
  }, [setting]);

  const isBool = setting.type === "bool";
  const usesDefault = setting.value === null || setting.value === undefined;

  const save = async () => {
    setLocalError(null);
    const { value, error } = toBackendValue(setting, isBool ? bool : text);
    if (error) {
      setLocalError(error);
      return;
    }
    try {
      await update.mutateAsync({ key: setting.key, value });
      onSaved(`«${setting.label}» actualizado.`);
    } catch (e) {
      onError(
        e instanceof Error ? e.message : `No se pudo actualizar «${setting.label}».`,
      );
    }
  };

  return (
    <Box sx={{ py: 1.5 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {setting.label}
            </Typography>
            {usesDefault && (
              <Chip label="default" size="small" variant="outlined" />
            )}
          </Stack>
          {setting.description && (
            <Typography variant="caption" color="text.secondary">
              {setting.description}
            </Typography>
          )}
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: "block", fontFamily: "monospace" }}
          >
            {setting.key}
          </Typography>
        </Box>

        <Box sx={{ width: { xs: "100%", sm: 220 } }}>
          {isBool ? (
            <Switch
              checked={bool}
              onChange={(e) => setBool(e.target.checked)}
              inputProps={{ "aria-label": setting.label }}
            />
          ) : (
            <TextField
              fullWidth
              size="small"
              value={text}
              onChange={(e) => setText(e.target.value)}
              error={!!localError}
              helperText={localError ?? undefined}
              type={setting.type === "string" ? "text" : "number"}
              inputProps={
                setting.type === "string"
                  ? undefined
                  : { step: "any", inputMode: "decimal" }
              }
              placeholder={usesDefault ? "(default)" : undefined}
              InputProps={
                setting.type === "percent"
                  ? {
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                    }
                  : undefined
              }
            />
          )}
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<SaveIcon />}
          onClick={save}
          disabled={update.isPending}
          sx={{ minWidth: 110 }}
        >
          {update.isPending ? "Guardando…" : "Guardar"}
        </Button>
      </Stack>
    </Box>
  );
}

export default function ConfiguracionPage() {
  const query = useAdminSettings();
  const [toast, setToast] = React.useState<{
    severity: "success" | "error";
    msg: string;
  } | null>(null);

  // Agrupa por `group` preservando el orden de llegada.
  const groups = React.useMemo(() => {
    const map = new Map<string, AdminSetting[]>();
    for (const s of query.data ?? []) {
      const arr = map.get(s.group) ?? [];
      arr.push(s);
      map.set(s.group, arr);
    }
    return Array.from(map.entries());
  }, [query.data]);

  return (
    <Box>
      <PageHeader
        title="Ajustes / Configuración"
        subtitle="Parámetros y tarifas de la plataforma."
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

      <InfoNote title="Parámetros de la plataforma">
        Ajusta tarifas, comisiones y otros parámetros operativos. Los porcentajes
        se muestran en %; un campo vacío vuelve al valor por defecto del sistema.
        Cada cambio se guarda de forma independiente.
      </InfoNote>

      {query.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo cargar la configuración. Verifica tu sesión de operador y el
          backend (GET /admin/settings).
        </Alert>
      )}

      {query.isLoading ? (
        <Stack spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={120} />
          ))}
        </Stack>
      ) : groups.length === 0 && !query.isError ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">
              No hay parámetros configurables disponibles.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        groups.map(([group, settings], idx) => (
          <Accordion key={group} defaultExpanded={idx === 0} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {groupLabel(group)}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {settings.map((s, i) => (
                <React.Fragment key={s.key}>
                  {i > 0 && <Divider />}
                  <SettingRow
                    setting={s}
                    onSaved={(msg) => setToast({ severity: "success", msg })}
                    onError={(msg) => setToast({ severity: "error", msg })}
                  />
                </React.Fragment>
              ))}
            </AccordionDetails>
          </Accordion>
        ))
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            onClose={() => setToast(null)}
            variant="filled"
          >
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
