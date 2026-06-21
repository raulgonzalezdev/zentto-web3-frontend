"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AddIcon from "@mui/icons-material/Add";
import { PageHeader } from "@/components/ui/PageHeader";
import { InfoNote } from "@/components/ui/InfoNote";
import {
  ZenttoDataGrid,
  type ColumnDef,
  type GridRow,
} from "@/components/data-grid/ZenttoDataGrid";
import {
  useP2pOrders,
  useP2pMyOrders,
  useP2pTrades,
  useP2pCreateOrder,
  useP2pTakeOrder,
  useP2pCancelOrder,
  useP2pConfirmTrade,
  useP2pCancelTrade,
} from "@/lib/hooks";
import type { P2pSide, P2pAsset, P2pTrade } from "@/lib/types";

const ASSETS: P2pAsset[] = ["USDT", "USDC"];

/** Normaliza un timestamp a ISO-8601 para el grid. */
function toIso(ts: number | string | null | undefined): string {
  if (ts === null || ts === undefined) return "";
  let ms: number;
  if (typeof ts === "string" && /^\d+$/.test(ts)) {
    const n = Number(ts);
    ms = n < 1e12 ? n * 1000 : n;
  } else if (typeof ts === "number") {
    ms = ts < 1e12 ? ts * 1000 : ts;
  } else {
    const d = new Date(ts as string);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function fmtVes(v?: string | null): string {
  if (!v) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return new Intl.NumberFormat("es-VE", { maximumFractionDigits: 2 }).format(n);
}

/** Trades en los que el vendedor aún puede liberar / cancelar. */
const ACTIVE_TRADE = new Set(["pending", "paid", "disputed"]);

export default function P2pPage() {
  // Tab 0 = Comprar (muestra ofertas de venta), Tab 1 = Vender (ofertas de compra).
  const [tab, setTab] = React.useState(0);
  const [assetFilter, setAssetFilter] = React.useState<P2pAsset | "">("");

  // En "Comprar" el usuario quiere comprar → ve ofertas side='sell'.
  const bookSide: P2pSide = tab === 0 ? "sell" : "buy";

  const orders = useP2pOrders(bookSide, assetFilter || undefined);
  const myOrders = useP2pMyOrders();
  const trades = useP2pTrades();

  const createOrder = useP2pCreateOrder();
  const takeOrder = useP2pTakeOrder();
  const cancelOrder = useP2pCancelOrder();
  const confirmTrade = useP2pConfirmTrade();
  const cancelTrade = useP2pCancelTrade();

  const [toast, setToast] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // --- Publicar oferta ---
  const [pubOpen, setPubOpen] = React.useState(false);
  const [pSide, setPSide] = React.useState<P2pSide>("sell");
  const [pAsset, setPAsset] = React.useState<P2pAsset>("USDT");
  const [pAmount, setPAmount] = React.useState("");
  const [pPrice, setPPrice] = React.useState("");
  const [pMethod, setPMethod] = React.useState("");
  const [pError, setPError] = React.useState<string | null>(null);

  const openPublish = () => {
    setPSide(tab === 0 ? "buy" : "sell");
    setPAsset("USDT");
    setPAmount("");
    setPPrice("");
    setPMethod("");
    setPError(null);
    setPubOpen(true);
  };

  const submitPublish = async () => {
    setPError(null);
    try {
      await createOrder.mutateAsync({
        side: pSide,
        asset: pAsset,
        amount: pAmount.trim(),
        priceVes: pPrice.trim(),
        paymentMethod: pMethod.trim() || undefined,
      });
      setPubOpen(false);
      setToast(
        pSide === "sell"
          ? `Oferta de venta publicada. Tu ${pAsset} quedó en escrow.`
          : "Oferta de compra publicada.",
      );
    } catch (e) {
      setPError(e instanceof Error ? e.message : "No se pudo publicar la oferta.");
    }
  };

  /* ---------- Order book ---------- */
  const bookById = React.useMemo(() => {
    const m = new Map<string, GridRow>();
    (orders.data ?? []).forEach((o) => m.set(o.id, o as unknown as GridRow));
    return m;
  }, [orders.data]);

  const bookRows: GridRow[] = React.useMemo(
    () =>
      (orders.data ?? []).map((o) => ({
        id: o.id,
        maker: o.makerEmail ?? "—",
        asset: o.asset,
        amount: o.amount,
        priceVes: fmtVes(o.priceVes),
        paymentMethod: o.paymentMethod ?? "—",
        createdAt: toIso(o.createdAt),
      })),
    [orders.data],
  );

  const bookCols: ColumnDef[] = [
    { field: "maker", header: "Anunciante", minWidth: 200, flex: 1 },
    { field: "asset", header: "Asset", width: 100 },
    { field: "amount", header: "Cantidad", minWidth: 130 },
    { field: "priceVes", header: "Precio (VES)", minWidth: 140 },
    { field: "paymentMethod", header: "Método de pago", minWidth: 160 },
    { field: "createdAt", header: "Publicada", type: "datetime", minWidth: 170 },
    {
      field: "acciones",
      header: "",
      width: 120,
      type: "actions",
      actions: [
        { icon: "shopping_cart", label: "Tomar", action: "take", color: "primary" },
      ],
    },
  ];

  const onBookAction = async (action: string, row: GridRow) => {
    if (action !== "take") return;
    setError(null);
    try {
      await takeOrder.mutateAsync({ id: String(row.id) });
      setToast(
        tab === 0
          ? "Oferta tomada. Realiza el pago y revisa 'Mis trades'."
          : "Oferta tomada. Revisa 'Mis trades'.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo tomar la oferta.");
    }
  };

  /* ---------- Mis órdenes ---------- */
  const myOrderRows: GridRow[] = React.useMemo(
    () =>
      (myOrders.data ?? []).map((o) => ({
        id: o.id,
        side: o.side === "buy" ? "Compra" : "Venta",
        asset: o.asset,
        amount: o.amount,
        priceVes: fmtVes(o.priceVes),
        status: o.status ?? "open",
        createdAt: toIso(o.createdAt),
      })),
    [myOrders.data],
  );

  const myOrderCols: ColumnDef[] = [
    {
      field: "side",
      header: "Lado",
      width: 110,
      statusColors: { Compra: "success", Venta: "warning" },
    },
    { field: "asset", header: "Asset", width: 100 },
    { field: "amount", header: "Cantidad", minWidth: 120 },
    { field: "priceVes", header: "Precio (VES)", minWidth: 130 },
    {
      field: "status",
      header: "Estado",
      width: 120,
      statusColors: {
        open: "info",
        partial: "warning",
        filled: "success",
        cancelled: "default",
      },
    },
    { field: "createdAt", header: "Publicada", type: "datetime", minWidth: 170 },
    {
      field: "acciones",
      header: "",
      width: 120,
      type: "actions",
      actions: [
        { icon: "close", label: "Cancelar", action: "cancel", color: "error" },
      ],
    },
  ];

  const onMyOrderAction = async (action: string, row: GridRow) => {
    if (action !== "cancel") return;
    setError(null);
    try {
      await cancelOrder.mutateAsync({ id: String(row.id) });
      setToast("Oferta cancelada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cancelar la oferta.");
    }
  };

  /* ---------- Mis trades ---------- */
  const tradeById = React.useMemo(() => {
    const m = new Map<string, P2pTrade>();
    (trades.data ?? []).forEach((t) => m.set(t.id, t));
    return m;
  }, [trades.data]);

  const isSeller = (t: P2pTrade) =>
    typeof t.isSeller === "boolean" ? t.isSeller : t.role === "seller";

  const tradeRows: GridRow[] = React.useMemo(
    () =>
      (trades.data ?? []).map((t) => ({
        id: t.id,
        rol: isSeller(t) ? "Vendedor" : "Comprador",
        asset: t.asset,
        amount: t.amount,
        priceVes: fmtVes(t.priceVes),
        counterparty: t.counterpartyEmail ?? "—",
        status: t.status,
        createdAt: toIso(t.createdAt),
      })),
    [trades.data],
  );

  const tradeCols: ColumnDef[] = [
    {
      field: "rol",
      header: "Mi rol",
      width: 120,
      statusColors: { Vendedor: "warning", Comprador: "success" },
    },
    { field: "asset", header: "Asset", width: 90 },
    { field: "amount", header: "Cantidad", minWidth: 110 },
    { field: "priceVes", header: "Precio (VES)", minWidth: 130 },
    { field: "counterparty", header: "Contraparte", minWidth: 180, flex: 1 },
    {
      field: "status",
      header: "Estado",
      width: 130,
      statusColors: {
        pending: "info",
        paid: "warning",
        released: "success",
        completed: "success",
        cancelled: "default",
        disputed: "error",
      },
    },
    { field: "createdAt", header: "Fecha", type: "datetime", minWidth: 170 },
    {
      field: "acciones",
      header: "Acciones",
      width: 200,
      type: "actions",
      actions: [
        {
          icon: "check",
          label: "Confirmar pago recibido",
          action: "confirm",
          color: "success",
        },
        { icon: "close", label: "Cancelar", action: "cancel", color: "error" },
      ],
    },
  ];

  const onTradeAction = async (action: string, row: GridRow) => {
    const t = tradeById.get(String(row.id));
    if (!t) return;
    setError(null);
    if (action === "confirm") {
      if (!isSeller(t)) {
        setToast("Solo el vendedor confirma el pago recibido.");
        return;
      }
      if (!ACTIVE_TRADE.has(t.status)) {
        setToast(`Este trade ya está ${t.status}.`);
        return;
      }
      try {
        await confirmTrade.mutateAsync({ id: t.id });
        setToast("Pago confirmado. El cripto fue liberado al comprador.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo confirmar el pago.");
      }
      return;
    }
    if (action === "cancel") {
      if (!ACTIVE_TRADE.has(t.status)) {
        setToast(`Este trade ya está ${t.status}.`);
        return;
      }
      try {
        await cancelTrade.mutateAsync({ id: t.id });
        setToast("Trade cancelado.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cancelar el trade.");
      }
    }
  };

  return (
    <Box>
      <PageHeader
        title="P2P"
        subtitle="Compra y vende USDT/USDC con otros usuarios pagando en bolívares."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                orders.refetch();
                myOrders.refetch();
                trades.refetch();
              }}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openPublish}
            >
              Publicar oferta
            </Button>
          </Stack>
        }
      />

      <InfoNote title="Mercado P2P">
        En <strong>Comprar</strong> ves las ofertas de quienes <strong>venden</strong>{" "}
        cripto; en <strong>Vender</strong> ves las de quienes <strong>compran</strong>.
        Al publicar una venta, tu cripto queda en <strong>escrow</strong> hasta que
        confirmes el pago en bolívares. Nunca liberes el cripto sin haber verificado
        el pago en tu cuenta.
      </InfoNote>

      {toast && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setToast(null)}>
          {toast}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Order book */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab icon={<StorefrontIcon />} iconPosition="start" label="Comprar" />
              <Tab icon={<StorefrontIcon />} iconPosition="start" label="Vender" />
            </Tabs>
            <TextField
              select
              size="small"
              label="Asset"
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value as P2pAsset | "")}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {ASSETS.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {orders.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              No se pudo cargar el order book.
            </Alert>
          )}

          <ZenttoDataGrid
            columns={bookCols}
            rows={bookRows}
            loading={orders.isLoading}
            pageSize={25}
            onActionClick={onBookAction}
          />
          {!orders.isLoading && bookRows.length === 0 && !orders.isError && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No hay ofertas {tab === 0 ? "de venta" : "de compra"} abiertas.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Mis órdenes */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Mis órdenes
          </Typography>
          {myOrders.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              No se pudieron cargar tus órdenes.
            </Alert>
          )}
          <ZenttoDataGrid
            columns={myOrderCols}
            rows={myOrderRows}
            loading={myOrders.isLoading}
            pageSize={10}
            onActionClick={onMyOrderAction}
          />
          {!myOrders.isLoading && myOrderRows.length === 0 && !myOrders.isError && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Aún no has publicado ofertas.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Mis trades */}
      <Card>
        <CardContent>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Typography variant="h6">Mis trades</Typography>
            <Chip
              size="small"
              variant="outlined"
              label="El vendedor confirma el pago para liberar el cripto"
            />
          </Stack>
          {trades.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              No se pudieron cargar tus trades.
            </Alert>
          )}
          <ZenttoDataGrid
            columns={tradeCols}
            rows={tradeRows}
            loading={trades.isLoading}
            pageSize={10}
            onActionClick={onTradeAction}
          />
          {!trades.isLoading && tradeRows.length === 0 && !trades.isError && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Aún no tienes trades. Toma una oferta del order book para empezar.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Diálogo publicar oferta */}
      <Dialog open={pubOpen} onClose={() => setPubOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Publicar oferta</DialogTitle>
        <DialogContent dividers>
          {pError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {pError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Quiero"
              value={pSide}
              onChange={(e) => setPSide(e.target.value as P2pSide)}
            >
              <MenuItem value="sell">Vender cripto (recibo VES)</MenuItem>
              <MenuItem value="buy">Comprar cripto (pago VES)</MenuItem>
            </TextField>
            <TextField
              select
              label="Asset"
              value={pAsset}
              onChange={(e) => setPAsset(e.target.value as P2pAsset)}
            >
              {ASSETS.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Cantidad"
              value={pAmount}
              onChange={(e) => setPAmount(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: "any" }}
            />
            <TextField
              label="Precio por unidad (VES)"
              value={pPrice}
              onChange={(e) => setPPrice(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: "any" }}
            />
            <TextField
              label="Método de pago (opcional)"
              value={pMethod}
              onChange={(e) => setPMethod(e.target.value)}
              placeholder="Pago Móvil, transferencia, etc."
            />
            {pSide === "sell" && (
              <Alert severity="warning">
                Al publicar, tu {pAsset} quedará en escrow hasta cerrar el trade.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPubOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={submitPublish}
            disabled={
              createOrder.isPending || !pAmount.trim() || !pPrice.trim()
            }
          >
            {createOrder.isPending ? "Publicando…" : "Publicar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
