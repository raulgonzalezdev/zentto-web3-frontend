"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Box,
  Alert,
  TextField,
  MenuItem,
  LinearProgress,
  Chip,
  Divider,
} from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote, GLOSSARY } from "@/components/ui/InfoNote";
import { Copyable } from "@/components/ui/Copyable";
import { useStartMining, useMiningJob } from "@/lib/hooks";
import { useWalletStore } from "@/lib/wallet-store";
import { shortHash } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";

const STATE_LABEL: Record<string, { label: string; color: "default" | "info" | "success" | "error" | "warning" }> = {
  queued: { label: "En cola", color: "warning" },
  active: { label: "Minando…", color: "info" },
  completed: { label: "Completado", color: "success" },
  failed: { label: "Fallido", color: "error" },
};

export default function MinadoPage() {
  const { wallets } = useWalletStore();
  const qc = useQueryClient();
  const startMining = useStartMining();
  const [miner, setMiner] = React.useState("");
  const [customMiner, setCustomMiner] = React.useState("");
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const job = useMiningJob(jobId);

  // al completar, refrescar cadena/balances
  React.useEffect(() => {
    if (job.data?.state === "completed") {
      qc.invalidateQueries({ queryKey: ["chain"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["transactions", "pending"] });
    }
  }, [job.data?.state, qc]);

  const minerAddress = miner === "__custom__" ? customMiner.trim() : miner;

  const onMine = async () => {
    setError(null);
    if (!minerAddress) {
      setError("Indica la address del minero que recibira la recompensa.");
      return;
    }
    try {
      const res = await startMining.mutateAsync({ minerAddress });
      setJobId(res.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo lanzar el minado.");
    }
  };

  const state = job.data?.state;
  const stateCfg = state ? STATE_LABEL[state] || { label: state, color: "default" as const } : null;

  return (
    <Box>
      <PageHeader
        title="Minado"
        subtitle="Crea un nuevo bloque y gana la recompensa (coinbase)."
      />

      <InfoNote title="Que es minar?">
        Minar es resolver la <strong>Prueba de Trabajo</strong>: {GLOSSARY.pow}{" "}
        El minero que lo logra empaqueta las transacciones pendientes de la{" "}
        <strong>mempool</strong> en un bloque nuevo y recibe una recompensa
        (coinbase) en la address que indiques.
      </InfoNote>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              select
              label="Address del minero (recibe la recompensa)"
              value={miner}
              onChange={(e) => setMiner(e.target.value)}
            >
              {wallets.map((w) => (
                <MenuItem key={w.address} value={w.address}>
                  {shortHash(w.address, 14, 8)}
                </MenuItem>
              ))}
              <MenuItem value="__custom__">Otra address…</MenuItem>
            </TextField>
            {miner === "__custom__" && (
              <TextField
                label="Address personalizada"
                value={customMiner}
                onChange={(e) => setCustomMiner(e.target.value)}
              />
            )}
            <Button
              variant="contained"
              onClick={onMine}
              disabled={startMining.isPending || (job.data?.state === "active" || job.data?.state === "queued")}
            >
              {startMining.isPending ? "Lanzando…" : "Minar un bloque"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {jobId && (
        <Card>
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1.5 }}
            >
              <Typography variant="h6">Job de minado</Typography>
              {stateCfg && <Chip size="small" color={stateCfg.color} label={stateCfg.label} />}
            </Stack>

            <Typography variant="caption" color="text.secondary">
              Job ID
            </Typography>
            <Box sx={{ mb: 1.5 }}>
              <Copyable value={jobId} display={shortHash(jobId, 12, 8)} />
            </Box>

            {(state === "queued" || state === "active") && (
              <Box sx={{ my: 2 }}>
                <LinearProgress
                  variant={
                    typeof job.data?.progress === "number" ? "determinate" : "indeterminate"
                  }
                  value={job.data?.progress}
                />
                <Typography variant="caption" color="text.secondary">
                  Resolviendo la prueba de trabajo… (se actualiza en vivo)
                </Typography>
              </Box>
            )}

            {state === "completed" && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Alert severity="success" sx={{ mb: 1.5 }}>
                  Bloque minado correctamente. La cadena y los balances se han
                  actualizado.
                </Alert>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "background.default",
                    border: 1,
                    borderColor: "divider",
                    overflow: "auto",
                    fontSize: 12,
                    maxHeight: 280,
                  }}
                >
                  {JSON.stringify(job.data?.result, null, 2)}
                </Box>
              </>
            )}

            {state === "failed" && (
              <Alert severity="error">
                El minado fallo. {job.data?.failedReason || ""}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
