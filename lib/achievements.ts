import type { Profile, Progress, Social } from "@/lib/state";
import { GAME_IDS, ITEM_TYPES, type L } from "@/lib/types";

export interface Achievement {
  id: string;
  title: L;
  desc: L;
  points: number;
  tokens: number;
  check: (p: Profile, g: Progress, s: Social) => boolean;
}

const totalEndings = (g: Progress) =>
  GAME_IDS.reduce((sum, id) => sum + g[id].endings.length, 0);

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_clear",
    title: { zh: "初試啼聲", en: "First Steps" },
    desc: { zh: "通過任一關卡", en: "Clear any level" },
    points: 200,
    tokens: 0,
    check: (p) => p.cleared >= 1,
  },
  {
    id: "clear_5",
    title: { zh: "漸入佳境", en: "Getting Warm" },
    desc: { zh: "累計過關 5 次", en: "Clear 5 levels in total" },
    points: 500,
    tokens: 0,
    check: (p) => p.cleared >= 5,
  },
  {
    id: "clear_15",
    title: { zh: "身經百戰", en: "Battle-Hardened" },
    desc: { zh: "累計過關 15 次", en: "Clear 15 levels in total" },
    points: 1500,
    tokens: 2,
    check: (p) => p.cleared >= 15,
  },
  {
    id: "full_game",
    title: { zh: "終局之人", en: "Finisher" },
    desc: { zh: "通關任一款遊戲的 10 個關卡", en: "Clear all 10 levels of any game" },
    points: 3000,
    tokens: 5,
    check: (_p, g) => GAME_IDS.some((id) => g[id].cleared.length >= 10),
  },
  {
    id: "collector",
    title: { zh: "寶物收藏家", en: "Collector" },
    desc: { zh: "同時持有五類寶物", en: "Hold all five treasure types at once" },
    points: 800,
    tokens: 1,
    check: (p) => ITEM_TYPES.every((t) => p.items[t] > 0),
  },
  {
    id: "endings_3",
    title: { zh: "命運見證者", en: "Witness of Fate" },
    desc: { zh: "解鎖 3 個結局", en: "Unlock 3 endings" },
    points: 2000,
    tokens: 5,
    check: (_p, g) => totalEndings(g) >= 3,
  },
  {
    id: "streak_7",
    title: { zh: "七日之約", en: "A Week Together" },
    desc: { zh: "連續簽到 7 天", en: "Check in 7 days in a row" },
    points: 500,
    tokens: 2,
    check: (_p, _g, s) => s.checkin.streak >= 7,
  },
  {
    id: "friends_3",
    title: { zh: "同袍之誼", en: "Comrades" },
    desc: { zh: "加入 3 位好友", en: "Add 3 friends" },
    points: 600,
    tokens: 1,
    check: (_p, _g, s) => s.friends.length >= 3,
  },
  {
    id: "score_2000",
    title: { zh: "高分挑戰者", en: "High Scorer" },
    desc: { zh: "單關得分達 2,000 分", en: "Score 2,000 points in one level" },
    points: 1000,
    tokens: 3,
    check: (p) => p.bestScore >= 2000,
  },
];
