// Cliente HTTP del frontend Zentto Web3.
//
// Reglas criticas (ver API_CONTRACT.md):
//  - SIEMPRE credentials: 'include' (cookies httpOnly zw3_access / zw3_refresh / zw3_csrf).
//  - NUNCA leer/escribir tokens en localStorage/sessionStorage.
//  - En metodos que mutan (POST/PUT/PATCH/DELETE) enviar header x-csrf-token
//    con el valor de la cookie zw3_csrf (double-submit).
//  - Ante un 401 en llamada protegida -> intentar POST /auth/refresh UNA vez y reintentar.

import { API_BASE, ENDPOINTS } from "./endpoints";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Lee una cookie por nombre (solo zw3_csrf es legible por JS). */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Asegura que tengamos la cookie zw3_csrf; si no, la pide al backend. */
async function ensureCsrf(): Promise<string | null> {
  let token = readCookie("zw3_csrf");
  if (token) return token;
  try {
    const res = await fetch(`${API_BASE}${ENDPOINTS.csrf}`, {
      method: "GET",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      token = readCookie("zw3_csrf") || data?.csrfToken || null;
    }
  } catch {
    /* offline / backend caido */
  }
  return token;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  // si false, no se reintenta refresh ante 401 (lo usa el propio refresh).
  retryOnAuth?: boolean;
  signal?: AbortSignal;
  /**
   * Clave de idempotencia para POSTs que mutan saldo (transfer/credit).
   * Si se pasa `true`, se genera un uuid por intento. Si se pasa un string,
   * se usa ese valor (util para reintentos seguros desde la UI).
   */
  idempotencyKey?: string | boolean;
}

/** Genera un uuid v4 (browser + Node 19+). Fallback simple si no hay crypto. */
function genUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let refreshInFlight: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const csrf = await ensureCsrf();
        const res = await fetch(`${API_BASE}${ENDPOINTS.refresh}`, {
          method: "POST",
          credentials: "include",
          headers: csrf ? { "x-csrf-token": csrf } : {},
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        // liberar el lock en el siguiente tick
        setTimeout(() => (refreshInFlight = null), 0);
      }
    })();
  }
  return refreshInFlight;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const method = (opts.method || "GET").toUpperCase();
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  if (MUTATING.has(method)) {
    const csrf = await ensureCsrf();
    if (csrf) headers["x-csrf-token"] = csrf;
  }

  if (opts.idempotencyKey) {
    headers["Idempotency-Key"] =
      typeof opts.idempotencyKey === "string"
        ? opts.idempotencyKey
        : genUuid();
  }

  const exec = () =>
    fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers,
      body,
      signal: opts.signal,
    });

  let res = await exec();

  // auto-refresh una sola vez ante 401
  if (res.status === 401 && opts.retryOnAuth !== false) {
    const ok = await doRefresh();
    if (ok) res = await exec();
  }

  if (!res.ok) {
    let parsed: unknown = null;
    let message = `HTTP ${res.status}`;
    try {
      parsed = await res.json();
      const m = (parsed as { message?: string | string[] })?.message;
      if (Array.isArray(m)) message = m.join(", ");
      else if (typeof m === "string") message = m;
    } catch {
      /* respuesta sin json */
    }
    throw new ApiError(res.status, message, parsed);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const api = {
  get: <T = unknown>(path: string, signal?: AbortSignal) =>
    apiFetch<T>(path, { method: "GET", signal }),
  post: <T = unknown>(
    path: string,
    body?: unknown,
    opts?: { idempotencyKey?: string | boolean },
  ) =>
    apiFetch<T>(path, {
      method: "POST",
      body,
      idempotencyKey: opts?.idempotencyKey,
    }),
  put: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body }),
  del: <T = unknown>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

export { ensureCsrf };
