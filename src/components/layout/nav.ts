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

export interface NavItem {
  label: string;
  href: string;
  icon: SvgIconComponent;
  hint?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Banca",
    items: [
      {
        label: "Panel",
        href: "/",
        icon: DashboardIcon,
        hint: "Metricas de operacion del neobanco",
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
        hint: "Todos los movimientos del neobanco",
      },
      {
        label: "KYC / Revisión",
        href: "/kyc",
        icon: VerifiedUserIcon,
        hint: "Verificaciones de identidad y decisiones",
      },
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
        label: "On-chain (EVM)",
        href: "/onchain",
        icon: LinkIcon,
        hint: "Red Sepolia real, saldos y transacciones",
      },
    ],
  },
  {
    title: "Sandbox (cadena didactica)",
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
];
