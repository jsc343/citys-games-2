export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(`Request failed with ${status}`);
    this.status = status;
    this.data = data;
  }
}

async function parse(res: Response) {
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

const ADMIN_TOKEN_KEY = "cg_admin_token";
const ADMIN_CRED_KEY = "cg_admin_cred";

function storeGet(kind: "session" | "local", key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (kind === "session" ? window.sessionStorage : window.localStorage).getItem(key);
  } catch {
    return null;
  }
}

function storeSet(kind: "session" | "local", key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    const s = kind === "session" ? window.sessionStorage : window.localStorage;
    if (value) s.setItem(key, value);
    else s.removeItem(key);
  } catch {
    // storage unavailable; the cookie path still applies
  }
}

// Admin requests carry the session and saved credential as headers because
// cookies are frequently blocked when the app runs inside a preview frame.
function withAdminHeaders(url: string, headers?: Record<string, string>) {
  if (!url.startsWith("/api/admin/")) return headers;
  const extra: Record<string, string> = {};
  const token = storeGet("session", ADMIN_TOKEN_KEY);
  const cred = storeGet("local", ADMIN_CRED_KEY);
  if (token) extra["x-admin-token"] = token;
  if (cred) extra["x-admin-cred"] = cred;
  return { ...extra, ...(headers ?? {}) };
}

function rememberAdmin(url: string, data: unknown) {
  if (!url.startsWith("/api/admin/")) return;
  if (url === "/api/admin/logout") {
    storeSet("session", ADMIN_TOKEN_KEY, null);
    return;
  }
  if (data && typeof data === "object") {
    const d = data as { token?: unknown; cred?: unknown };
    if (typeof d.token === "string") storeSet("session", ADMIN_TOKEN_KEY, d.token);
    if (typeof d.cred === "string") storeSet("local", ADMIN_CRED_KEY, d.cred);
  }
}

export async function getJson<T>(
  url: string,
  headers?: Record<string, string>,
): Promise<T> {
  const res = await fetch(url, { headers: withAdminHeaders(url, headers), cache: "no-store" });
  const data = await parse(res);
  rememberAdmin(url, data);
  return data as T;
}

export async function postJson<T>(
  url: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(withAdminHeaders(url, headers) ?? {}) },
    body: JSON.stringify(body),
  });
  const data = await parse(res);
  rememberAdmin(url, data);
  return data as T;
}

export function errorReason(err: unknown): string {
  if (err instanceof ApiError && err.data && typeof err.data === "object") {
    const r = (err.data as { error?: unknown }).error;
    if (typeof r === "string") return r;
  }
  return "network";
}
