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
import {
  ZenttoDataGrid,
  type ColumnDef,
  type GridRow,
} from "@/components/data-grid/ZenttoDataGrid";
import { GraphView } from "@/components/analytics/GraphView";
import { useGraph, useHubs } from "@/lib/hooks";

export default function AnalyticsPage() {
  const [tab, setTab] = React.useState(0);
  const graph = useGraph();
  const hubs = useHubs(5);

  // El backend devuelve aristas con { from, to, volume, count }.
  const edgeRows: GridRow[] = React.useMemo(
    () =>
      (graph.data?.edges ?? []).map((e) => ({
        from: e.from,
        to: e.to,
        volume: (e as Record<string, unknown>).volume ?? e.amount ?? 0,
        count: (e as Record<string, unknown>).count ?? 0,
      })),
    [graph.data],
  );

  const hubRows: GridRow[] = React.useMemo(
    () =>
      (hubs.data ?? []).map((h) => ({
        address: h.address,
        degree: h.degree,
      })),
    [hubs.data],
  );

  const edgeCols: ColumnDef[] = [
    { field: "from", header: "Origen", flex: 2, minWidth: 200 },
    { field: "to", header: "Destino", flex: 2, minWidth: 200 },
    { field: "volume", header: "Volumen", type: "number", width: 140 },
    { field: "count", header: "Movimientos", type: "number", width: 140 },
  ];

  const hubCols: ColumnDef[] = [
    { field: "address", header: "Address (hub)", flex: 2, minWidth: 240 },
    { field: "degree", header: "Grado (conexiones)", type: "number", width: 180 },
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
              rows={hubRows}
              loading={hubs.isLoading}
            />
          ) : (
            <ZenttoDataGrid
              columns={edgeCols}
              rows={edgeRows}
              loading={graph.isLoading}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
