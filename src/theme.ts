"use client";

import { createTheme } from "@mui/material/styles";

// Paleta Zentto Web3 — tono "blockchain" oscuro con acento indigo/cyan.
export const brand = {
  bg: "#0b1020",
  surface: "#11182e",
  surface2: "#1a2440",
  border: "#26324f",
  primary: "#6366f1",
  primaryHover: "#4f52e0",
  accent: "#22d3ee",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  text: "#e5e9f5",
  muted: "#8b97b8",
};

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "dark",
    primary: { main: brand.primary, dark: brand.primaryHover, contrastText: "#fff" },
    secondary: { main: brand.accent, contrastText: "#06121a" },
    success: { main: brand.success },
    warning: { main: brand.warning },
    error: { main: brand.danger },
    background: { default: brand.bg, paper: brand.surface },
    text: { primary: brand.text, secondary: brand.muted },
    divider: brand.border,
  },
  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "Arial",
      "sans-serif",
    ].join(","),
    button: { textTransform: "none", fontWeight: 600 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: "none", "&:hover": { boxShadow: "none" } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: `1px solid ${brand.border}`,
          backgroundImage: "none",
          backgroundColor: brand.surface,
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small", fullWidth: true },
    },
    MuiFormControl: { defaultProps: { size: "small", fullWidth: true } },
    MuiTableCell: {
      styleOverrides: { root: { borderColor: brand.border } },
    },
  },
});

export default theme;
