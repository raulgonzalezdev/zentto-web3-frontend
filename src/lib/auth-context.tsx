"use client";

// Cliente de autenticacion propio (stand-in de @zentto/auth-client / next-auth).
// Usa @tanstack/react-query contra /api/auth del backend Web3.
// Tokens viven en cookies httpOnly del backend; aqui solo manejamos el objeto `user`.

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api";
import { ENDPOINTS } from "./endpoints";
import type { User, LoginResult, TwoFactorSetup } from "./types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetch: () => void;
  login: (email: string, password: string) => Promise<LoginResult>;
  loginWith2fa: (mfaToken: string, code: string) => Promise<User>;
  register: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<User>;
  logout: () => Promise<void>;
  setup2fa: () => Promise<TwoFactorSetup>;
  enable2fa: (code: string) => Promise<void>;
  disable2fa: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ME_KEY = ["auth", "me"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const meQuery = useQuery<User | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        const data = await api.get<{ user: User }>(ENDPOINTS.me);
        return data?.user ?? null;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    retry: false,
  });

  const setUser = (user: User | null) => qc.setQueryData(ME_KEY, user);

  const loginMut = useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      api.post<LoginResult>(ENDPOINTS.login, vars),
  });

  const login2faMut = useMutation({
    mutationFn: (vars: { mfaToken: string; code: string }) =>
      api.post<{ user: User }>(ENDPOINTS.login2fa, vars),
  });

  const registerMut = useMutation({
    mutationFn: (vars: {
      email: string;
      password: string;
      displayName?: string;
    }) => api.post<{ user: User }>(ENDPOINTS.register, vars),
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      isLoading: meQuery.isLoading,
      isAuthenticated: !!meQuery.data,
      refetch: () => void meQuery.refetch(),

      login: async (email, password) => {
        const result = await loginMut.mutateAsync({ email, password });
        if (!result.mfaRequired) setUser(result.user);
        return result;
      },

      loginWith2fa: async (mfaToken, code) => {
        const { user } = await login2faMut.mutateAsync({ mfaToken, code });
        setUser(user);
        return user;
      },

      register: async (email, password, displayName) => {
        const { user } = await registerMut.mutateAsync({
          email,
          password,
          displayName,
        });
        setUser(user);
        return user;
      },

      logout: async () => {
        try {
          await api.post(ENDPOINTS.logout);
        } finally {
          setUser(null);
          qc.clear();
        }
      },

      setup2fa: () => api.post<TwoFactorSetup>(ENDPOINTS.twoFaSetup),

      enable2fa: async (code) => {
        await api.post(ENDPOINTS.twoFaEnable, { code });
        await meQuery.refetch();
      },

      disable2fa: async (code) => {
        await api.post(ENDPOINTS.twoFaDisable, { code });
        await meQuery.refetch();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meQuery.data, meQuery.isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
