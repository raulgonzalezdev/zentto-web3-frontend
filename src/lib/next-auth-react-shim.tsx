"use client";

/**
 * Shim de `next-auth/react`.
 *
 * `@zentto/vertical-layout` importa `useSession` y `signOut` de `next-auth/react`
 * a nivel de modulo. Esta app NO usa next-auth (la auth corre contra el backend
 * Web3 propio via `@/lib/auth-context`), y el task prohibe instalar next-auth.
 *
 * Se alias-ea `next-auth/react` -> este archivo en `next.config.mjs` para que el
 * import del paquete resuelva sin traer next-auth. Como al layout le pasamos
 * `userName` y `onLogout` explicitos, estas funciones nunca controlan la sesion
 * real; solo evitan que el import reviente.
 */

import * as React from "react";

export type Session = {
  user?: { name?: string | null; email?: string | null; image?: string | null };
  expires?: string;
} | null;

export type SessionContextValue = {
  data: Session;
  status: "authenticated" | "unauthenticated" | "loading";
  update: () => Promise<Session>;
};

const noop = async (): Promise<Session> => null;

export function useSession(): SessionContextValue {
  // Sesion neutra: el layout recibe userName/onLogout por props, asi que esto
  // nunca se usa para renderizar usuario ni para cerrar sesion.
  return { data: null, status: "unauthenticated", update: noop };
}

export function signOut(_options?: { callbackUrl?: string }): Promise<undefined> {
  // No-op: el cierre de sesion real lo maneja `onLogout` del layout.
  return Promise.resolve(undefined);
}

export function signIn(): Promise<undefined> {
  return Promise.resolve(undefined);
}

export function getSession(): Promise<Session> {
  return Promise.resolve(null);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default { useSession, signOut, signIn, getSession, SessionProvider };
