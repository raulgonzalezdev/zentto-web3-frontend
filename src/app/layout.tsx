import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Zentto Web3",
  description:
    "Blockchain didactica — wallets, minado, explorer, cumplimiento AML y analitica de grafo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1020",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body style={{ margin: 0 }}>
        {/* Fija la clase de esquema (light/dark) antes de la hidratación para
            evitar parpadeo y mismatch. Debe coincidir con colorSchemeSelector. */}
        <InitColorSchemeScript attribute="class" defaultMode="dark" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
