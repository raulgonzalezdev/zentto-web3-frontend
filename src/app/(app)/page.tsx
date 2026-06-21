"use client";

import * as React from "react";
import Link from "next/link";
import Grid from "@mui/material/Grid2";
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SouthWestIcon from "@mui/icons-material/SouthWest";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RefreshIcon from "@mui/icons-material/Refresh";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import { useAdminStats } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";

function StatCard({
  icon,
  label,
  value,
  loading,
  color = "primary.main",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  loading?: boolean;
  color?: string;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: color,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" noWrap>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {loading ? <CircularProgress size={20} /> : value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const QUICK = [
  { href: "/usuarios", label: "Usuarios y saldos", icon: <GroupIcon /> },
  { href: "/transacciones", label: "Transacciones", icon: <SwapHorizIcon /> },
  { href: "/kyc", label: "Revisión KYC", icon: <VerifiedUserIcon /> },
];

export default function PanelPage() {
  const { user } = useAuth();
  const stats = useAdminStats();
  const s = stats.data;

  return (
    <Box>
      <PageHeader
        title={`Panel de operación`}
        subtitle={`Hola, ${user?.displayName || user?.email?.split("@")[0] || "operador"}. Métricas de Zentto en tiempo real.`}
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => stats.refetch()}
          >
            Actualizar
          </Button>
        }
      />

      <InfoNote title="Centro de operación bancaria">
        Vista consolidada de toda la plataforma: usuarios registrados, cola de{" "}
        <strong>KYC</strong>, volumen de <strong>pagos</strong> y{" "}
        <strong>retiros en proceso</strong> que pueden requerir atención manual.
      </InfoNote>

      {stats.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudieron cargar las métricas. Verifica tu sesión de operador y el
          backend (/admin/stats).
        </Alert>
      )}

      {/* Resumen global */}
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<GroupIcon />}
            label="Usuarios"
            value={s?.users ?? "—"}
            loading={stats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<ReceiptLongIcon />}
            label="Pagos totales"
            color="secondary.main"
            value={s?.payments.total ?? "—"}
            loading={stats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<HourglassEmptyIcon />}
            label="KYC pendientes"
            color="warning.main"
            value={s?.kyc.pending ?? "—"}
            loading={stats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<PendingActionsIcon />}
            label="Retiros en proceso"
            color={
              (s?.payments.withdrawalsProcessing ?? 0) > 0
                ? "error.main"
                : "success.main"
            }
            value={s?.payments.withdrawalsProcessing ?? "—"}
            loading={stats.isLoading}
          />
        </Grid>
      </Grid>

      <Divider textAlign="left" sx={{ my: 2 }}>
        <Typography variant="overline" color="text.secondary">
          KYC
        </Typography>
      </Divider>
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<VerifiedUserIcon />}
            label="Aprobadas"
            color="success.main"
            value={s?.kyc.approved ?? "—"}
            loading={stats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<HourglassEmptyIcon />}
            label="Pendientes"
            color="warning.main"
            value={s?.kyc.pending ?? "—"}
            loading={stats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<CancelIcon />}
            label="Rechazadas"
            color="error.main"
            value={s?.kyc.rejected ?? "—"}
            loading={stats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<VerifiedUserIcon />}
            label="Total verificaciones"
            value={s?.kyc.total ?? "—"}
            loading={stats.isLoading}
          />
        </Grid>
      </Grid>

      <Divider textAlign="left" sx={{ my: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Pagos
        </Typography>
      </Divider>
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<SouthWestIcon />}
            label="Depósitos"
            color="success.main"
            value={s?.payments.deposits ?? "—"}
            loading={stats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<NorthEastIcon />}
            label="Retiros"
            color="warning.main"
            value={s?.payments.withdrawals ?? "—"}
            loading={stats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<SwapHorizIcon />}
            label="Transferencias"
            color="info.main"
            value={s?.payments.transfers ?? "—"}
            loading={stats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<PendingActionsIcon />}
            label="Retiros en proceso"
            color={
              (s?.payments.withdrawalsProcessing ?? 0) > 0
                ? "error.main"
                : "success.main"
            }
            value={s?.payments.withdrawalsProcessing ?? "—"}
            loading={stats.isLoading}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 1.5, mt: 3 }}>
        Accesos rápidos
      </Typography>
      <Grid container spacing={2}>
        {QUICK.map((q) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={q.href}>
            <Card>
              <CardActionArea component={Link} href={q.href}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ color: "secondary.main" }}>{q.icon}</Box>
                    <Typography sx={{ fontWeight: 600 }}>{q.label}</Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
