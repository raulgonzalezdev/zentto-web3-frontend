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
