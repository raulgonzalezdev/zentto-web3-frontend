"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  TextField,
  Chip,
  Divider,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import { Copyable } from "@/components/ui/Copyable";
import { useEvmInfo, useEvmAddress, useEvmTx } from "@/lib/hooks";
import { shortHash } from "@/lib/format";

/** Base del explorer Sepolia (el backend puede sobreescribirla en /evm/info). */
const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";

function explorerBase(info?: { explorer?: string }): string {
  const e = info?.explorer;
  if (typeof e === "string" && e.startsWith("http")) return e.replace(/\/$/, "");
  return SEPOLIA_EXPLORER;
}

export default function OnchainPage() {
  const info = useEvmInfo();

  // address lookup
  const [addrInput, setAddrInput] = React.useState("");
  const [addr, setAddr] = React.useState<string | null>(null);
  const addrQuery = useEvmAddress(addr);

  // tx lookup
  const [hashInput, setHashInput] = React.useState("");
  const [hash, setHash] = React.useState<string | null>(null);
  const txQuery = useEvmTx(hash);

  const base = explorerBase(info.data);

  return (
    <Box>
      <PageHeader
        title="On-chain (EVM)"
        subtitle="Red EVM real (Sepolia testnet) — dinero on-chain, no el sandbox."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => info.refetch()}
          >
            Actualizar
          </Button>
        }
      />

      <InfoNote title="¿Qué es esto?">
        A diferencia del <strong>Sandbox</strong> (cadena didáctica), aquí
        consultas una red EVM real (<strong>Sepolia</strong>). Puedes ver el
        último bloque, el saldo nativo (ETH) y USDC de cualquier dirección, y el
        estado de una transacción on-chain.
      </InfoNote>

      <Grid container spacing={2}>
        {/* Estado de la red */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Red EVM
              </Typography>
              {info.isLoading ? (
                <CircularProgress size={20} />
              ) : info.isError ? (
                <Alert severity="error">No se pudo leer /evm/info.</Alert>
              ) : (
                <Stack spacing={1.25}>
                  <Row label="Red">
                    {String(info.data?.network ?? "Sepolia")}
                  </Row>
                  {info.data?.chainId !== undefined && (
                    <Row label="Chain ID">{String(info.data.chainId)}</Row>
                  )}
                  <Row label="Último bloque">
                    <Chip
                      size="small"
                      color="primary"
                      label={String(info.data?.blockNumber ?? "—")}
                    />
                  </Row>
                  <Divider />
                  <MuiLink
                    href={base}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                  >
                    Abrir explorer <OpenInNewIcon sx={{ fontSize: 16 }} />
                  </MuiLink>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Saldo de una address */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Saldo de una dirección
              </Typography>
              <Stack
                component="form"
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                onSubmit={(e) => {
                  e.preventDefault();
                  setAddr(addrInput.trim() || null);
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Address (0x…)"
                  value={addrInput}
                  onChange={(e) => setAddrInput(e.target.value)}
                  placeholder="0x0000000000000000000000000000000000000000"
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SearchIcon />}
                  disabled={!addrInput.trim()}
                >
                  Consultar
                </Button>
              </Stack>

              <Box sx={{ mt: 2 }}>
                {addr && addrQuery.isLoading && <CircularProgress size={20} />}
                {addrQuery.isError && (
                  <Alert severity="error">
                    No se pudo consultar esa dirección.
                  </Alert>
                )}
                {addrQuery.data && (
                  <Stack spacing={1.25}>
                    <Row label="Dirección">
                      <Copyable
                        value={addrQuery.data.address || addr || ""}
                        display={shortHash(addrQuery.data.address || addr || "", 12, 8)}
                      />
                    </Row>
                    <Row label="ETH (nativo)">
                      <Chip size="small" variant="outlined" label={String(addrQuery.data.native ?? "0")} />
                    </Row>
                    <Row label="USDC">
                      <Chip size="small" variant="outlined" label={String(addrQuery.data.usdc ?? "0")} />
                    </Row>
                    <Divider />
                    <MuiLink
                      href={`${base}/address/${addrQuery.data.address || addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                    >
                      Ver en explorer <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </MuiLink>
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Estado de una tx */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Estado de una transacción
              </Typography>
              <Stack
                component="form"
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                onSubmit={(e) => {
                  e.preventDefault();
                  setHash(hashInput.trim() || null);
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Hash de tx (0x…)"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  placeholder="0x…"
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SearchIcon />}
                  disabled={!hashInput.trim()}
                >
                  Consultar
                </Button>
              </Stack>

              <Box sx={{ mt: 2 }}>
                {hash && txQuery.isLoading && <CircularProgress size={20} />}
                {txQuery.isError && (
                  <Alert severity="error">
                    No se pudo consultar esa transacción.
                  </Alert>
                )}
                {txQuery.data && (
                  <Stack spacing={1.25}>
                    <Row label="Hash">
                      <Copyable
                        value={txQuery.data.hash || hash || ""}
                        display={shortHash(txQuery.data.hash || hash || "", 14, 10)}
                      />
                    </Row>
                    <Row label="Estado">
                      <Chip
                        size="small"
                        color={
                          /success|confirmed|1/i.test(String(txQuery.data.status))
                            ? "success"
                            : /fail|reverted|0/i.test(String(txQuery.data.status))
                              ? "error"
                              : "warning"
                        }
                        label={String(txQuery.data.status ?? "desconocido")}
                      />
                    </Row>
                    {txQuery.data.blockNumber != null && (
                      <Row label="Bloque">{String(txQuery.data.blockNumber)}</Row>
                    )}
                    {txQuery.data.from && (
                      <Row label="De">
                        <Copyable value={txQuery.data.from} display={shortHash(txQuery.data.from)} />
                      </Row>
                    )}
                    {txQuery.data.to && (
                      <Row label="A">
                        <Copyable value={txQuery.data.to} display={shortHash(txQuery.data.to)} />
                      </Row>
                    )}
                    <Divider />
                    <MuiLink
                      href={`${base}/tx/${txQuery.data.hash || hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                    >
                      Ver en explorer <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </MuiLink>
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ fontWeight: 500, textAlign: "right" }}>
        {children}
      </Typography>
    </Stack>
  );
}
