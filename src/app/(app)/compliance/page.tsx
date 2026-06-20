"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Chip,
  Divider,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote, GLOSSARY } from "@/components/ui/InfoNote";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { useScreen, useReport, useComplianceStatus } from "@/lib/hooks";
import type { ComplianceAssessment } from "@/lib/types";

function AssessmentView({ a }: { a: ComplianceAssessment }) {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <RiskBadge risk={a.risk} />
        {typeof a.riskScore === "number" && (
          <Chip size="small" variant="outlined" label={`Score: ${a.riskScore}`} />
        )}
      </Stack>
      {a.flags && a.flags.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Indicadores
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
            {a.flags.map((f) => (
              <Chip key={f} size="small" color="warning" variant="outlined" label={f} />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

export default function CompliancePage() {
  const status = useComplianceStatus();
  const screen = useScreen();
  const report = useReport();
  const [address, setAddress] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const run = async (kind: "screen" | "report") => {
    setError(null);
    const addr = address.trim();
    if (!addr) {
      setError("Introduce una address para evaluar.");
      return;
    }
    try {
      if (kind === "screen") await screen.mutateAsync({ address: addr });
      else await report.mutateAsync({ address: addr });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo evaluar.");
    }
  };

  const assessment = report.data?.assessment ?? screen.data;
  const narrative =
    report.data?.report?.narrative ??
    (typeof report.data?.report === "string" ? report.data.report : undefined);

  return (
    <Box>
      <PageHeader
        title="Cumplimiento (AML)"
        subtitle="Evalua el riesgo de una direccion y genera un informe con IA."
      />

      <InfoNote title="Que es AML?">
        {GLOSSARY.aml} El <strong>screening</strong> te da el nivel de riesgo al
        instante; el <strong>informe</strong> anade una narrativa explicativa
        generada por IA.
      </InfoNote>

      {status.data && !status.data.aiEnabled && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          La narrativa con IA esta desactivada en el backend. El screening de
          riesgo sigue disponible.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ sm: "flex-end" }}
          >
            <TextField
              label="Address a evaluar"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="address de la direccion a investigar"
            />
            <Button
              variant="outlined"
              onClick={() => run("screen")}
              disabled={screen.isPending}
              sx={{ minWidth: 160 }}
            >
              {screen.isPending ? "Evaluando…" : "Screening rapido"}
            </Button>
            <Button
              variant="contained"
              onClick={() => run("report")}
              disabled={report.isPending}
              sx={{ minWidth: 180 }}
            >
              {report.isPending ? "Generando…" : "Generar informe IA"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {assessment && (
          <Grid size={{ xs: 12, md: narrative ? 4 : 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Evaluacion de riesgo
                </Typography>
                <AssessmentView a={assessment} />
              </CardContent>
            </Card>
          </Grid>
        )}

        {(narrative || report.isPending) && (
          <Grid size={{ xs: 12, md: assessment ? 8 : 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Informe de cumplimiento (IA)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {report.isPending ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={18} />
                    <Typography color="text.secondary">
                      La IA esta redactando el informe…
                    </Typography>
                  </Stack>
                ) : narrative ? (
                  <Box
                    sx={{
                      "& h1,& h2,& h3": { mt: 2, mb: 1, fontWeight: 700 },
                      "& p": { mb: 1.2, lineHeight: 1.6 },
                      "& ul,& ol": { pl: 3, mb: 1.2 },
                      "& code": {
                        bgcolor: "background.default",
                        px: 0.5,
                        borderRadius: 1,
                        fontFamily: "ui-monospace, monospace",
                      },
                      "& table": { borderCollapse: "collapse", width: "100%" },
                      "& th,& td": {
                        border: 1,
                        borderColor: "divider",
                        p: 1,
                      },
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                    >
                      {narrative}
                    </ReactMarkdown>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
