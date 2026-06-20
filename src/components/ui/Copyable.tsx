"use client";

import * as React from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

/** Texto monoespaciado (hash/address) con boton de copiar. */
export function Copyable({
  value,
  display,
  mono = true,
}: {
  value: string;
  display?: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
  };

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, maxWidth: "100%" }}>
      <Typography
        component="span"
        variant="body2"
        sx={{
          fontFamily: mono ? "ui-monospace, Menlo, Consolas, monospace" : undefined,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={value}
      >
        {display ?? value}
      </Typography>
      <Tooltip title={copied ? "Copiado" : "Copiar"} arrow>
        <IconButton size="small" onClick={copy} aria-label="copiar">
          {copied ? (
            <CheckIcon sx={{ fontSize: 16 }} color="success" />
          ) : (
            <ContentCopyIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
