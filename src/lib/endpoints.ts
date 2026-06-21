// Mapa central de endpoints del backend Zentto Web3.
// Base configurable via NEXT_PUBLIC_API_BASE (default http://localhost:4100/api).

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:4100/api";

export const ENDPOINTS = {
  // auth
  csrf: "/auth/csrf",
  register: "/auth/register",
  login: "/auth/login",
  login2fa: "/auth/login/2fa",
  refresh: "/auth/refresh",
  me: "/auth/me",
  logout: "/auth/logout",
  twoFaSetup: "/auth/2fa/setup",
  twoFaEnable: "/auth/2fa/enable",
  twoFaDisable: "/auth/2fa/disable",
  verifyEmail: "/auth/verify-email",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",

  // chain / explorer (publico)
  health: "/health",
  chain: "/chain",
  chainValidate: "/chain/validate",
  block: (index: number | string) => `/blocks/${index}`,
  pending: "/transactions/pending",
  transaction: (id: string) => `/transactions/${id}`,

  // wallets
  walletCreate: "/wallets",
  walletSign: "/wallets/sign",
  walletBalance: (address: string) => `/wallets/${address}/balance`,

  // transactions
  txCreate: "/transactions",

  // mining
  mining: "/mining",
  miningJob: (jobId: string) => `/mining/jobs/${jobId}`,

  // compliance
  complianceStatus: "/compliance/status",
  complianceScreen: "/compliance/screen",
  complianceScreenGet: (address: string) => `/compliance/screen/${address}`,
  complianceReport: "/compliance/report",

  // analytics
  graph: "/analytics/graph",
  hubs: (minDegree = 5) => `/analytics/hubs?minDegree=${minDegree}`,
  addressRelations: (address: string) =>
    `/analytics/address/${address}/relations`,
  trace: (from: string, to: string) =>
    `/analytics/trace?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,

  // banca (neobanco custodial — protegido)
  accountsBalance: "/accounts/balance",
  payments: "/payments",
  payment: (id: string) => `/payments/${encodeURIComponent(id)}`,
  paymentTransfer: "/payments/transfer",
  paymentCredit: "/payments/credit",

  // KYC / compliance (operador backoffice — protegido)
  kycPending: "/kyc/pending",
  kycDecision: (id: string) => `/kyc/${encodeURIComponent(id)}/decision`,
  kycStatus: "/kyc/status",
  kycSubmit: "/kyc/submit",
  kycVerifyDocuments: "/kyc/verify-documents",
  kycHandoffStart: "/kyc/handoff/start",
  kycHandoffVerify: "/kyc/handoff/verify",

  // P2P (order book entre usuarios — protegido)
  p2pOrders: (side?: string, asset?: string) => {
    const qs = new URLSearchParams();
    if (side) qs.set("side", side);
    if (asset) qs.set("asset", asset);
    const s = qs.toString();
    return s ? `/p2p/orders?${s}` : "/p2p/orders";
  },
  p2pOrdersMine: "/p2p/orders/mine",
  p2pOrderTake: (id: string) => `/p2p/orders/${encodeURIComponent(id)}/take`,
  p2pOrderCancel: (id: string) => `/p2p/orders/${encodeURIComponent(id)}/cancel`,
  p2pTrades: "/p2p/trades",
  p2pTradeConfirm: (id: string) => `/p2p/trades/${encodeURIComponent(id)}/confirm`,
  p2pTradeCancel: (id: string) => `/p2p/trades/${encodeURIComponent(id)}/cancel`,

  // métodos de pago del perfil (protegido)
  paymentMethods: "/me/payment-methods",
  paymentMethod: (id: string) => `/me/payment-methods/${encodeURIComponent(id)}`,

  // deposito / retiro on-chain (custodia — protegido)
  depositAddress: "/accounts/deposit-address",
  deposits: "/accounts/deposits",
  withdraw: "/payments/withdraw",

  // admin / operador backoffice (datos de TODOS los usuarios — protegido)
  adminStats: "/admin/stats",
  adminUsers: "/admin/users",
  adminKyc: (status?: string) =>
    status ? `/admin/kyc?status=${encodeURIComponent(status)}` : "/admin/kyc",
  adminPayments: (type?: string) =>
    type ? `/admin/payments?type=${encodeURIComponent(type)}` : "/admin/payments",
  // tesoreria / fees consolidados de la plataforma (operador backoffice)
  adminTreasury: "/admin/treasury",

  // P2P — arbitraje de disputas (operador backoffice — protegido)
  adminP2pDisputes: "/admin/p2p/disputes",
  adminP2pTrade: (id: string) => `/admin/p2p/trades/${encodeURIComponent(id)}`,
  adminP2pTradeMessages: (id: string) =>
    `/admin/p2p/trades/${encodeURIComponent(id)}/messages`,
  adminP2pTradeResolve: (id: string) =>
    `/admin/p2p/trades/${encodeURIComponent(id)}/resolve`,

  // on-chain EVM (Sepolia — publico)
  evmInfo: "/evm/info",
  evmAddress: (address: string) => `/evm/address/${encodeURIComponent(address)}`,
  evmTx: (hash: string) => `/evm/tx/${encodeURIComponent(hash)}`,
} as const;
