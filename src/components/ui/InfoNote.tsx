"use client";

import { Alert, AlertTitle, Tooltip, IconButton } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import type { ReactNode } from "react";

/** Recuadro educativo para usuarios nuevos en web3. */
export function InfoNote({
  title,
  children,
  severity = "info",
}: {
  title?: string;
  children: ReactNode;
  severity?: "info" | "warning" | "success" | "error";
}) {
  return (
    <Alert severity={severity} variant="outlined" sx={{ mb: 2 }}>
      {title && <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>}
      {children}
    </Alert>
  );
}

/** Icono "?" con tooltip explicativo junto a un label. */
export function HelpTip({ text }: { text: ReactNode }) {
  return (
    <Tooltip title={text} arrow placement="top">
      <IconButton size="small" sx={{ ml: 0.5 }} aria-label="ayuda">
        <HelpOutlineIcon sx={{ fontSize: 16 }} color="disabled" />
      </IconButton>
    </Tooltip>
  );
}

/** Glosario de terminos clave para reutilizar en tooltips. */
export const GLOSSARY = {
  address:
    "Una 'address' (direccion) es como el numero de cuenta publico de tu wallet. Puedes compartirla para recibir fondos; no revela tu clave privada.",
  privateKey:
    "La clave privada es la contrasena maestra de tu wallet: quien la tenga controla los fondos. El backend la muestra UNA sola vez y no se puede recuperar.",
  block:
    "Un bloque agrupa varias transacciones y se enlaza al anterior por su hash, formando la 'cadena'. Alterar un bloque rompe la cadena.",
  pow: "PoW (Prueba de Trabajo): para crear un bloque hay que resolver un acertijo computacional (encontrar un 'nonce'). Cuesta calculo, por eso asegura la red.",
  mempool:
    "La mempool es la sala de espera: transacciones validas pero aun no incluidas en un bloque. Al minar, salen de la mempool y se confirman.",
  aml: "AML (Anti-Money Laundering): analisis para detectar fondos de origen sospechoso. El screening asigna un nivel de riesgo a una direccion.",
  nonce:
    "El nonce es el numero que los mineros van probando hasta que el hash del bloque cumple la dificultad exigida.",
  fee: "La comision (fee) es un pequeno pago al minero que incluye tu transaccion en un bloque.",
} as const;
