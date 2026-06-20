"use client";

// Hooks de datos (react-query) contra los endpoints Web3 del backend.

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { api } from "./api";
import { ENDPOINTS } from "./endpoints";
import type {
  Chain,
  ChainValidation,
  Block,
  Transaction,
  WalletCreated,
  WalletBalance,
  SignedPayload,
  MiningJobCreated,
  MiningJob,
  ComplianceAssessment,
  ComplianceReport,
  ComplianceStatus,
  AnalyticsGraph,
  Hub,
} from "./types";

/* ---------- Chain / Explorer ---------- */

export function useChain(opts?: Partial<UseQueryOptions<Chain>>) {
  return useQuery<Chain>({
    queryKey: ["chain"],
    queryFn: () => api.get<Chain>(ENDPOINTS.chain),
    refetchInterval: 10_000,
    ...opts,
  });
}

export function useChainValidation(enabled = false) {
  return useQuery<ChainValidation>({
    queryKey: ["chain", "validate"],
    queryFn: () => api.get<ChainValidation>(ENDPOINTS.chainValidate),
    enabled,
  });
}

export function usePending() {
  return useQuery<Transaction[]>({
    queryKey: ["transactions", "pending"],
    queryFn: () => api.get<Transaction[]>(ENDPOINTS.pending),
    refetchInterval: 8_000,
  });
}

export function useBlock(index: number | null) {
  return useQuery<Block>({
    queryKey: ["block", index],
    queryFn: () => api.get<Block>(ENDPOINTS.block(index as number)),
    enabled: index !== null,
  });
}

/* ---------- Wallets ---------- */

export function useCreateWallet() {
  return useMutation<WalletCreated>({
    mutationFn: () => api.post<WalletCreated>(ENDPOINTS.walletCreate),
  });
}

export function useBalance(address: string | null) {
  return useQuery<WalletBalance>({
    queryKey: ["balance", address],
    queryFn: () => api.get<WalletBalance>(ENDPOINTS.walletBalance(address as string)),
    enabled: !!address,
    refetchInterval: 12_000,
  });
}

export interface SignInput {
  privateKey: string;
  toAddress: string;
  amount: number;
  fee: number;
}

export function useSignTx() {
  return useMutation<SignedPayload, Error, SignInput>({
    mutationFn: (input) => api.post<SignedPayload>(ENDPOINTS.walletSign, input),
  });
}

export function useSendTx() {
  return useMutation<Transaction, Error, SignedPayload>({
    mutationFn: (payload) => api.post<Transaction>(ENDPOINTS.txCreate, payload),
  });
}

/* ---------- Mining ---------- */

export function useStartMining() {
  return useMutation<MiningJobCreated, Error, { minerAddress: string }>({
    mutationFn: (vars) => api.post<MiningJobCreated>(ENDPOINTS.mining, vars),
  });
}

export function useMiningJob(jobId: string | null, active = true) {
  return useQuery<MiningJob>({
    queryKey: ["mining", "job", jobId],
    queryFn: () => api.get<MiningJob>(ENDPOINTS.miningJob(jobId as string)),
    enabled: !!jobId && active,
    refetchInterval: (q) => {
      const state = (q.state.data as MiningJob | undefined)?.state;
      if (state === "completed" || state === "failed") return false;
      return 1500;
    },
  });
}

/* ---------- Compliance ---------- */

export function useComplianceStatus() {
  return useQuery<ComplianceStatus>({
    queryKey: ["compliance", "status"],
    queryFn: () => api.get<ComplianceStatus>(ENDPOINTS.complianceStatus),
  });
}

export function useScreen() {
  return useMutation<ComplianceAssessment, Error, { address: string }>({
    mutationFn: (vars) =>
      api.post<ComplianceAssessment>(ENDPOINTS.complianceScreen, vars),
  });
}

export function useReport() {
  return useMutation<ComplianceReport, Error, { address: string }>({
    mutationFn: (vars) =>
      api.post<ComplianceReport>(ENDPOINTS.complianceReport, vars),
  });
}

/* ---------- Analytics ---------- */

export function useGraph() {
  return useQuery<AnalyticsGraph>({
    queryKey: ["analytics", "graph"],
    queryFn: () => api.get<AnalyticsGraph>(ENDPOINTS.graph),
  });
}

export function useHubs(minDegree = 5) {
  return useQuery<Hub[]>({
    queryKey: ["analytics", "hubs", minDegree],
    queryFn: () => api.get<Hub[]>(ENDPOINTS.hubs(minDegree)),
  });
}
