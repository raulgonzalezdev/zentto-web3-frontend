"use client";

import { Chip } from "@mui/material";
import type { RiskSeverity } from "@/lib/types";

const MAP: Record<
  string,
  { label: string; color: "success" | "warning" | "error" | "default" }
> = {
  low: { label: "Riesgo bajo", color: "success" },
  medium: { label: "Riesgo medio", color: "warning" },
  high: { label: "Riesgo alto", color: "error" },
  critical: { label: "Riesgo critico", color: "error" },
};

export function RiskBadge({ risk }: { risk?: RiskSeverity | null }) {
  const key = (risk || "").toString().toLowerCase();
  const cfg = MAP[key] || { label: risk ? String(risk) : "Sin evaluar", color: "default" as const };
  return <Chip size="small" color={cfg.color} label={cfg.label} variant="filled" />;
}
