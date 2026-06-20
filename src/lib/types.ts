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
