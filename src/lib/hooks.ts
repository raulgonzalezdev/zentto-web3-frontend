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
  KycPending,
  KycStatusView,
  KycDecisionInput,
  DepositInfo,
  ChainDeposit,
  WithdrawInput,
  AdminStats,
  AdminUser,
  AdminKyc,
  AdminPayment,
  PaymentType,
  KycStatus,
  KycSubmitInput,
  P2pOrder,
  P2pOrderInput,
  P2pTrade,
  P2pSide,
  P2pAsset,
  PaymentMethod,
  PaymentMethodInput,
  AdminP2pDispute,
  AdminP2pMessage,
  P2pResolveInput,
  KycHandoffStart,
  AdminTreasury,
  AdminCustody,
  SweepResult,
  AdminOnchainActivity,
  AdminSetting,
  AdminSettingUpdate,
  AdminUserUpdate,
  AdminUserResetPassword,
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

/* ---------- KYC (cola de revisión del operador) ---------- */

/** Cola de verificaciones pendientes de revisión (operador). */
export function useKycPending() {
  return useQuery<KycPending[]>({
    queryKey: ["kyc", "pending"],
    queryFn: () => api.get<KycPending[]>(ENDPOINTS.kycPending),
    refetchInterval: 15_000,
  });
}

/** Aprueba o rechaza una verificación; invalida la cola al terminar. */
export function useKycDecision() {
  const qc = useQueryClient();
  return useMutation<
    KycStatusView,
    Error,
    { id: string } & KycDecisionInput
  >({
    mutationFn: ({ id, approve, reason }) =>
      api.post<KycStatusView>(ENDPOINTS.kycDecision(id), { approve, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kyc", "pending"] });
      qc.invalidateQueries({ queryKey: ["kyc", "status"] });
      qc.invalidateQueries({ queryKey: ["admin", "kyc"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

/* ---------- Admin / operador backoffice (todos los usuarios) ---------- */

/** Metricas de operacion del neobanco (GET /admin/stats). */
export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get<AdminStats>(ENDPOINTS.adminStats),
    refetchInterval: 30_000,
  });
}

/** Listado de usuarios con saldos (GET /admin/users). */
export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => api.get<AdminUser[]>(ENDPOINTS.adminUsers),
    refetchInterval: 30_000,
  });
}

/** Edita el nombre visible de un usuario (PATCH /admin/users/:id). */
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, { id: string } & AdminUserUpdate>({
    mutationFn: ({ id, ...body }) =>
      api.patch<AdminUser>(ENDPOINTS.adminUser(id), body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

/** Resetea la contraseña de un usuario (POST /admin/users/:id/reset-password). */
export function useResetUserPassword() {
  return useMutation<
    { ok: true } | void,
    Error,
    { id: string } & AdminUserResetPassword
  >({
    mutationFn: ({ id, ...body }) =>
      api.post<{ ok: true }>(ENDPOINTS.adminUserResetPassword(id), body),
  });
}

/** Verificaciones KYC de todos los usuarios, filtrables por estado. */
export function useAdminKyc(status?: KycStatus) {
  return useQuery<AdminKyc[]>({
    queryKey: ["admin", "kyc", status ?? "all"],
    queryFn: () => api.get<AdminKyc[]>(ENDPOINTS.adminKyc(status)),
    refetchInterval: 20_000,
  });
}

/** Movimientos de pago de todos los usuarios, filtrables por tipo. */
export function useAdminPayments(type?: PaymentType) {
  return useQuery<AdminPayment[]>({
    queryKey: ["admin", "payments", type ?? "all"],
    queryFn: () => api.get<AdminPayment[]>(ENDPOINTS.adminPayments(type)),
    refetchInterval: 20_000,
  });
}

/** Estado KYC propio del usuario operador. */
export function useKycStatus() {
  return useQuery<KycStatusView>({
    queryKey: ["kyc", "status"],
    queryFn: () => api.get<KycStatusView>(ENDPOINTS.kycStatus),
  });
}

/* ---------- Depósito / retiro on-chain (custodia) ---------- */

export function useDepositInfo() {
  return useQuery<DepositInfo>({
    queryKey: ["deposit", "address"],
    queryFn: () => api.get<DepositInfo>(ENDPOINTS.depositAddress),
  });
}

export function useDeposits() {
  return useQuery<ChainDeposit[]>({
    queryKey: ["deposits"],
    queryFn: () => api.get<ChainDeposit[]>(ENDPOINTS.deposits),
    refetchInterval: 20_000,
  });
}

/** Retiro on-chain: requiere TOTP + Idempotency-Key por intento. */
export function useWithdraw() {
  const invalidate = useInvalidateBanca();
  const qc = useQueryClient();
  return useMutation<Payment, Error, WithdrawInput>({
    mutationFn: (input) =>
      api.post<Payment>(ENDPOINTS.withdraw, input, { idempotencyKey: true }),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["deposits"] });
    },
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

/* ---------- KYC propio del usuario (envío de documentos) ---------- */

/** Envía/actualiza los datos de identidad del propio usuario para verificación. */
export function useKycSubmit() {
  const qc = useQueryClient();
  return useMutation<KycStatusView, Error, KycSubmitInput>({
    mutationFn: (input) => api.post<KycStatusView>(ENDPOINTS.kycSubmit, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc", "status"] }),
  });
}

/** Dispara la verificación de documentos (provider/MRZ) del propio usuario. */
export function useKycVerifyDocuments() {
  const qc = useQueryClient();
  return useMutation<KycStatusView, Error, KycSubmitInput | void>({
    mutationFn: (input) =>
      api.post<KycStatusView>(ENDPOINTS.kycVerifyDocuments, input ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc", "status"] }),
  });
}

/* ---------- KYC: handoff al móvil (QR) + captura de documentos ---------- */

/** Campos de captura: imágenes + metadatos para verify-documents / handoff/verify. */
export interface KycDocsInput {
  frontImage: Blob;
  backImage?: Blob | null;
  selfie?: Blob | null;
  fullName?: string;
  documentType?: string;
}

/** Arma el FormData con los nombres de campo que espera el backend. */
function buildKycForm(input: KycDocsInput, token?: string): FormData {
  const fd = new FormData();
  fd.append("front_image", input.frontImage, "front.jpg");
  if (input.backImage) fd.append("back_image", input.backImage, "back.jpg");
  if (input.selfie) fd.append("selfie", input.selfie, "selfie.jpg");
  if (input.fullName) fd.append("fullName", input.fullName);
  if (input.documentType) fd.append("documentType", input.documentType);
  if (token) fd.append("token", token);
  return fd;
}

/** Verificación de documentos del propio usuario subiendo imágenes (multipart). */
export function useKycVerifyDocumentsUpload() {
  const qc = useQueryClient();
  return useMutation<KycStatusView, Error, KycDocsInput>({
    mutationFn: (input) =>
      api.postForm<KycStatusView>(
        ENDPOINTS.kycVerifyDocuments,
        buildKycForm(input),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc", "status"] }),
  });
}

/** Emite un token corto (15 min) para continuar la verificación en el móvil. */
export function useKycHandoffStart() {
  return useMutation<KycHandoffStart, Error, void>({
    mutationFn: () => api.post<KycHandoffStart>(ENDPOINTS.kycHandoffStart),
  });
}

/**
 * Sube las imágenes desde el móvil (página pública /verificar) usando el token
 * del handoff. NO requiere sesión: se autentica con el `token` en el body.
 */
export function useKycHandoffVerify() {
  return useMutation<
    KycStatusView,
    Error,
    KycDocsInput & { token: string }
  >({
    mutationFn: ({ token, ...input }) =>
      api.postForm<KycStatusView>(
        ENDPOINTS.kycHandoffVerify,
        buildKycForm(input, token),
        { requireAuth: false },
      ),
  });
}

/**
 * Estado KYC con polling activo (para el desktop que espera al móvil).
 * Deja de pollear automáticamente al llegar a un estado terminal.
 */
export function useKycStatusPolling(active: boolean) {
  return useQuery<KycStatusView>({
    queryKey: ["kyc", "status"],
    queryFn: () => api.get<KycStatusView>(ENDPOINTS.kycStatus),
    enabled: active,
    refetchInterval: (q) => {
      if (!active) return false;
      const s = (q.state.data as KycStatusView | undefined)?.status;
      if (s === "approved" || s === "rejected" || s === "in_review") return false;
      return 3000;
    },
  });
}

/* ---------- Tesorería / fees consolidados (operador backoffice) ---------- */

/** Consolidado de fees ganados por la plataforma (GET /admin/treasury). */
export function useAdminTreasury() {
  return useQuery<AdminTreasury>({
    queryKey: ["admin", "treasury"],
    queryFn: () => api.get<AdminTreasury>(ENDPOINTS.adminTreasury),
    refetchInterval: 30_000,
  });
}

/* ---------- Parámetros / tarifas editables (operador backoffice) ---------- */

/** Lista de parámetros editables de la plataforma (GET /admin/settings). */
export function useAdminSettings() {
  return useQuery<AdminSetting[]>({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<AdminSetting[]>(ENDPOINTS.adminSettings),
  });
}

/**
 * Actualiza un parámetro (PUT /admin/settings) y refresca la lista con la
 * respuesta del backend (devuelve la lista completa ya actualizada).
 */
export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation<AdminSetting[], Error, AdminSettingUpdate>({
    mutationFn: (input) =>
      api.put<AdminSetting[]>(ENDPOINTS.adminSettings, input),
    onSuccess: (list) => {
      qc.setQueryData(["admin", "settings"], list);
      // las tarifas viven también en /admin/treasury → invalidar
      qc.invalidateQueries({ queryKey: ["admin", "treasury"] });
    },
  });
}

/* ---------- Custodia: hot wallet on-chain por red (operador backoffice) ---------- */

/** Saldo on-chain REAL del hot wallet por red (gas + stablecoins). */
export function useAdminCustody() {
  return useQuery<AdminCustody>({
    queryKey: ["admin", "custody"],
    queryFn: () => api.get<AdminCustody>(ENDPOINTS.adminCustody),
    refetchInterval: 30_000,
  });
}

/** Dispara el barrido de depósitos → hot wallet; refresca custodia y tesorería. */
export function useAdminSweep() {
  const qc = useQueryClient();
  return useMutation<SweepResult, Error, void>({
    mutationFn: () =>
      api.post<SweepResult>(ENDPOINTS.adminSweep, undefined, {
        idempotencyKey: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "custody"] });
      qc.invalidateQueries({ queryKey: ["admin", "treasury"] });
    },
  });
}

/* ---------- Actividad on-chain real (operador backoffice) ---------- */

/** Traza on-chain real: depósitos + retiros con txHash y link al explorer. */
export function useAdminOnchainActivity() {
  return useQuery<AdminOnchainActivity>({
    queryKey: ["admin", "onchain-activity"],
    queryFn: () =>
      api.get<AdminOnchainActivity>(ENDPOINTS.adminOnchainActivity),
    refetchInterval: 30_000,
  });
}

/* ---------- P2P (order book entre usuarios) ---------- */

/** Order book filtrable por lado y asset. */
export function useP2pOrders(side?: P2pSide, asset?: P2pAsset) {
  return useQuery<P2pOrder[]>({
    queryKey: ["p2p", "orders", side ?? "all", asset ?? "all"],
    queryFn: () => api.get<P2pOrder[]>(ENDPOINTS.p2pOrders(side, asset)),
    refetchInterval: 12_000,
  });
}

/** Órdenes propias publicadas por el usuario. */
export function useP2pMyOrders() {
  return useQuery<P2pOrder[]>({
    queryKey: ["p2p", "orders", "mine"],
    queryFn: () => api.get<P2pOrder[]>(ENDPOINTS.p2pOrdersMine),
    refetchInterval: 12_000,
  });
}

/** Trades del usuario (como comprador o vendedor). */
export function useP2pTrades() {
  return useQuery<P2pTrade[]>({
    queryKey: ["p2p", "trades"],
    queryFn: () => api.get<P2pTrade[]>(ENDPOINTS.p2pTrades),
    refetchInterval: 10_000,
  });
}

/** Invalida todas las vistas P2P + saldo (escrow afecta el held). */
function useInvalidateP2p() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["p2p"] });
    qc.invalidateQueries({ queryKey: ["accounts", "balance"] });
  };
}

/** Publica una oferta (vender escrowa la cripto). */
export function useP2pCreateOrder() {
  const invalidate = useInvalidateP2p();
  return useMutation<P2pOrder, Error, P2pOrderInput>({
    mutationFn: (input) =>
      api.post<P2pOrder>(ENDPOINTS.p2pOrders(), input, { idempotencyKey: true }),
    onSuccess: invalidate,
  });
}

/** Toma una oferta del order book (crea un trade). */
export function useP2pTakeOrder() {
  const invalidate = useInvalidateP2p();
  return useMutation<P2pTrade, Error, { id: string }>({
    mutationFn: ({ id }) =>
      api.post<P2pTrade>(ENDPOINTS.p2pOrderTake(id), undefined, {
        idempotencyKey: true,
      }),
    onSuccess: invalidate,
  });
}

/** Cancela una oferta propia. */
export function useP2pCancelOrder() {
  const invalidate = useInvalidateP2p();
  return useMutation<P2pOrder, Error, { id: string }>({
    mutationFn: ({ id }) => api.post<P2pOrder>(ENDPOINTS.p2pOrderCancel(id)),
    onSuccess: invalidate,
  });
}

/** Vendedor confirma haber recibido el pago → libera el cripto. */
export function useP2pConfirmTrade() {
  const invalidate = useInvalidateP2p();
  return useMutation<P2pTrade, Error, { id: string }>({
    mutationFn: ({ id }) => api.post<P2pTrade>(ENDPOINTS.p2pTradeConfirm(id)),
    onSuccess: invalidate,
  });
}

/** Cancela un trade en curso. */
export function useP2pCancelTrade() {
  const invalidate = useInvalidateP2p();
  return useMutation<P2pTrade, Error, { id: string }>({
    mutationFn: ({ id }) => api.post<P2pTrade>(ENDPOINTS.p2pTradeCancel(id)),
    onSuccess: invalidate,
  });
}

/* ---------- P2P — arbitraje de disputas (operador backoffice) ---------- */

/** Cola de trades en disputa (GET /admin/p2p/disputes). */
export function useAdminP2pDisputes() {
  return useQuery<AdminP2pDispute[]>({
    queryKey: ["admin", "p2p", "disputes"],
    queryFn: () => api.get<AdminP2pDispute[]>(ENDPOINTS.adminP2pDisputes),
    refetchInterval: 15_000,
  });
}

/** Detalle de un trade (GET /admin/p2p/trades/:id). */
export function useAdminP2pTrade(id: string | null) {
  return useQuery<AdminP2pDispute>({
    queryKey: ["admin", "p2p", "trade", id],
    queryFn: () => api.get<AdminP2pDispute>(ENDPOINTS.adminP2pTrade(id as string)),
    enabled: !!id,
  });
}

/** Chat completo de un trade, con evidencias (GET /admin/p2p/trades/:id/messages). */
export function useAdminP2pTradeMessages(id: string | null) {
  return useQuery<AdminP2pMessage[]>({
    queryKey: ["admin", "p2p", "trade", id, "messages"],
    queryFn: () =>
      api.get<AdminP2pMessage[]>(ENDPOINTS.adminP2pTradeMessages(id as string)),
    enabled: !!id,
  });
}

/** Resuelve una disputa: release (al comprador) o refund (al vendedor). */
export function useAdminP2pResolve() {
  const qc = useQueryClient();
  return useMutation<
    { ok: true },
    Error,
    { id: string } & P2pResolveInput
  >({
    mutationFn: ({ id, decision }) =>
      api.post<{ ok: true }>(ENDPOINTS.adminP2pTradeResolve(id), { decision }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "p2p", "disputes"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

/* ---------- Métodos de pago del perfil ---------- */

export function usePaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: ["payment-methods"],
    queryFn: () => api.get<PaymentMethod[]>(ENDPOINTS.paymentMethods),
  });
}

export function useAddPaymentMethod() {
  const qc = useQueryClient();
  return useMutation<PaymentMethod, Error, PaymentMethodInput>({
    mutationFn: (input) =>
      api.post<PaymentMethod>(ENDPOINTS.paymentMethods, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => api.del<void>(ENDPOINTS.paymentMethod(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
}
