"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import { Copyable } from "@/components/ui/Copyable";
import { ZenttoDataGrid, type ZenttoColumn } from "@/components/data-grid/ZenttoDataGrid";
import { GraphView } from "@/components/analytics/GraphView";
import { useGraph, useHubs } from "@/lib/hooks";
import { shortHash, formatAmount } from "@/lib/format";
import type { GraphEdge, Hub } from "@/lib/types";

export default function AnalyticsPage() {
  const [tab, setTab] = React.useState(0);
  const graph = useGraph();
  const hubs = useHubs(5);

  const edgeCols: ZenttoColumn<GraphEdge>[] = [
    {
      field: "from",
      headerName: "Origen",
      renderCell: (v) => <Copyable value={v} display={shortHash(v)} />,
    },
    {
      field: "to",
      headerName: "Destino",
      renderCell: (v) => <Copyable value={v} display={shortHash(v)} />,
    },
    {
      field: "amount",
      headerName: "Monto",
      align: "right",
      renderCell: (v) => (v !== undefined ? formatAmount(v) : "—"),
    },
  ];

  const hubCols: ZenttoColumn<Hub>[] = [
    {
      field: "address",
      headerName: "Address (hub)",
      renderCell: (v) => <Copyable value={v} display={shortHash(v, 14, 10)} />,
    },
    {
      field: "degree",
      headerName: "Grado (conexiones)",
      align: "right",
      renderCell: (v) => <Chip size="small" color="secondary" label={v} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Analitica de la red"
        subtitle="Grafo de direcciones y deteccion de hubs (tipo exchange)."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              graph.refetch();
              hubs.refetch();
            }}
          >
            Actualizar
          </Button>
        }
      />

      <InfoNote title="Como leer el grafo?">
        Cada <strong>nodo</strong> es una direccion y cada <strong>arista</strong>{" "}
        un flujo de fondos entre ellas. Las direcciones con muchas conexiones
        (alto <strong>grado</strong>) suelen ser <strong>hubs</strong>: exchanges
        o mezcladores por los que pasa mucho volumen.
      </InfoNote>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip label={`Nodos: ${graph.data?.nodes?.length ?? 0}`} />
        <Chip label={`Aristas: ${graph.data?.edges?.length ?? 0}`} />
        <Chip color="secondary" label={`Hubs: ${hubs.data?.length ?? 0}`} />
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Grafo de direcciones
          </Typography>
          <GraphView
            nodes={graph.data?.nodes ?? []}
            edges={graph.data?.edges ?? []}
            loading={graph.isLoading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Hubs detectados" />
            <Tab label="Aristas (flujos)" />
          </Tabs>
          {tab === 0 ? (
            <ZenttoDataGrid
              columns={hubCols}
              rows={hubs.data ?? []}
              getRowId={(h, i) => h.address ?? i}
              loading={hubs.isLoading}
              emptyMessage="No se detectaron hubs (grado minimo 5)."
            />
          ) : (
            <ZenttoDataGrid
              columns={edgeCols}
              rows={graph.data?.edges ?? []}
              getRowId={(e, i) => `${e.from}-${e.to}-${i}`}
              loading={graph.isLoading}
              emptyMessage="Aun no hay flujos en el grafo."
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
