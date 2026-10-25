import {
  GAME_IDS,
  emptyItems,
  type Difficulty,
  type GameId,
  type Items,
  type Lang,
} from "@/lib/types";

export interface Profile {
  points: number;
  tokens: number;
  items: Items;
  plays: number;
  wins: number;
  bestScore: number;
  totalScore: number;
  cleared: number;
  settings: {
    music: boolean;
    sfx: boolean;
    voice: boolean;
    difficulty: Difficulty;
    lang: Lang;
  };
  caps: {
    day: string;
    dayNet: number;
    week: string;
    weekEarned: number;
    weekScore: number;
  };
  gifts: { day: string; count: number };
  dailyGrant: { last: string };
  claimed: {
    achievements: string[];
    endings: string[];
    events: string[];
    weeks: string[];
  };
  invite: { invitedBy: string | null; completedFirst: boolean };
  account: {
    trial: { name: string; email: string; hash: string };
    pi: { name: string; email: string; hash: string };
  };
  gameStats: Record<GameId, { plays: number; passes: number; scoreSum: number }>;
}

export interface DifficultyProgress {
  cleared: number[];
  best: Record<string, number>;
}

export interface GameProgress {
  cleared: number[];
  best: Record<string, number>;
  choices: Record<string, number>;
  endings: string[];
  byDiff: Record<Difficulty, DifficultyProgress>;
}

export type Progress = Record<GameId, GameProgress>;

export interface Friend {
  uid: string;
  username: string;
  code: string;
}

export interface Social {
  friends: Friend[];
  checkin: { last: string; streak: number };
}

export interface AppState {
  profile: Profile;
  progress: Progress;
  social: Social;
}

export type SliceKey = keyof AppState;

export function defaultProfile(startBonus: number): Profile {
  const stats = { plays: 0, passes: 0, scoreSum: 0 };
  return {
    points: startBonus,
    tokens: 0,
    items: emptyItems(),
    plays: 0,
    wins: 0,
    bestScore: 0,
    totalScore: 0,
    cleared: 0,
    settings: {
      music: true,
      sfx: true,
      voice: true,
      difficulty: "mid",
      lang: "zh",
    },
    caps: { day: "", dayNet: 0, week: "", weekEarned: 0, weekScore: 0 },
    gifts: { day: "", count: 0 },
    dailyGrant: { last: "" },
    claimed: { achievements: [], endings: [], events: [], weeks: [] },
    invite: { invitedBy: null, completedFirst: false },
    account: {
      trial: { name: "", email: "", hash: "" },
      pi: { name: "", email: "", hash: "" },
    },
    gameStats: {
      xiangyu: { ...stats },
      normandy: { ...stats },
      gladiator: { ...stats },
    },
  };
}

export function defaultProgress(): Progress {
  const make = (): GameProgress => ({
    cleared: [],
    best: {},
    choices: {},
    endings: [],
    byDiff: {
      low: { cleared: [], best: {} },
      mid: { cleared: [], best: {} },
      high: { cleared: [], best: {} },
    },
  });
  return { xiangyu: make(), normandy: make(), gladiator: make() };
}

export function defaultSocial(): Social {
  return { friends: [], checkin: { last: "", streak: 0 } };
}

/**
 * Merges untrusted saved data into a known-good default shape. Unknown keys are
 * dropped and values of the wrong type fall back to the default.
 */
export function mergeInto<T>(defaults: T, raw: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(raw) ? raw : defaults) as T;
  }
  if (defaults !== null && typeof defaults === "object") {
    const source =
      raw !== null && typeof raw === "object"
        ? (raw as Record<string, unknown>)
        : {};
    const result: Record<string, unknown> = {};
    const base = defaults as Record<string, unknown>;
    for (const key of Object.keys(base)) {
      result[key] = mergeInto(base[key], source[key]);
    }
    // Record-like maps (e.g. progress.best) keep their saved keys.
    if (Object.keys(base).length === 0) {
      return (raw !== null && typeof raw === "object" ? raw : defaults) as T;
    }
    return result as T;
  }
  if (typeof raw === typeof defaults) {
    if (typeof raw === "number" && !Number.isFinite(raw)) return defaults;
    return raw as T;
  }
  if (defaults === null && (typeof raw === "string" || raw === null)) {
    return raw as T;
  }
  return defaults;
}

export function mergeProfile(raw: unknown, startBonus: number): Profile {
  return mergeInto(defaultProfile(startBonus), raw);
}

export function mergeProgress(raw: unknown): Progress {
  const merged = mergeInto(defaultProgress(), raw);
  for (const id of GAME_IDS) {
    const g = merged[id];
    g.cleared = g.cleared.filter((n) => typeof n === "number");
    for (const d of ["low", "mid", "high"] as const) {
      g.byDiff[d].cleared = g.byDiff[d].cleared.filter((n) => typeof n === "number");
    }
    const noneByDiff = (["low", "mid", "high"] as const).every((d) => g.byDiff[d].cleared.length === 0);
    if (noneByDiff && g.cleared.length > 0) {
      // Saves from before per-difficulty lists count as medium progress.
      g.byDiff.mid = { cleared: [...g.cleared], best: { ...g.best } };
    }
  }
  return merged;
}

export function mergeSocial(raw: unknown): Social {
  return mergeInto(defaultSocial(), raw);
}

export function makeInviteCode(uid: string): string {
  let h = 2166136261;
  for (let i = 0; i < uid.length; i++) {
    h ^= uid.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const body = (h >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(-6);
  return `CG${body}`;
}
