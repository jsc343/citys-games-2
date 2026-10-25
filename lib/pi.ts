"use client";

// Self-contained Pi client for App Studio custom apps.
//
// Auth and user-state talk to the App Studio backend directly over fetch. The `pi` singleton
// below is the one instance the whole app shares: the auth context logs in through it on
// startup, and app code reads and writes user state through `pi.userState` from anywhere,
// no hook needed. Payments, ads, products and purchase balances are served by SDKLite,
// reached through `usePiAuth().sdk`. The two do not overlap.
//
// This file is locked in generated apps. Keep it free of imports other than
// lib/system-config.ts and type-only imports. Only `pi` and types are exported on purpose:
// there is exactly one client, and nothing outside this file should build another.

import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import type { PiAuthResult, UserStateRecord } from "@/lib/sdklite-types";

export type PiUser = PiAuthResult["user"];

export interface PiAuthApi {
  /** Logs in through Pi and the App Studio backend. Returns the cached user after the first call. */
  login: () => Promise<PiUser>;
  getUser: () => PiUser | null;
  isLoggedIn: () => boolean;
  /** Forgets the cached user and token so the next login() authenticates again. */
  reset: () => void;
}

export interface PiUserStateApi {
  get: (key: string) => Promise<UserStateRecord | null>;
  set: (key: string, blob: Record<string, unknown>) => Promise<void>;
  delete: (key: string) => Promise<void>;
  keys: () => Promise<string[]>;
}

export interface PiSdk {
  auth: PiAuthApi;
  userState: PiUserStateApi;
}

export interface PiBackendError extends Error {
  name: "PiBackendError";
  status: number;
  data: unknown;
}

const AUTH_SCOPES = ["username", "payments"];
const REQUEST_TIMEOUT_MS = 10_000;
const AUTH_BASE_PATH = "/pi/auth/v1";
const USER_STATE_BASE_PATH = "/pi/user-state/v1";

interface LoginResponse {
  sessionToken: string;
  user: PiUser;
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface AuthSession {
  api: PiAuthApi;
  headers: () => Record<string, string>;
  ensureLoggedIn: () => Promise<void>;
}

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Minimal JSON client against the App Studio backend: 10 s timeout so a stalled request fails
 * instead of hanging the login screen, JSON content type only when a body is sent, throws on
 * any non-2xx status, resolves to the parsed JSON body (or null for an empty body).
 */
async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${PI_NETWORK_CONFIG.BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const data = parseBody(await response.text());

  if (!response.ok) {
    const error = new Error(
      `Pi backend request failed: ${response.status} ${response.statusText}`,
    ) as PiBackendError;
    error.name = "PiBackendError";
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

/**
 * Authenticates with the Pi Platform SDK and exchanges the access token for an App Studio
 * session token. `login()` is idempotent: once a user is known it returns immediately, and
 * concurrent callers share one in-flight login so Pi is never prompted twice.
 */
function createAuth(): AuthSession {
  let user: PiUser | null = null;
  let sessionToken: string | null = null;
  let inflight: Promise<PiUser> | null = null;
  // Deliberate no-op. Payments are owned by SDKLite, which handles incomplete payments itself.
  const onIncompletePaymentFound = () => {};

  async function authenticate(): Promise<PiUser> {
    if (typeof window === "undefined" || !window.Pi) {
      throw new Error("Pi SDK is not available in this environment");
    }

    const result = await window.Pi.authenticate(AUTH_SCOPES, onIncompletePaymentFound);
    const response = await request<LoginResponse>(`${AUTH_BASE_PATH}/login`, {
      method: "POST",
      body: JSON.stringify({ accessToken: result.accessToken }),
    });

    sessionToken = response.sessionToken;
    user = response.user;
    return user;
  }

  function login(): Promise<PiUser> {
    if (user) return Promise.resolve(user);
    if (inflight) return inflight;

    inflight = authenticate().finally(() => {
      inflight = null;
    });
    return inflight;
  }

  function headers(): Record<string, string> {
    return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
  }

  async function ensureLoggedIn(): Promise<void> {
    if (!user) await login();
  }

  function reset(): void {
    user = null;
    sessionToken = null;
    inflight = null;
  }

  return {
    api: {
      login,
      getUser: () => user,
      isLoggedIn: () => user !== null,
      reset,
    },
    headers,
    ensureLoggedIn,
  };
}

/**
 * Per-user key/value storage backed by the App Studio backend. Every call logs in first if
 * needed and sends the session token.
 */
function createUserState(auth: AuthSession): PiUserStateApi {
  async function authedRequest<T>(path: string, init: RequestOptions): Promise<T> {
    await auth.ensureLoggedIn();
    return request<T>(`${USER_STATE_BASE_PATH}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), ...auth.headers() },
    });
  }

  return {
    get: (key) =>
      authedRequest<UserStateRecord | null>(`/${encodeURIComponent(key)}`, { method: "GET" }),
    set: async (key, blob) => {
      await authedRequest<null>(`/${encodeURIComponent(key)}`, {
        method: "PUT",
        body: JSON.stringify(blob),
      });
    },
    delete: async (key) => {
      await authedRequest<null>(`/${encodeURIComponent(key)}`, { method: "DELETE" });
    },
    keys: () => authedRequest<string[]>("/", { method: "GET" }),
  };
}

function buildPiClient(): PiSdk {
  const auth = createAuth();
  // Frozen so app code cannot replace or monkeypatch the client by accident.
  return Object.freeze({
    auth: Object.freeze(auth.api),
    userState: Object.freeze(createUserState(auth)),
  });
}

/**
 * The shared Pi client. Import it anywhere in client code:
 *
 *   import { pi } from "@/lib/pi";
 *   await pi.userState.set("save", { level: 4 });
 *
 * User-state calls log in on demand and wait for a login already in progress, so they are
 * safe to call before the auth context has finished starting up.
 */
export const pi: PiSdk = buildPiClient();
