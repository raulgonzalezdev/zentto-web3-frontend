"use client";

/**
 * ZenttoDataGrid — STAND-IN TEMPORAL de `@zentto/datagrid`.
 *
 * El paquete privado `@zentto/datagrid` / `@zentto/datagrid-core` no puede
 * instalarse aun (token npm privado pendiente). Este componente replica la
 * MISMA FORMA DE PROPS para permitir un swap directo en el futuro:
 *
 *    <ZenttoDataGrid columns={cols} rows={rows} />
 *
 * Cuando el token este disponible, basta con reemplazar este import por:
 *    import { ZenttoDataGrid } from "@zentto/datagrid";
 * (manteniendo la API columns/rows/renderCell).
 *
 * Implementado con MUI <Table> — NUNCA <table> HTML cruda (regla Zentto).
 */

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Paper,
  Box,
  Typography,
  Skeleton,
} from "@mui/material";

export interface ZenttoColumn<R = any> {
  field: string;
  headerName: string;
  width?: number | string;
  align?: "left" | "right" | "center";
  renderCell?: (value: any, row: R) => React.ReactNode;
}

export interface ZenttoDataGridProps<R = any> {
  columns: ZenttoColumn<R>[];
  rows: R[];
  getRowId?: (row: R, index: number) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  dense?: boolean;
}

export function ZenttoDataGrid<R = any>({
  columns,
  rows,
  getRowId,
  loading = false,
  emptyMessage = "Sin registros.",
  pageSize = 10,
  dense = true,
}: ZenttoDataGridProps<R>) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(pageSize);

  React.useEffect(() => {
    setPage(0);
  }, [rows]);

  const paged = React.useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage],
  );

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <TableContainer>
        <Table size={dense ? "small" : "medium"} stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.field}
                  align={col.align}
                  sx={{
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    width: col.width,
                    bgcolor: "background.paper",
                  }}
                >
                  {col.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.field}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row, idx) => {
                const id = getRowId
                  ? getRowId(row, idx)
                  : (row as any).id ?? (row as any).index ?? idx;
                return (
                  <TableRow hover key={id}>
                    {columns.map((col) => {
                      const value = (row as any)[col.field];
                      return (
                        <TableCell key={col.field} align={col.align}>
                          {col.renderCell
                            ? col.renderCell(value, row)
                            : value === null || value === undefined
                              ? "—"
                              : String(value)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {rows.length > rowsPerPage && (
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Filas:"
        />
      )}
    </Paper>
  );
}

export default ZenttoDataGrid;
