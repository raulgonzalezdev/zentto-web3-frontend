"use client";

import { Box, Card, CardContent, Typography, Stack } from "@mui/material";
import HexagonIcon from "@mui/icons-material/Hexagon";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        bgcolor: "background.default",
        backgroundImage:
          "radial-gradient(800px 400px at 50% -10%, rgba(99,102,241,0.18), transparent)",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 440 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
            <HexagonIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {subtitle}
              </Typography>
            )}
          </Stack>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}
