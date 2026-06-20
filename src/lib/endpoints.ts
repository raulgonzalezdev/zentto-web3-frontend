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

  // on-chain EVM (Sepolia — publico)
  evmInfo: "/evm/info",
  evmAddress: (address: string) => `/evm/address/${encodeURIComponent(address)}`,
  evmTx: (hash: string) => `/evm/tx/${encodeURIComponent(hash)}`,
} as const;
