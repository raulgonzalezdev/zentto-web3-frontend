import type { SvgIconComponent } from "@mui/icons-material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SendIcon from "@mui/icons-material/Send";
import MemoryIcon from "@mui/icons-material/Memory";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import GppGoodIcon from "@mui/icons-material/GppGood";
import HubIcon from "@mui/icons-material/Hub";
import SettingsIcon from "@mui/icons-material/Settings";

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
    title: "General",
    items: [
      {
        label: "Panel",
        href: "/",
        icon: DashboardIcon,
        hint: "Estado de la cadena y accesos rapidos",
      },
    ],
  },
  {
    title: "Mis fondos",
    items: [
      {
        label: "Wallets",
        href: "/wallets",
        icon: AccountBalanceWalletIcon,
        hint: "Crear monederos y ver saldo",
      },
      {
        label: "Enviar",
        href: "/enviar",
        icon: SendIcon,
        hint: "Firmar y enviar una transferencia",
      },
      {
        label: "Minado",
        href: "/minado",
        icon: MemoryIcon,
        hint: "Crear bloques y ganar recompensa",
      },
    ],
  },
  {
    title: "Red",
    items: [
      {
        label: "Explorer",
        href: "/explorer",
        icon: TravelExploreIcon,
        hint: "Bloques y transacciones",
      },
      {
        label: "Analitica",
        href: "/analytics",
        icon: HubIcon,
        hint: "Grafo de direcciones y hubs",
      },
    ],
  },
  {
    title: "Cumplimiento",
    items: [
      {
        label: "AML / Cumplimiento",
        href: "/compliance",
        icon: GppGoodIcon,
        hint: "Screening de riesgo e informe IA",
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
