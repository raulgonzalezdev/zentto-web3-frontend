import type { SvgIconComponent } from "@mui/icons-material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SendIcon from "@mui/icons-material/Send";
import MemoryIcon from "@mui/icons-material/Memory";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import GppGoodIcon from "@mui/icons-material/GppGood";
import HubIcon from "@mui/icons-material/Hub";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LinkIcon from "@mui/icons-material/Link";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import GroupIcon from "@mui/icons-material/Group";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import GavelIcon from "@mui/icons-material/Gavel";
import BalanceIcon from "@mui/icons-material/Balance";
import SavingsIcon from "@mui/icons-material/Savings";
import type { UserRole } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: SvgIconComponent;
  hint?: string;
  /** Si true, no se muestra en el menú (el código de la página se conserva). */
  hidden?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
  /** Si true, la sección entera se oculta del menú (código intacto). */
  hidden?: boolean;
}

/* ---------- Items reutilizables ---------- */

const P2P_ITEM: NavItem = {
  label: "P2P",
  href: "/p2p",
  icon: StorefrontIcon,
  hint: "Comprar y vender cripto entre usuarios (order book)",
};

const LEGAL_SECTION: NavSection = {
  title: "Legal",
  items: [
    {
      label: "Términos y Condiciones",
      href: "/legal/terminos",
      icon: GavelIcon,
      hint: "Condiciones de uso del servicio",
    },
    {
      label: "Privacidad",
      href: "/legal/privacidad",
      icon: GavelIcon,
      hint: "Política de privacidad y protección de datos",
    },
    {
      label: "Responsabilidad",
      href: "/legal/responsabilidad",
      icon: GavelIcon,
      hint: "Aviso de responsabilidad y riesgos cripto",
    },
  ],
};

/* ---------- Menú backoffice (admin / operador) ---------- */

const ADMIN_NAV: NavSection[] = [
  {
    title: "Operación",
    items: [
      {
        label: "Panel",
        href: "/",
        icon: DashboardIcon,
        hint: "Metricas de operacion de Zentto",
      },
      {
        label: "Usuarios",
        href: "/usuarios",
        icon: GroupIcon,
        hint: "Clientes, saldos, KYC y 2FA",
      },
      {
        label: "Transacciones",
        href: "/transacciones",
        icon: SwapHorizIcon,
        hint: "Todos los movimientos de Zentto",
      },
      {
        label: "KYC / Revisión",
        href: "/kyc",
        icon: VerifiedUserIcon,
        hint: "Verificaciones de identidad y decisiones",
      },
      P2P_ITEM,
      {
        label: "Disputas P2P",
        href: "/disputas",
        icon: BalanceIcon,
        hint: "Arbitraje de trades P2P en disputa",
      },
      {
        label: "Fees / Tesorería",
        href: "/fees",
        icon: SavingsIcon,
        hint: "Comisiones ganadas por la plataforma (consolidado)",
      },
    ],
  },
  {
    title: "Mi cuenta",
    items: [
      {
        label: "Cuenta / Saldo",
        href: "/cuenta",
        icon: AccountBalanceIcon,
        hint: "Saldo por asset, faucet y transferencias",
      },
      {
        label: "Pagos",
        href: "/pagos",
        icon: ReceiptLongIcon,
        hint: "Historial de movimientos",
      },
      {
        label: "Métodos de pago",
        href: "/metodos-pago",
        icon: CreditCardIcon,
        hint: "Pago Móvil y cuentas bancarias",
      },
      {
        label: "On-chain (EVM)",
        href: "/onchain",
        icon: LinkIcon,
        hint: "Red Sepolia real, saldos y transacciones",
      },
    ],
  },
  {
    // Minería / sandbox blockchain: ocultos del menú a pedido del producto.
    // El código de las páginas (/wallets, /minado, /explorer, etc.) se conserva
    // intacto; solo se apaga su visibilidad en el nav.
    title: "Sandbox (cadena didactica)",
    hidden: true,
    items: [
      {
        label: "Wallets",
        href: "/wallets",
        icon: AccountBalanceWalletIcon,
        hint: "Crear monederos y ver saldo (laboratorio)",
      },
      {
        label: "Enviar",
        href: "/enviar",
        icon: SendIcon,
        hint: "Firmar y enviar una transferencia (laboratorio)",
      },
      {
        label: "Minado",
        href: "/minado",
        icon: MemoryIcon,
        hint: "Crear bloques y ganar recompensa (laboratorio)",
      },
      {
        label: "Explorer",
        href: "/explorer",
        icon: TravelExploreIcon,
        hint: "Bloques y transacciones (laboratorio)",
      },
      {
        label: "Analitica",
        href: "/analytics",
        icon: HubIcon,
        hint: "Grafo de direcciones y hubs (laboratorio)",
      },
      {
        label: "AML / Cumplimiento",
        href: "/compliance",
        icon: GppGoodIcon,
        hint: "Screening de riesgo e informe IA (laboratorio)",
      },
    ],
  },
  {
    title: "Cuenta",
    items: [
      {
        label: "Ajustes",
        href: "/settings",
        icon: SettingsIcon,
        hint: "2FA y sesion",
      },
    ],
  },
  LEGAL_SECTION,
];

/* ---------- Menú personal (usuario de Zentto) ---------- */

const USER_NAV: NavSection[] = [
  {
    title: "Mi cuenta",
    items: [
      {
        label: "Mi cuenta",
        href: "/cuenta",
        icon: AccountBalanceIcon,
        hint: "Tu saldo, depósitos y retiros",
      },
      {
        label: "Pagos / Movimientos",
        href: "/pagos",
        icon: ReceiptLongIcon,
        hint: "Historial de tus movimientos",
      },
      P2P_ITEM,
      {
        label: "Verificación KYC",
        href: "/verificacion",
        icon: VerifiedUserIcon,
        hint: "Verifica tu identidad",
      },
      {
        label: "Métodos de pago",
        href: "/metodos-pago",
        icon: CreditCardIcon,
        hint: "Pago Móvil y cuentas bancarias",
      },
    ],
  },
  {
    title: "Cuenta",
    items: [
      {
        label: "Ajustes",
        href: "/settings",
        icon: SettingsIcon,
        hint: "2FA y sesion",
      },
    ],
  },
  LEGAL_SECTION,
];

/**
 * Devuelve las secciones de navegación según el rol del usuario.
 * `admin`/`operator` ven el backoffice de operación; `user` ve su banca personal.
 */
export function buildNavSections(role?: UserRole): NavSection[] {
  const all = role === "admin" || role === "operator" ? ADMIN_NAV : USER_NAV;
  // Filtra secciones e items marcados como `hidden` (p.ej. minería/sandbox),
  // sin alterar el código de las páginas correspondientes.
  return all
    .filter((s) => !s.hidden)
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.hidden) }))
    .filter((s) => s.items.length > 0);
}

/** Rutas exclusivas de backoffice (admin/operator). Un `user` no debe acceder. */
export const ADMIN_ROUTES = [
  "/",
  "/usuarios",
  "/transacciones",
  "/kyc",
  "/disputas",
  "/fees",
  "/onchain",
  "/wallets",
  "/enviar",
  "/minado",
  "/explorer",
  "/analytics",
  "/compliance",
];

/** True si la ruta requiere rol admin/operator. */
export function isAdminRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return ADMIN_ROUTES.some(
    (r) => r !== "/" && (pathname === r || pathname.startsWith(`${r}/`)),
  );
}

/** Compat: secciones por defecto (backoffice) para imports legacy. */
export const NAV_SECTIONS = ADMIN_NAV;
