// Tipos del dominio Zentto Web3 (alineados al API_CONTRACT.md del backend).

/** Rol del usuario en el neobanco. Define qué menú/secciones ve. */
export type UserRole = "user" | "operator" | "admin";

export interface User {
  id: string;
  email: string;
  displayName?: string | null;
  totpEnabled: boolean;
  /** Rol entregado por GET /auth/me. Default 'user' si el backend no lo manda. */
  role?: UserRole;
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

/* ---------- P2P (order book entre usuarios) ---------- */

export type P2pSide = "buy" | "sell";
export type P2pAsset = "USDT" | "USDC" | string;

export type P2pOrderStatus =
  | "open"
  | "partial"
  | "filled"
  | "cancelled"
  | string;

/** Oferta del order book (GET /p2p/orders). */
export interface P2pOrder {
  id: string;
  side: P2pSide;
  asset: P2pAsset;
  amount: string;
  priceVes: string;
  paymentMethod?: string | null;
  makerEmail?: string | null;
  makerId?: string | null;
  status?: P2pOrderStatus;
  isMine?: boolean;
  createdAt: number | string;
  [k: string]: unknown;
}

export interface P2pOrderInput {
  side: P2pSide;
  asset: P2pAsset;
  amount: string;
  priceVes: string;
  paymentMethod?: string;
}

export type P2pTradeStatus =
  | "pending"
  | "paid"
  | "released"
  | "completed"
  | "cancelled"
  | "disputed"
  | string;

/** Trade originado al tomar una oferta (GET /p2p/trades). */
export interface P2pTrade {
  id: string;
  orderId: string;
  side: P2pSide;
  asset: P2pAsset;
  amount: string;
  priceVes: string;
  status: P2pTradeStatus;
  /** Rol del usuario actual en este trade. */
  role?: "maker" | "taker" | "buyer" | "seller" | string;
  /** true si el usuario actual es el vendedor (puede confirmar pago). */
  isSeller?: boolean;
  counterpartyEmail?: string | null;
  paymentMethod?: string | null;
  createdAt: number | string;
  [k: string]: unknown;
}

/* ---------- P2P — arbitraje de disputas (operador backoffice) ---------- */

/** Trade en disputa de la cola del operador (GET /admin/p2p/disputes). */
export interface AdminP2pDispute {
  id: string;
  orderId: string;
  buyerUserId: string;
  sellerUserId: string;
  buyerEmail: string | null;
  sellerEmail: string | null;
  asset: P2pAsset;
  /** Monto de cripto (string decimal). */
  amount: string;
  /** Precio unitario en Bs (string decimal). */
  priceVes: string;
  status: "disputed" | P2pTradeStatus;
  disputeReason: string | null;
  /** userId del que abrió la disputa. */
  disputeBy: string | null;
  createdAt: number | string;
  [k: string]: unknown;
}

/** Mensaje del chat de un trade (GET /admin/p2p/trades/:id/messages). */
export interface AdminP2pMessage {
  id: string;
  tradeId: string;
  senderUserId: string;
  body: string | null;
  /** data URL de imagen base64 (evidencia de pago) o null. */
  attachment: string | null;
  createdAt: number | string;
  [k: string]: unknown;
}

export type P2pResolveDecision = "release" | "refund";

export interface P2pResolveInput {
  decision: P2pResolveDecision;
}

/* ---------- Métodos de pago del perfil ---------- */

export type PaymentMethodType = "pago_movil" | "bank_account" | string;

/** Método de pago del usuario (GET /me/payment-methods). */
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  bankName?: string | null;
  accountHolder?: string | null;
  idNumber?: string | null;
  phone?: string | null;
  accountNumber?: string | null;
  createdAt?: number | string;
  [k: string]: unknown;
}

export interface PaymentMethodInput {
  type: PaymentMethodType;
  label: string;
  bankName?: string;
  accountHolder?: string;
  idNumber?: string;
  phone?: string;
  accountNumber?: string;
}

/* ---------- KYC propio (envío de documentos) ---------- */

export interface KycSubmitInput {
  fullName?: string;
  documentType?: string;
  documentNumber?: string;
  nationality?: string;
  [k: string]: unknown;
}

/** Tipo de documento de identidad (replica exacta de la app móvil, extensible). */
export interface KycDocumentTypeDef {
  /** Valor enviado al backend en el campo `documentType`. */
  value: string;
  /** Etiqueta visible al usuario. */
  label: string;
  /** true → requiere foto del dorso (3 fotos: frente, dorso, selfie). */
  hasBack: boolean;
  /** Pista de captura para el usuario. */
  hint: string;
}

/**
 * Catálogo de tipos de documento aceptados. Replica exacta de la app móvil.
 * Extensible: agregar un objeto aquí lo habilita en todos los flujos.
 */
export const KYC_DOCUMENT_TYPES: KycDocumentTypeDef[] = [
  {
    value: "id_card",
    label: "Cédula de identidad",
    hasBack: false,
    hint: "En Venezuela la cédula tiene los datos solo en el anverso.",
  },
  {
    value: "passport",
    label: "Pasaporte",
    hasBack: false,
    hint: "Fotografía la página con tu foto y la zona de datos (MRZ).",
  },
  {
    value: "drivers_license",
    label: "Licencia de conducir",
    hasBack: true,
    hint: "Necesitamos el frente y el dorso de tu licencia.",
  },
  {
    value: "residence_permit",
    label: "Permiso de residencia",
    hasBack: true,
    hint: "Necesitamos el frente y el dorso del permiso.",
  },
  {
    value: "rif",
    label: "RIF",
    hasBack: false,
    hint: "Fotografía tu RIF completo y legible.",
  },
  {
    value: "nit",
    label: "NIT",
    hasBack: false,
    hint: "Fotografía tu NIT completo y legible.",
  },
];

/** Respuesta de POST /kyc/handoff/start (token corto para continuar en móvil). */
export interface KycHandoffStart {
  token: string;
  expiresInSec: number;
}

/* ---------- Tesorería / fees consolidados (operador backoffice) ---------- */

/** Tarifas vigentes de comisión de la plataforma. */
export interface TreasuryRates {
  p2pPct: number;
  depositPct: number;
  withdrawPct: number;
  withdrawNetworkFee: number;
  minFee: number;
  [k: string]: unknown;
}

/** Ingreso de fees consolidado por asset (cuenta system/fees). */
export interface FeeRevenueRow {
  asset: string;
  balance: string;
  available: string;
  held: string;
  [k: string]: unknown;
}

/** Respaldo on-chain (custodia de saldos de usuarios) por asset. */
export interface CustodyRow {
  asset: string;
  balance: string;
  [k: string]: unknown;
}

/** Consolidado de tesorería / fees (GET /admin/treasury). */
export interface AdminTreasury {
  rates: TreasuryRates;
  feeRevenue: FeeRevenueRow[];
  custody: CustodyRow[];
  masterWallet: string | null;
  onchain: Record<string, unknown> | null;
  [k: string]: unknown;
}

/* ---------- Custodia on-chain (hot wallet por red) ---------- */

/** Token (stablecoin) con su saldo on-chain en una red concreta. */
export interface CustodyTokenBalance {
  asset: string;
  balance: string;
  [k: string]: unknown;
}

/** Estado del hot wallet en una red EVM concreta. */
export interface CustodyNetwork {
  network: string;
  name: string;
  /** Símbolo del gas nativo (BNB / ETH / POL). */
  gasSymbol: string;
  /** Saldo de gas nativo (string decimal). */
  gas: string;
  /** True si el gas está por debajo del mínimo: no puede barrer ni retirar. */
  lowGas: boolean;
  tokens: CustodyTokenBalance[];
  /** URL del explorer para la dirección del hot wallet en esta red. */
  explorerUrl?: string | null;
  [k: string]: unknown;
}

/** Control de fondos de custodia (GET /admin/custody). */
export interface AdminCustody {
  enabled: boolean;
  hotWallet: string | null;
  networks: CustodyNetwork[];
  [k: string]: unknown;
}

/** Resultado del barrido de depósitos → hot wallet (POST /admin/sweep). */
export interface SweepResult {
  swept: number;
  gasTopUps: number;
  [k: string]: unknown;
}
