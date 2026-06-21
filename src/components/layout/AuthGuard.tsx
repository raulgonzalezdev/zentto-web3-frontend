"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import { useAuth } from "@/lib/auth-context";
import { isAdminRoute } from "./nav";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/";

  const role = user?.role ?? "user";
  const blockedByRole =
    isAuthenticated && role === "user" && isAdminRoute(pathname);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    // El home '/' es el panel de operación: un usuario normal cae en su cuenta.
    if (blockedByRole && pathname === "/") {
      router.replace("/cuenta");
    }
  }, [isLoading, isAuthenticated, blockedByRole, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Verificando sesion…
        </Typography>
      </Box>
    );
  }

  // Un usuario normal no puede ver rutas de backoffice ('/' redirige arriba).
  if (blockedByRole && pathname !== "/") {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Stack spacing={2} alignItems="center" textAlign="center">
          <BlockIcon color="disabled" sx={{ fontSize: 56 }} />
          <Typography variant="h6">Sin acceso</Typography>
          <Typography variant="body2" color="text.secondary" maxWidth={420}>
            Esta sección es exclusiva del equipo de operación de Zentto. Tu
            cuenta no tiene permisos para verla.
          </Typography>
          <Button variant="contained" onClick={() => router.replace("/cuenta")}>
            Ir a mi cuenta
          </Button>
        </Stack>
      </Box>
    );
  }

  return <>{children}</>;
}
