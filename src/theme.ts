"use client";

import { createTheme } from "@mui/material/styles";

// Paleta Zentto Web3 — acento indigo/cyan, con variantes oscura y clara.
export const brand = {
  // Oscuro (por defecto)
  bg: "#0b1020",
  surface: "#11182e",
  surface2: "#1a2440",
  border: "#26324f",
  // Marca (compartido entre modos)
  primary: "#6366f1",
  primaryHover: "#4f52e0",
  accent: "#22d3ee",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  text: "#e5e9f5",
  muted: "#8b97b8",
  // Claro
  bgLight: "#f4f6fb",
  surfaceLight: "#ffffff",
  borderLight: "#e3e8f2",
  textLight: "#15203a",
  mutedLight: "#5b6478",
};

const shared = {
  primary: { main: brand.primary, dark: brand.primaryHover, contrastText: "#fff" },
  secondary: { main: brand.accent, contrastText: "#06121a" },
  success: { main: brand.success },
  warning: { main: brand.warning },
  error: { main: brand.danger },
};

const theme = createTheme({
  // Selector por clase: MUI alterna .light/.dark en <html>; el ThemeToggle del
  // layout (useColorScheme/setMode) cambia entre estos esquemas.
  cssVariables: { colorSchemeSelector: "class" },
  defaultColorScheme: "dark",
  colorSchemes: {
    dark: {
      palette: {
        mode: "dark",
        ...shared,
        background: { default: brand.bg, paper: brand.surface },
        text: { primary: brand.text, secondary: brand.muted },
        divider: brand.border,
      },
    },
    light: {
      palette: {
        mode: "light",
        ...shared,
        background: { default: brand.bgLight, paper: brand.surfaceLight },
        text: { primary: brand.textLight, secondary: brand.mutedLight },
        divider: brand.borderLight,
      },
    },
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
        // Usa variables de tema => adapta color en light/dark.
        root: ({ theme }) => ({
          borderRadius: 14,
          border: `1px solid ${theme.vars.palette.divider}`,
          backgroundImage: "none",
          backgroundColor: theme.vars.palette.background.paper,
        }),
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small", fullWidth: true },
    },
    MuiFormControl: { defaultProps: { size: "small", fullWidth: true } },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
      },
    },
  },
});

export default theme;
