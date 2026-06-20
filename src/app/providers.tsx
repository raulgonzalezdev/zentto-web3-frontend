"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/theme";
import { AuthProvider } from "@/lib/auth-context";
import { WalletStoreProvider } from "@/lib/wallet-store";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme} defaultMode="dark">
        <CssBaseline enableColorScheme />
        <AuthProvider>
          <WalletStoreProvider>{children}</WalletStoreProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
