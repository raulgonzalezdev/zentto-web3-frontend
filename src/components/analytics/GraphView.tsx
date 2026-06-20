"use client";

import * as React from "react";
import { Box, Typography, Tooltip, Skeleton } from "@mui/material";
import { brand } from "@/theme";
import { shortHash } from "@/lib/format";
import type { GraphNode, GraphEdge } from "@/lib/types";

/**
 * Visualizacion simple del grafo en SVG con layout circular.
 * Sin dependencias externas (d3/cytoscape) para mantener el bundle ligero;
 * suficiente para el caracter didactico de Zentto Web3.
 */
export function GraphView({
  nodes,
  edges,
  loading,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  loading?: boolean;
}) {
  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 60;

  const positions = React.useMemo(() => {
    const map = new Map<string, { x: number; y: number; degree: number }>();
    const n = Math.max(nodes.length, 1);
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      map.set(node.id, {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        degree: node.degree ?? 0,
      });
    });
    return map;
  }, [nodes, cx, cy, radius]);

  if (loading) {
    return <Skeleton variant="rectangular" height={size} sx={{ borderRadius: 2 }} />;
  }

  if (nodes.length === 0) {
    return (
      <Box
        sx={{
          height: 240,
          display: "grid",
          placeItems: "center",
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography color="text.secondary">
          El grafo esta vacio. Realiza transacciones y mina bloques para generar
          relaciones.
        </Typography>
      </Box>
    );
  }

  const maxDegree = Math.max(1, ...nodes.map((n) => n.degree ?? 0));

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        style={{ maxWidth: size, display: "block", margin: "0 auto" }}
        role="img"
        aria-label="Grafo de direcciones"
      >
        {/* aristas */}
        {edges.map((e, i) => {
          const a = positions.get(e.from);
          const b = positions.get(e.to);
          if (!a || !b) return null;
          return (
            <line
              key={`e-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={brand.border}
              strokeWidth={1.2}
              opacity={0.7}
            />
          );
        })}
        {/* nodos */}
        {nodes.map((node) => {
          const p = positions.get(node.id);
          if (!p) return null;
          const r = 6 + ((node.degree ?? 0) / maxDegree) * 14;
          const isHub = (node.degree ?? 0) >= 5;
          return (
            <Tooltip
              key={node.id}
              title={`${node.label || shortHash(node.id)} · grado ${node.degree ?? 0}`}
              arrow
            >
              <g style={{ cursor: "pointer" }}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={isHub ? brand.accent : brand.primary}
                  stroke={brand.bg}
                  strokeWidth={2}
                />
              </g>
            </Tooltip>
          );
        })}
      </svg>
      <Box
        sx={{
          display: "flex",
          gap: 3,
          justifyContent: "center",
          mt: 1,
          flexWrap: "wrap",
        }}
      >
        <Legend color={brand.primary} label="Direccion" />
        <Legend color={brand.accent} label="Hub (grado ≥ 5)" />
      </Box>
    </Box>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Box
        sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: color }}
      />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
