"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Divider, Stack, Typography } from "@mui/material";

const LINKS = [
  { href: "/legal/terminos", label: "Términos y Condiciones" },
  { href: "/legal/privacidad", label: "Privacidad" },
  { href: "/legal/responsabilidad", label: "Responsabilidad" },
];

/** Footer con enlaces legales, visible para todos los roles. */
export function LegalFooter() {
  return (
    <Box component="footer" sx={{ mt: 6 }}>
      <Divider sx={{ mb: 2 }} />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1, sm: 2 }}
        alignItems="center"
        justifyContent="space-between"
        sx={{ pb: 3, px: 1 }}
      >
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} Zentto Web3 — Neobanco custodial
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {LINKS.map((l) => (
            <Typography
              key={l.href}
              component={Link}
              href={l.href}
              variant="caption"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                "&:hover": { color: "primary.main", textDecoration: "underline" },
              }}
            >
              {l.label}
            </Typography>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}

export default LegalFooter;
