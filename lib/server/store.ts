import { constantTimeEqual, hmacSha256Hex } from "@/lib/server/hmac";
import { DEFAULT_CONFIG } from "@/lib/default-config";
import { dayKey, weekKey } from "@/lib/economy";
import { mergeInto } from "@/lib/state";
import {
  GAME_IDS,
  ITEM_TYPES,
  emptyItems,
  type AnnouncementCategory,
  type AnnouncementPublic,
  type ExchangeRecord,
  type FeedbackRecord,
  type GameConfig,
  type GameId,
  type InboxItem,
  type Items,
  type L,
} from "@/lib/types";

export const DEFAULT_ADMINS = ["a0988576990@gmail.com", "a0931653580@gmail.com"];

export interface PlayerRow {
  uid: string;
  username: string;
  email?: string;
  inviteCode: string;
  registeredAt: number;
  lastSeen: number;
  points: number;
  tokens: number;
  items: Items;
  totalScore: number;
  bestScore: number;
  cleared: number;
  plays: number;
  wins: number;
  week: string;
  weekScore: number;
  gameStats: Record<GameId, { plays: number; passes: number; scoreSum: number }>;
  invitedBy: string | null;
  progress: Record<GameId, { cleared: number[]; endings: string[] }>;
}

export interface AnnouncementFull {
  id: string;
  title: L;
  body: L;
  category: AnnouncementCategory;
  publishAt: number;
  offline: boolean;
  createdAt: number;
}

interface AdminAccount {
  email: string;
  salt?: string;
  hash?: string;
  protected: boolean;
}

interface CodeEntry {
  code: string;
  expires: number;
  attempts: number;
}

interface Store {
  players: Map<string, PlayerRow>;
  inbox: Map<string, InboxItem[]>;
  exchanges: ExchangeRecord[];
  feedback: FeedbackRecord[];
  announcements: AnnouncementFull[];
  config: GameConfig;
  admins: Map<string, AdminAccount>;
  codes: Map<string, CodeEntry>;
  sessions: Map<string, { email: string; expires: number }>;
  loginFails: Map<string, { count: number; reset: number }>;
  invites: Map<string, { inviterUid: string; month: string; done: boolean }>;
  giftCounts: Map<string, number>;
  weekBoards: Map<string, Map<string, number>>;
  weeklyClaims: Set<string>;
  eventClaims: Map<string, Set<string>>;
  activity: Map<string, Set<string>>;
}

const g = globalThis as unknown as { __cityGamesStore?: Store };

function createStore(): Store {
  const admins = new Map<string, AdminAccount>();
  for (const email of DEFAULT_ADMINS) admins.set(email, { email, protected: true });
  return {
    players: new Map(),
    inbox: new Map(),
    exchanges: [],
    feedback: [],
    announcements: [
      {
        id: "welcome",
        title: { zh: "歡迎來到 City's Games(2)", en: "Welcome to City's Games(2)" },
        body: {
          zh: "三款歷史街機遊戲已開放，每款十個關卡。每次抉擇都會改變戰局與結局。",
          en: "Three historical arcade games are open, ten levels each. Every choice changes the battle and the ending.",
        },
        category: "update",
        publishAt: Date.now() - 1000,
        offline: false,
        createdAt: Date.now(),
      },
    ],
    config: structuredClone(DEFAULT_CONFIG),
    admins,
    codes: new Map(),
    sessions: new Map(),
    loginFails: new Map(),
    invites: new Map(),
    giftCounts: new Map(),
    weekBoards: new Map(),
    weeklyClaims: new Set(),
    eventClaims: new Map(),
    activity: new Map(),
  };
}

export function getStore(): Store {
  if (!g.__cityGamesStore) g.__cityGamesStore = createStore();
  return g.__cityGamesStore;
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function newId(prefix: string): string {
  return `${prefix}_${randomHex(6)}`;
}

export function num(v: unknown, max = 1e12): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), max);
}

export function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function sanitizeConfig(raw: unknown): GameConfig {
  const merged = mergeInto(structuredClone(DEFAULT_CONFIG), raw);
  merged.leaderboardRewards = merged.leaderboardRewards
    .filter((r) => r && typeof r === "object")
    .map((r) => ({
      from: num(r.from, 10000),
      to: num(r.to, 10000),
      points: num(r.points),
      tokens: num(r.tokens),
    }));
  merged.events = merged.events
    .filter((e) => e && typeof e === "object")
    .slice(0, 30)
    .map((e) => ({
      id: str(e.id, 40) || newId("evt"),
      title: { zh: str(e.title?.zh, 80), en: str(e.title?.en, 80) },
      points: num(e.points),
      tokens: num(e.tokens),
      total: num(e.total, 1e7),
      active: Boolean(e.active),
    }));
  merged.piExchange.walletAddress = str(merged.piExchange.walletAddress, 120);
  merged.piExchange.memoHint = str(merged.piExchange.memoHint, 160);
  merged.piExchange.pointsPerPi = Math.max(1, num(merged.piExchange.pointsPerPi));
  merged.piExchange.pointsPerToken = Math.max(1, num(merged.piExchange.pointsPerToken));
  return merged;
}

export function publicAnnouncements(): AnnouncementPublic[] {
  const now = Date.now();
  return getStore()
    .announcements.filter((a) => !a.offline && a.publishAt <= now)
    .sort((a, b) => b.publishAt - a.publishAt)
    .slice(0, 60)
    .map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      category: a.category,
      publishedAt: a.publishAt,
    }));
}

export function touchActivity(uid: string) {
  const s = getStore();
  const day = dayKey();
  let set = s.activity.get(day);
  if (!set) {
    set = new Set();
    s.activity.set(day, set);
    if (s.activity.size > 45) {
      const oldest = [...s.activity.keys()].sort()[0];
      s.activity.delete(oldest);
    }
  }
  set.add(uid);
}

export function pushInbox(uid: string, item: Omit<InboxItem, "id">) {
  const s = getStore();
  const list = s.inbox.get(uid) ?? [];
  list.push({ ...item, id: newId("in") });
  s.inbox.set(uid, list.slice(-50));
}

export function popInbox(uid: string): InboxItem[] {
  const s = getStore();
  const list = s.inbox.get(uid) ?? [];
  s.inbox.delete(uid);
  return list;
}

export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function findByInviteCode(code: string): PlayerRow | undefined {
  const clean = code.trim().toUpperCase();
  for (const p of getStore().players.values()) {
    if (p.inviteCode === clean) return p;
  }
  return undefined;
}

export function rankOf(
  board: Map<string, number> | undefined,
  uid: string,
): { rank: number; score: number } | null {
  if (!board) return null;
  const mine = board.get(uid);
  if (!mine || mine <= 0) return null;
  const sorted = [...board.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const idx = sorted.findIndex(([id]) => id === uid);
  return idx < 0 ? null : { rank: idx + 1, score: mine };
}

export function recordWeekScore(week: string, uid: string, score: number) {
  const s = getStore();
  let board = s.weekBoards.get(week);
  if (!board) {
    board = new Map();
    s.weekBoards.set(week, board);
    if (s.weekBoards.size > 8) {
      const oldest = [...s.weekBoards.keys()].sort()[0];
      s.weekBoards.delete(oldest);
    }
  }
  board.set(uid, Math.max(board.get(uid) ?? 0, score));
}

export function emptyPlayer(uid: string, username: string, inviteCode: string): PlayerRow {
  const stats = { plays: 0, passes: 0, scoreSum: 0 };
  const prog = { cleared: [] as number[], endings: [] as string[] };
  return {
    uid,
    username,
    inviteCode,
    registeredAt: Date.now(),
    lastSeen: Date.now(),
    points: 0,
    tokens: 0,
    items: emptyItems(),
    totalScore: 0,
    bestScore: 0,
    cleared: 0,
    plays: 0,
    wins: 0,
    week: weekKey(),
    weekScore: 0,
    gameStats: { xiangyu: { ...stats }, normandy: { ...stats }, gladiator: { ...stats } },
    invitedBy: null,
    progress: {
      xiangyu: { ...prog },
      normandy: { ...prog },
      gladiator: { ...prog },
    },
  };
}

export function cleanItems(raw: unknown): Items {
  const out = emptyItems();
  if (raw && typeof raw === "object") {
    for (const t of ITEM_TYPES) out[t] = num((raw as Record<string, unknown>)[t], 1e6);
  }
  return out;
}

export function cleanGameStats(raw: unknown): PlayerRow["gameStats"] {
  const base = emptyPlayer("", "", "").gameStats;
  if (raw && typeof raw === "object") {
    for (const id of GAME_IDS) {
      const r = (raw as Record<string, Record<string, unknown>>)[id];
      if (r) {
        base[id] = {
          plays: num(r.plays, 1e8),
          passes: num(r.passes, 1e8),
          scoreSum: num(r.scoreSum),
        };
      }
    }
  }
  return base;
}

export function cleanProgress(raw: unknown): PlayerRow["progress"] {
  const base = emptyPlayer("", "", "").progress;
  if (raw && typeof raw === "object") {
    for (const id of GAME_IDS) {
      const r = (raw as Record<string, { cleared?: unknown; endings?: unknown }>)[id];
      if (r) {
        base[id] = {
          cleared: Array.isArray(r.cleared)
            ? r.cleared.filter((n): n is number => typeof n === "number").slice(0, 20)
            : [],
          endings: Array.isArray(r.endings)
            ? r.endings.filter((n): n is string => typeof n === "string").slice(0, 20)
            : [],
        };
      }
    }
  }
  return base;
}

function stretch(password: string, salt: string): string {
  let h = hmacSha256Hex(salt, password);
  for (let i = 0; i < 2000; i++) h = hmacSha256Hex(salt, h + password);
  return h;
}

export function hashPassword(password: string, salt = randomHex(16)) {
  return { salt, hash: stretch(password, salt) };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  return constantTimeEqual(stretch(password, salt), hash);
}
