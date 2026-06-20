"use client";

/**
 * AppShell — STAND-IN TEMPORAL de `@zentto/vertical-layout`.
 *
 * Layout estilo Zentto: topbar (marca + usuario/logout) + sidebar con secciones
 * colapsables. Responsive: en movil el sidebar es un Drawer temporal.
 * Cuando el token npm privado este disponible, se puede migrar a
 * `@zentto/vertical-layout` manteniendo la composicion de paginas.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Collapse,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
  Chip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import HexagonIcon from "@mui/icons-material/Hexagon";
import { NAV_SECTIONS } from "./nav";
import { useAuth } from "@/lib/auth-context";

const DRAWER_WIDTH = 268;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_SECTIONS.map((s) => [s.title, true])),
  );

  return (
    <Box sx={{ overflowY: "auto", height: "100%" }}>
      <Toolbar sx={{ gap: 1 }}>
        <HexagonIcon color="primary" />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1 }}>
            Zentto Web3
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Blockchain didactica
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List dense sx={{ px: 1 }}>
        {NAV_SECTIONS.map((section) => (
          <React.Fragment key={section.title}>
            <ListSubheader
              component="div"
              onClick={() =>
                setOpen((o) => ({ ...o, [section.title]: !o[section.title] }))
              }
              sx={{
                bgcolor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 11,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: "text.secondary",
                lineHeight: "32px",
              }}
            >
              {section.title}
              {open[section.title] ? (
                <ExpandLess fontSize="small" />
              ) : (
                <ExpandMore fontSize="small" />
              )}
            </ListSubheader>
            <Collapse in={open[section.title]} timeout="auto" unmountOnExit>
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Tooltip
                    key={item.href}
                    title={item.hint ?? ""}
                    placement="right"
                    arrow
                  >
                    <ListItemButton
                      component={Link}
                      href={item.href}
                      selected={active}
                      onClick={onNavigate}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        "&.Mui-selected": {
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          "&:hover": { bgcolor: "primary.dark" },
                          "& .MuiListItemIcon-root": {
                            color: "primary.contrastText",
                          },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 38 }}>
                        <Icon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                      />
                    </ListItemButton>
                  </Tooltip>
                );
              })}
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    setAnchor(null);
    await logout();
    router.replace("/login");
  };

  const initials =
    (user?.displayName || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <MenuIcon />
            </IconButton>
          )}
          <HexagonIcon color="primary" sx={{ display: { md: "none" } }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>
            Zentto Web3
          </Typography>
          <Chip
            size="small"
            color="secondary"
            variant="outlined"
            label="DEMO / Testnet"
            sx={{ mr: 1, display: { xs: "none", sm: "inline-flex" } }}
          />
          <Tooltip title="Cuenta">
            <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small">
              <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main" }}>
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchor}
            open={!!anchor}
            onClose={() => setAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem disabled sx={{ opacity: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {user?.displayName || "Sin nombre"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem
              component={Link}
              href="/settings"
              onClick={() => setAnchor(null)}
            >
              Ajustes y 2FA
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Cerrar sesion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar permanente (desktop) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: "background.paper",
            borderRight: 1,
            borderColor: "divider",
          },
        }}
        open
      >
        <SidebarContent />
      </Drawer>

      {/* Sidebar temporal (movil) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: "background.paper",
          },
        }}
      >
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minWidth: 0,
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1280, mx: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default AppShell;
