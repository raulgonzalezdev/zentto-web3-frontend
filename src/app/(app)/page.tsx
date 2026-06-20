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
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import HeightIcon from "@mui/icons-material/Height";
import VerifiedIcon from "@mui/icons-material/Verified";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SendIcon from "@mui/icons-material/Send";
import MemoryIcon from "@mui/icons-material/Memory";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import GppGoodIcon from "@mui/icons-material/GppGood";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import { useChain, useChainValidation, usePending } from "@/lib/hooks";
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
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
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
  { href: "/wallets", label: "Crear wallet", icon: <AccountBalanceWalletIcon /> },
  { href: "/minado", label: "Minar un bloque", icon: <MemoryIcon /> },
  { href: "/enviar", label: "Enviar fondos", icon: <SendIcon /> },
  { href: "/explorer", label: "Explorar la cadena", icon: <TravelExploreIcon /> },
  { href: "/compliance", label: "Screening AML", icon: <GppGoodIcon /> },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const chain = useChain();
  const validation = useChainValidation(true);
  const pending = usePending();

  return (
    <Box>
      <PageHeader
        title={`Hola, ${user?.displayName || user?.email?.split("@")[0] || "explorador"}`}
        subtitle="Estado de tu blockchain didactica en tiempo real."
      />

      <InfoNote title="Nuevo en web3? Empieza aqui">
        Una <strong>blockchain</strong> es un libro contable compartido: bloques
        encadenados que nadie puede alterar sin romper la cadena. Crea una{" "}
        <strong>wallet</strong>, <strong>mina</strong> un bloque para obtener
        monedas, <strong>envia</strong> una transferencia y observala
        confirmarse en el <strong>explorer</strong>. Todo es de practica, sin
        dinero real.
      </InfoNote>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<HeightIcon />}
            label="Altura de la cadena"
            value={chain.data?.height ?? "—"}
            loading={chain.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<VerifiedIcon />}
            label="Integridad"
            color={validation.data?.valid ? "success.main" : "error.main"}
            value={
              validation.isLoading ? (
                "—"
              ) : validation.data?.valid ? (
                <Chip size="small" color="success" label="Valida" />
              ) : (
                <Chip size="small" color="error" label="Invalida" />
              )
            }
            loading={validation.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<ReceiptLongIcon />}
            label="En mempool (pendientes)"
            color="warning.main"
            value={pending.data?.length ?? 0}
            loading={pending.isLoading}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Accesos rapidos
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

      {validation.data && !validation.data.valid && (
        <InfoNote title="La cadena reporta errores" severity="error">
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {validation.data.errors?.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </Box>
        </InfoNote>
      )}

      <Box sx={{ mt: 3 }}>
        <Button component={Link} href="/explorer" variant="outlined">
          Ver explorer completo
        </Button>
      </Box>
    </Box>
  );
}
