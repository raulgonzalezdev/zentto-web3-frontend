"use client";

// Almacen EFIMERO de wallets creadas en esta sesion.
//
// SEGURIDAD: la privateKey la devuelve el backend UNA sola vez y no se recupera.
// Se guarda EXCLUSIVAMENTE en memoria React (este store). NUNCA en localStorage,
// sessionStorage, cookies ni se envia a ningun lado salvo a /wallets/sign.
// Al recargar la pagina se pierde — es intencional.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { WalletCreated } from "./types";

export interface StoredWallet {
  address: string;
  publicKey: string;
  privateKey: string;
  createdAt: number;
}

interface WalletStoreValue {
  wallets: StoredWallet[];
  add: (w: WalletCreated) => void;
  remove: (address: string) => void;
  get: (address: string) => StoredWallet | undefined;
}

const WalletStoreContext = createContext<WalletStoreValue | null>(null);

export function WalletStoreProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<StoredWallet[]>([]);

  const add = useCallback((w: WalletCreated) => {
    setWallets((prev) => {
      if (prev.some((x) => x.address === w.address)) return prev;
      return [
        {
          address: w.address,
          publicKey: w.publicKey,
          privateKey: w.privateKey,
          createdAt: Date.now(),
        },
        ...prev,
      ];
    });
  }, []);

  const remove = useCallback((address: string) => {
    setWallets((prev) => prev.filter((w) => w.address !== address));
  }, []);

  const get = useCallback(
    (address: string) => wallets.find((w) => w.address === address),
    [wallets],
  );

  return (
    <WalletStoreContext.Provider value={{ wallets, add, remove, get }}>
      {children}
    </WalletStoreContext.Provider>
  );
}

export function useWalletStore(): WalletStoreValue {
  const ctx = useContext(WalletStoreContext);
  if (!ctx)
    throw new Error("useWalletStore debe usarse dentro de <WalletStoreProvider>");
  return ctx;
}
