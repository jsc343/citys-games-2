import { getStore } from "@/lib/server/store";

type Queryable = {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{ rowCount: number | null; rows: Record<string, unknown>[] }>;
};

const g = globalThis as unknown as {
  __cityGamesPool?: Queryable;
  __cityGamesVersion?: number;
  __cityGamesReady?: Promise<void>;
  __cityGamesDb?: { ok: boolean; error: string; at: number; saves: number };
};

function mark(ok: boolean, error = "") {
  const prev = g.__cityGamesDb;
  g.__cityGamesDb = {
    ok,
    error: error.slice(0, 200),
    at: Date.now(),
    saves: (prev?.saves ?? 0) + (ok ? 1 : 0),
  };
}

export function dbStatus() {
  return {
    configured: Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL),
    ...(g.__cityGamesDb ?? { ok: false, error: "", at: 0, saves: 0 }),
  };
}

function connectionString(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

export function dbEnabled(): boolean {
  return Boolean(connectionString());
}

// pg is loaded lazily so a runtime that cannot load it never breaks the API routes.
async function pool(): Promise<Queryable> {
  if (!g.__cityGamesPool) {
    const mod = await import("pg");
    const PoolClass = (mod as { Pool?: new (o: object) => Queryable }).Pool ??
      (mod as { default: { Pool: new (o: object) => Queryable } }).default.Pool;
    g.__cityGamesPool = new PoolClass({ connectionString: connectionString(), max: 3 });
  }
  return g.__cityGamesPool;
}

async function ensureTable() {
  if (!g.__cityGamesReady) {
    g.__cityGamesReady = pool()
      .then((p) =>
        p.query(
          `CREATE TABLE IF NOT EXISTS city_games_state (
            id text PRIMARY KEY,
            version bigint NOT NULL DEFAULT 0,
            value jsonb NOT NULL
          )`,
        ),
      )
      .then(() => undefined)
      .catch((e) => {
        g.__cityGamesReady = undefined;
        throw e;
      });
  }
  return g.__cityGamesReady;
}

const mapToArr = <K, V>(m: Map<K, V>) => [...m.entries()];
const setMapToArr = <V>(m: Map<string, Set<V>>) => [...m.entries()].map(([k, v]) => [k, [...v]]);

function serialize() {
  const s = getStore();
  return {
    players: mapToArr(s.players),
    inbox: mapToArr(s.inbox),
    exchanges: s.exchanges,
    feedback: s.feedback,
    announcements: s.announcements,
    config: s.config,
    admins: mapToArr(s.admins),
    invites: mapToArr(s.invites),
    giftCounts: mapToArr(s.giftCounts),
    weekBoards: [...s.weekBoards.entries()].map(([k, v]) => [k, [...v.entries()]]),
    weeklyClaims: [...s.weeklyClaims],
    eventClaims: setMapToArr(s.eventClaims),
    activity: setMapToArr(s.activity),
  };
}

type Saved = ReturnType<typeof serialize>;

function hydrate(data: Partial<Saved>) {
  const s = getStore();
  if (data.players) s.players = new Map(data.players);
  if (data.inbox) s.inbox = new Map(data.inbox);
  if (data.exchanges) s.exchanges = data.exchanges;
  if (data.feedback) s.feedback = data.feedback;
  if (data.announcements) s.announcements = data.announcements;
  if (data.config) s.config = data.config;
  if (data.admins) {
    const merged = new Map(data.admins);
    for (const [email, acct] of s.admins) {
      if (!merged.has(email)) merged.set(email, acct);
    }
    s.admins = merged;
  }
  if (data.invites) s.invites = new Map(data.invites);
  if (data.giftCounts) s.giftCounts = new Map(data.giftCounts);
  if (data.weekBoards) {
    s.weekBoards = new Map(
      (data.weekBoards as [string, [string, number][]][]).map(([k, v]) => [k, new Map(v)]),
    );
  }
  if (data.weeklyClaims) s.weeklyClaims = new Set(data.weeklyClaims);
  if (data.eventClaims) {
    s.eventClaims = new Map(
      (data.eventClaims as [string, string[]][]).map(([k, v]) => [k, new Set(v)]),
    );
  }
  if (data.activity) {
    s.activity = new Map(
      (data.activity as [string, string[]][]).map(([k, v]) => [k, new Set(v)]),
    );
  }
}

export async function loadStore(): Promise<void> {
  if (!dbEnabled()) return;
  try {
    await ensureTable();
    const db = await pool();
    const head = await db.query("SELECT version FROM city_games_state WHERE id = 'main'");
    if (head.rowCount === 0) return;
    const remote = Number(head.rows[0].version);
    if (g.__cityGamesVersion === remote) return;
    const full = await db.query(
      "SELECT version, value FROM city_games_state WHERE id = 'main'",
    );
    if (full.rowCount === 0) return;
    hydrate(full.rows[0].value as Partial<Saved>);
    g.__cityGamesVersion = Number(full.rows[0].version);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    mark(false, `load: ${msg}`);
    console.log(`[db] load failed: ${msg}`);
  }
}

export async function saveStore(): Promise<void> {
  if (!dbEnabled()) return;
  try {
    await ensureTable();
    const db = await pool();
    const res = await db.query(
      `INSERT INTO city_games_state (id, version, value)
       VALUES ('main', 1, $1::jsonb)
       ON CONFLICT (id) DO UPDATE
         SET value = EXCLUDED.value, version = city_games_state.version + 1
       RETURNING version`,
      [JSON.stringify(serialize())],
    );
    g.__cityGamesVersion = Number(res.rows[0].version);
    mark(true);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    mark(false, `save: ${msg}`);
    console.log(`[db] save failed: ${msg}`);
  }
}
