"use client";

/**
 * ZenttoDataGrid — wrapper React del web component Lit `<zentto-grid>` real
 * (`@zentto/datagrid` 1.5.0 + tipos de `@zentto/datagrid-core` 1.5.0).
 *
 * El web component es client-only: el import de `@zentto/datagrid` registra
 * `customElements.define('zentto-grid', ...)` y solo puede correr en el browser.
 * Para no romper el prerender/`output: 'export'` de Next:
 *   - El componente interno (`ZenttoGridInner`) importa `@zentto/datagrid` dentro
 *     de un `useEffect` (nunca en SSR).
 *   - Se exporta via `next/dynamic` con `{ ssr: false }`.
 *
 * Patron tomado de zentto-medical (`src/components/ZenttoDataGrid.tsx`).
 */

import * as React from "react";
import dynamic from "next/dynamic";
import { Skeleton, Paper } from "@mui/material";
import type { ColumnDef, GridRow } from "@zentto/datagrid-core";

export type { ColumnDef, GridRow } from "@zentto/datagrid-core";

export interface ZenttoDataGridProps {
  columns: ColumnDef[];
  rows: GridRow[];
  loading?: boolean;
  /** Tamaño de pagina inicial (mapeado a `pageSizeOptions` del grid). */
  pageSize?: number;
  showTotals?: boolean;
  enableSearch?: boolean;
  enableExport?: boolean;
  enableClipboard?: boolean;
  /** Altura CSS del grid. Default: 'auto' (crece con el contenido). */
  height?: string | number;
  /** Compat con el contrato previo; el grid identifica filas internamente. */
  getRowId?: (row: GridRow, index: number) => string | number;
  /** Compat con el contrato previo; el grid trae su propio estado vacio. */
  emptyMessage?: string;
  onRowClick?: (row: GridRow) => void;
  onActionClick?: (action: string, row: GridRow) => void;
}

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "zentto-grid": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

function GridSkeleton() {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="text" height={32} />
      ))}
    </Paper>
  );
}

function ZenttoGridInner({
  columns,
  rows,
  loading = false,
  pageSize = 10,
  showTotals = false,
  enableSearch = true,
  enableExport = true,
  enableClipboard = true,
  height = "auto",
  onRowClick,
  onActionClick,
}: ZenttoDataGridProps) {
  const elRef = React.useRef<(HTMLElement & Record<string, unknown>) | null>(null);
  const [registered, setRegistered] = React.useState(false);

  // Registro del custom element solo en el browser.
  React.useEffect(() => {
    let cancelled = false;
    import("@zentto/datagrid")
      .then(() => {
        if (!cancelled) setRegistered(true);
      })
      .catch(() => {
        /* registro fallido: el grid simplemente no monta */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Propaga props -> propiedades del web component por ref.
  React.useEffect(() => {
    const el = elRef.current;
    if (!el || !registered) return;
    el.columns = columns;
    el.rows = rows;
    el.loading = loading;
    el.showTotals = showTotals;
    el.theme = "zentto";
    el.enableClipboard = enableClipboard;
    el.enableQuickSearch = enableSearch;
    el.showToolbarSearch = enableSearch;
    el.showToolbarExport = enableExport;
    el.enableToolbar = enableSearch || enableExport;
    el.pageSizeOptions = Array.from(
      new Set([pageSize, 10, 25, 50, 100].filter((n) => n > 0)),
    ).sort((a, b) => a - b);
    if (typeof height === "string" && height !== "auto") el.height = height;
  }, [
    registered,
    columns,
    rows,
    loading,
    showTotals,
    enableClipboard,
    enableSearch,
    enableExport,
    pageSize,
    height,
  ]);

  // Eventos del grid -> callbacks React.
  React.useEffect(() => {
    const el = elRef.current;
    if (!el || !registered) return;

    const handleRowClick = (e: Event) => {
      onRowClick?.((e as CustomEvent).detail?.row);
    };
    const handleActionClick = (e: Event) => {
      const { action, row } = (e as CustomEvent).detail ?? {};
      onActionClick?.(action, row);
    };

    el.addEventListener("row-click", handleRowClick);
    el.addEventListener("action-click", handleActionClick);
    return () => {
      el.removeEventListener("row-click", handleRowClick);
      el.removeEventListener("action-click", handleActionClick);
    };
  }, [registered, onRowClick, onActionClick]);

  if (!registered) return <GridSkeleton />;

  return (
    <zentto-grid
      ref={elRef as React.RefObject<HTMLElement>}
      style={{
        display: "block",
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}

/**
 * Export client-only: `ssr: false` garantiza que el web component nunca se
 * intente prerender en build/export (output: 'export').
 */
export const ZenttoDataGrid = dynamic(() => Promise.resolve(ZenttoGridInner), {
  ssr: false,
  loading: () => <GridSkeleton />,
});

export default ZenttoDataGrid;
