export type Lang =
  | "zh"
  | "en"
  | "ja"
  | "ko"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "ru"
  | "id"
  | "vi"
  | "th"
  | "ar"
  | "hi"
  | "tr"
  | "fil"
  | "it"
  | "nl"
  | "pl"
  | "uk"
  | "ms"
  | "bn";
export type L = { zh: string; en: string };
export type Difficulty = "low" | "mid" | "high";
export type ItemType = "weapon" | "energy" | "wisdom" | "help" | "chance";
export type GameId = "xiangyu" | "normandy" | "gladiator";

export const ITEM_TYPES: ItemType[] = [
  "weapon",
  "energy",
  "wisdom",
  "help",
  "chance",
];
export const GAME_IDS: GameId[] = ["xiangyu", "normandy", "gladiator"];
export const DIFFICULTIES: Difficulty[] = ["low", "mid", "high"];

export type Items = Record<ItemType, number>;

export function emptyItems(): Items {
  return { weapon: 0, energy: 0, wisdom: 0, help: 0, chance: 0 };
}

export interface LevelTuning {
  entry: number;
  failPct: number;
  roundWin: number;
  roundLoss: number;
  passReward: number;
}

export interface ShopEntry {
  price: number;
  buyback: number;
  active: boolean;
}

export interface EventDef {
  id: string;
  title: L;
  points: number;
  tokens: number;
  total: number;
  active: boolean;
}

export interface LeaderboardReward {
  from: number;
  to: number;
  points: number;
  tokens: number;
}

export interface GameConfig {
  tuning: Record<Difficulty, LevelTuning>;
  rewardMultiplier: number;
  welfare: {
    startBonus: number;
    dailyGrantActive: boolean;
    dailyGrantAmount: number;
    checkinMultiplier: number;
    inviterBonus: number;
    inviteeBonus: number;
    inviteMonthlyCap: number;
    firstClearMultiplier: number;
    replayMultiplier: number;
    endingBonus: number;
  };
  caps: {
    daily: number;
    weekly: number;
    dailyMult: number;
    weeklyMult: number;
    overflowRate: number;
  };
  social: { dailyGiftLimit: number };
  shop: Record<ItemType, ShopEntry>;
  games: Record<GameId, { enabled: boolean }>;
  piExchange: {
    pointsPerPi: number;
    pointsPerToken: number;
    walletAddress: string;
    memoHint: string;
  };
  leaderboardRewards: LeaderboardReward[];
  events: EventDef[];
}

export type AnnouncementCategory =
  | "maintenance"
  | "update"
  | "event"
  | "rules";

export interface AnnouncementPublic {
  id: string;
  title: L;
  body: L;
  category: AnnouncementCategory;
  publishedAt: number;
}

export interface InboxItem {
  id: string;
  kind: "gift" | "invite" | "exchange" | "event" | "admin";
  points?: number;
  tokens?: number;
  item?: { type: ItemType; qty: number };
  from?: string;
  text?: string;
}

export type ExchangeStatus = "pending" | "confirmed" | "rejected";
export type FeedbackStatus = "unread" | "processing" | "replied" | "closed";
export type FeedbackType = "suggestion" | "bug" | "other";

export interface ExchangeRecord {
  id: string;
  uid: string;
  username: string;
  target: "points" | "tokens";
  pi: number;
  points: number;
  tokens: number;
  status: ExchangeStatus;
  createdAt: number;
  updatedAt: number;
}

export interface FeedbackRecord {
  id: string;
  uid: string;
  username: string;
  title: string;
  type: FeedbackType;
  body: string;
  shot?: string;
  status: FeedbackStatus;
  replies: { at: number; text: string }[];
  createdAt: number;
}
