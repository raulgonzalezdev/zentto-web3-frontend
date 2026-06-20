"use client";

// Hooks de datos (react-query) contra los endpoints Web3 del backend.

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { api } from "./api";
import { ENDPOINTS } from "./endpoints";
import type {
  AccountBalance,
  Payment,
  TransferInput,
  CreditInput,
  EvmInfo,
  EvmAddressBalance,
  EvmTx,
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

/* ---------- Banca (neobanco custodial) ---------- */

export function useAccountBalance() {
  return useQuery<AccountBalance[]>({
    queryKey: ["accounts", "balance"],
    queryFn: () => api.get<AccountBalance[]>(ENDPOINTS.accountsBalance),
    refetchInterval: 15_000,
  });
}

export function usePayments() {
  return useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: () => api.get<Payment[]>(ENDPOINTS.payments),
    refetchInterval: 15_000,
  });
}

export function usePayment(id: string | null) {
  return useQuery<Payment>({
    queryKey: ["payment", id],
    queryFn: () => api.get<Payment>(ENDPOINTS.payment(id as string)),
    enabled: !!id,
  });
}

/** Invalida saldo + historial tras una operacion bancaria. */
function useInvalidateBanca() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["accounts", "balance"] });
    qc.invalidateQueries({ queryKey: ["payments"] });
  };
}

export function useTransfer() {
  const invalidate = useInvalidateBanca();
  return useMutation<Payment, Error, TransferInput>({
    // Idempotency-Key generada por intento (uuid) en el cliente API.
    mutationFn: (input) =>
      api.post<Payment>(ENDPOINTS.paymentTransfer, input, {
        idempotencyKey: true,
      }),
    onSuccess: invalidate,
  });
}

export function useCredit() {
  const invalidate = useInvalidateBanca();
  return useMutation<Payment, Error, CreditInput>({
    mutationFn: (input) =>
      api.post<Payment>(ENDPOINTS.paymentCredit, input, {
        idempotencyKey: true,
      }),
    onSuccess: invalidate,
  });
}

/* ---------- On-chain (EVM real — Sepolia) ---------- */

export function useEvmInfo() {
  return useQuery<EvmInfo>({
    queryKey: ["evm", "info"],
    queryFn: () => api.get<EvmInfo>(ENDPOINTS.evmInfo),
    refetchInterval: 15_000,
  });
}

export function useEvmAddress(address: string | null) {
  return useQuery<EvmAddressBalance>({
    queryKey: ["evm", "address", address],
    queryFn: () => api.get<EvmAddressBalance>(ENDPOINTS.evmAddress(address as string)),
    enabled: !!address,
  });
}

export function useEvmTx(hash: string | null) {
  return useQuery<EvmTx>({
    queryKey: ["evm", "tx", hash],
    queryFn: () => api.get<EvmTx>(ENDPOINTS.evmTx(hash as string)),
    enabled: !!hash,
  });
}
