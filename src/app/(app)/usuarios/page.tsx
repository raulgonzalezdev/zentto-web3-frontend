"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Divider,
  Snackbar,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import {
  ZenttoDataGrid,
  type ColumnDef,
  type GridRow,
} from "@/components/data-grid/ZenttoDataGrid";
import {
  useAdminUsers,
  useUpdateUser,
  useResetUserPassword,
} from "@/lib/hooks";
import type { AdminUser, AccountBalance } from "@/lib/types";

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

/** Saldo `available` de un asset concreto, formateado para mostrar. */
function availableOf(balances: AccountBalance[] | undefined, asset: string): string {
  const b = balances?.find((x) => x.asset?.toUpperCase() === asset);
  if (!b) return "0";
  const n = Number(b.available);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("es-ES", { maximumFractionDigits: 6 }).format(n)
    : b.available;
}

export default function UsuariosPage() {
  const users = useAdminUsers();
  const updateUser = useUpdateUser();
  const resetPassword = useResetUserPassword();
  const data = React.useMemo(() => users.data ?? [], [users.data]);

  // Usuario seleccionado para el diálogo de gestión.
  const [selected, setSelected] = React.useState<AdminUser | null>(null);
  const [displayName, setDisplayName] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [pwdError, setPwdError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{
    severity: "success" | "error";
    msg: string;
  } | null>(null);

  const openUser = React.useCallback(
    (u: AdminUser) => {
      setSelected(u);
      setDisplayName(u.displayName ?? "");
      setNewPassword("");
      setNameError(null);
      setPwdError(null);
    },
    [],
  );

  const handleRowClick = React.useCallback(
    (row: GridRow) => {
      const u = data.find((x) => x.id === row.id);
      if (u) openUser(u);
    },
    [data, openUser],
  );

  const saveName = async () => {
    if (!selected) return;
    const name = displayName.trim();
    if (!name) {
      setNameError("El nombre no puede estar vacío.");
      return;
    }
    setNameError(null);
    try {
      await updateUser.mutateAsync({ id: selected.id, displayName: name });
      setToast({ severity: "success", msg: "Nombre actualizado." });
    } catch (e) {
      setToast({
        severity: "error",
        msg: e instanceof Error ? e.message : "No se pudo actualizar el nombre.",
      });
    }
  };

  const submitReset = async () => {
    if (!selected) return;
    if (newPassword.length < 8) {
      setPwdError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setPwdError(null);
    try {
      await resetPassword.mutateAsync({
        id: selected.id,
        newPassword,
      });
      setNewPassword("");
      setToast({ severity: "success", msg: "Contraseña restablecida." });
    } catch (e) {
      setToast({
        severity: "error",
        msg:
          e instanceof Error ? e.message : "No se pudo restablecer la contraseña.",
      });
    }
  };

  const rows: GridRow[] = React.useMemo(
    () =>
      data.map((u: AdminUser) => ({
        id: u.id,
        email: u.email ?? "—",
        displayName: u.displayName ?? "—",
        kycStatus: u.kycStatus ?? "not_started",
        usdt: availableOf(u.balances, "USDT"),
        usdc: availableOf(u.balances, "USDC"),
        totp: u.totpEnabled ? "Sí" : "No",
        createdAt: toIso(u.createdAt),
      })),
    [data],
  );

  const cols: ColumnDef[] = [
    { field: "email", header: "Email", minWidth: 220, flex: 1 },
    { field: "displayName", header: "Nombre", minWidth: 160 },
    {
      field: "kycStatus",
      header: "KYC",
      width: 130,
      statusColors: {
        approved: "success",
        in_review: "warning",
        pending: "info",
        rejected: "error",
        needs_more_info: "warning",
        not_started: "default",
      },
    },
    { field: "usdt", header: "USDT", width: 120 },
    { field: "usdc", header: "USDC", width: 120 },
    {
      field: "totp",
      header: "2FA",
      width: 90,
      statusColors: { Sí: "success", No: "default" },
    },
    { field: "createdAt", header: "Alta", type: "datetime", minWidth: 170 },
  ];

  return (
    <Box>
      <PageHeader
        title="Usuarios"
        subtitle="Clientes de Zentto con su estado KYC, saldos custodiados y 2FA."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => users.refetch()}
          >
            Actualizar
          </Button>
        }
      />

      <InfoNote title="Directorio de clientes">
        Cada fila es una cuenta. Los saldos mostrados son el{" "}
        <strong>disponible</strong> (solo lectura). Haz clic en una fila para{" "}
        <strong>editar el nombre</strong> o <strong>restablecer la contraseña</strong>{" "}
        del usuario. Usa el buscador del grid para filtrar por email o nombre.
      </InfoNote>

      {users.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo cargar el listado de usuarios. Verifica tu sesión de operador
          y el backend (/admin/users).
        </Alert>
      )}

      <Card>
        <CardContent>
          <ZenttoDataGrid
            columns={cols}
            rows={rows}
            loading={users.isLoading}
            pageSize={25}
            enableSearch
            onRowClick={handleRowClick}
          />
          {!users.isLoading && rows.length === 0 && !users.isError && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No hay usuarios registrados todavía.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de gestión del usuario */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Gestionar usuario</DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selected.email}
                </Typography>
              </Box>

              {/* Editar nombre */}
              <Typography variant="subtitle2">Nombre visible</Typography>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  fullWidth
                  size="small"
                  label="Nombre"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  error={!!nameError}
                  helperText={nameError ?? undefined}
                />
                <Button
                  variant="outlined"
                  onClick={saveName}
                  disabled={updateUser.isPending}
                  sx={{ mt: 0.25, whiteSpace: "nowrap" }}
                >
                  {updateUser.isPending ? "…" : "Guardar"}
                </Button>
              </Stack>

              <Divider />

              {/* Resetear contraseña */}
              <Typography variant="subtitle2">Restablecer contraseña</Typography>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={!!pwdError}
                  helperText={pwdError ?? "Mínimo 8 caracteres."}
                  autoComplete="new-password"
                />
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={submitReset}
                  disabled={resetPassword.isPending || newPassword.length < 8}
                  sx={{ mt: 0.25, whiteSpace: "nowrap" }}
                >
                  {resetPassword.isPending ? "…" : "Resetear"}
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

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
