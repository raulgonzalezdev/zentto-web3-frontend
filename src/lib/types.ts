// Tipos del dominio Zentto Web3 (alineados al API_CONTRACT.md del backend).

export interface User {
  id: string;
  email: string;
  displayName?: string | null;
  totpEnabled: boolean;
}

export interface LoginOk {
  mfaRequired: false;
  user: User;
}
export interface LoginMfa {
  mfaRequired: true;
  mfaToken: string;
}
export type LoginResult = LoginOk | LoginMfa;

export interface TwoFactorSetup {
  otpauthUrl: string;
  qrDataUrl: string; // data:image/png;base64,... -> usable directo en <img src>
  secret: string;
}

export interface Transaction {
  id: string;
  fromAddress: string | null;
  toAddress: string;
  amount: number;
  fee: number;
  timestamp: number | string;
  signature?: string;
  status?: "pending" | "confirmed" | string;
  [k: string]: unknown;
}

export interface Block {
  index: number;
  hash: string;
  previousHash: string;
  timestamp: number | string;
  nonce: number;
  difficulty?: number;
  transactions: Transaction[];
  [k: string]: unknown;
}

export interface Chain {
  height: number;
  blocks: Block[];
}

export interface ChainValidation {
  valid: boolean;
  height: number;
  errors: string[];
}

export interface WalletCreated {
  address: string;
  publicKey: string;
  privateKey: string; // SOLO se devuelve una vez
  warning?: string;
}

export interface WalletBalance {
  address: string;
  confirmed: number;
  available: number;
}

export interface SignedPayload {
  fromAddress: string;
  toAddress: string;
  amount: number;
  fee: number;
  timestamp: number;
  signature: string;
}

export interface MiningJobCreated {
  jobId: string;
  status: "queued" | string;
}

export interface MiningJob {
  jobId: string;
  state: "queued" | "active" | "completed" | "failed" | string;
  progress?: number;
  result?: unknown;
  failedReason?: string;
  [k: string]: unknown;
}

export type RiskSeverity = "low" | "medium" | "high" | "critical" | string;

export interface ComplianceAssessment {
  address: string;
  risk?: RiskSeverity;
  riskScore?: number;
  flags?: string[];
  [k: string]: unknown;
}

export interface ComplianceReport {
  assessment: ComplianceAssessment;
  report: {
    narrative?: string; // markdown
    [k: string]: unknown;
  } & Record<string, unknown>;
}

export interface ComplianceStatus {
  aiEnabled: boolean;
}

export interface GraphNode {
  id: string;
  label?: string;
  degree?: number;
  [k: string]: unknown;
}
export interface GraphEdge {
  from: string;
  to: string;
  amount?: number;
  [k: string]: unknown;
}
export interface AnalyticsGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Hub {
  address: string;
  degree: number;
  [k: string]: unknown;
}

/* ---------- Banca (neobanco custodial) ---------- */

/** Saldo de un asset del usuario. `amount` viene como string decimal. */
export interface AccountBalance {
  asset: string;
  balance: string;
  held: string;
  available: string;
  [k: string]: unknown;
}

export type PaymentType =
  | "transfer"
  | "credit"
  | "debit"
  | "deposit"
  | "withdrawal"
  | string;

export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "reversed"
  | string;

/** Movimiento del historial de pagos. */
export interface Payment {
  id: string;
  type: PaymentType;
  asset: string;
  amount: string;
  status: PaymentStatus;
  counterparty?: string | null;
  createdAt: number | string;
  [k: string]: unknown;
}

export interface TransferInput {
  toEmail: string;
  asset: string;
  amount: string;
}

export interface CreditInput {
  asset: string;
  amount: string;
}

/* ---------- KYC (cola de revisión del operador) ---------- */

export type KycStatus =
  | "not_started"
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "needs_more_info"
  | string;

/** Verificación en la cola del operador (GET /kyc/pending). */
export interface KycPending {
  id: string;
  userId: string;
  status: KycStatus;
  fullName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  nationality: string | null;
  mrzValid: boolean;
  amlMatch: boolean;
  amlHits?: unknown;
  provider: string;
  createdAt: number | string;
  [k: string]: unknown;
}

/** Estado KYC propio del usuario (GET /kyc/status). */
export interface KycStatusView {
  id?: string;
  status: KycStatus;
  provider?: string;
  mrzValid?: boolean;
  amlMatch?: boolean;
  redirectUrl?: string | null;
  decisionReason?: string | null;
}

export interface KycDecisionInput {
  approve: boolean;
  reason?: string;
}

/* ---------- Depósito / retiro on-chain (custodia) ---------- */

/** Dirección de depósito on-chain del usuario (GET /accounts/deposit-address). */
export interface DepositInfo {
  network: string;
  chainName: string;
  address: string;
  asset: string;
  token: string;
  explorerUrl: string;
  note: string;
  [k: string]: unknown;
}

/** Depósito on-chain detectado (GET /accounts/deposits). */
export interface ChainDeposit {
  id: string;
  network: string;
  txHash: string;
  asset: string;
  toAddress: string;
  amount: string;
  blockNumber: string;
  paymentId?: string | null;
  createdAt: number | string;
  [k: string]: unknown;
}

export interface WithdrawInput {
  asset: string;
  amount: string;
  toAddress: string;
  totpCode: string;
}

/* ---------- Admin / operador backoffice ---------- */

/** Metricas de operacion del neobanco (GET /admin/stats). */
export interface AdminStats {
  users: number;
  kyc: {
    approved: number;
    pending: number;
    rejected: number;
    total: number;
  };
  payments: {
    total: number;
    deposits: number;
    withdrawals: number;
    transfers: number;
    withdrawalsProcessing: number;
  };
}

/** Usuario del neobanco con sus saldos (GET /admin/users). */
export interface AdminUser {
  id: string;
  email: string;
  displayName?: string | null;
  totpEnabled: boolean;
  kycStatus: KycStatus;
  balances: AccountBalance[];
  createdAt: number | string;
  [k: string]: unknown;
}

/** Verificacion KYC de cualquier usuario (GET /admin/kyc). */
export interface AdminKyc {
  id: string;
  userId: string;
  email: string;
  status: KycStatus;
  fullName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  nationality: string | null;
  mrzValid: boolean;
  amlMatch: boolean;
  amlHits?: unknown;
  provider: string;
  decisionReason?: string | null;
  createdAt: number | string;
  [k: string]: unknown;
}

/** Movimiento de pago de cualquier usuario (GET /admin/payments). */
export interface AdminPayment {
  id: string;
  userId: string;
  email: string;
  type: PaymentType;
  asset: string;
  amount: string;
  status: PaymentStatus;
  counterparty?: string | null;
  failureReason?: string | null;
  createdAt: number | string;
  [k: string]: unknown;
}

/* ---------- On-chain (EVM real — Sepolia) ---------- */

export interface EvmInfo {
  network?: string;
  chainId?: number | string;
  blockNumber?: number | string;
  explorer?: string;
  [k: string]: unknown;
}

export interface EvmAddressBalance {
  address: string;
  native?: string; // ETH
  usdc?: string;
  [k: string]: unknown;
}

export interface EvmTx {
  hash: string;
  status?: string;
  blockNumber?: number | string | null;
  from?: string;
  to?: string;
  value?: string;
  [k: string]: unknown;
}
