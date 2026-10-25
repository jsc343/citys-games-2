import type { GameConfig } from "@/lib/types";

export const DEFAULT_CONFIG: GameConfig = {
  tuning: {
  low: { entry: 100, failPct: 5, roundWin: 5, roundLoss: 3, passReward: 150 },
  mid: { entry: 200, failPct: 10, roundWin: 10, roundLoss: 6, passReward: 300 },
  high: { entry: 300, failPct: 20, roundWin: 15, roundLoss: 9, passReward: 450 },
  },
  rewardMultiplier: 1,
  welfare: {
    startBonus: 10000,
    dailyGrantActive: true,
    dailyGrantAmount: 10000,
    checkinMultiplier: 1,
    inviterBonus: 2000,
    inviteeBonus: 5000,
    inviteMonthlyCap: 10,
    firstClearMultiplier: 1.5,
    replayMultiplier: 0.3,
    endingBonus: 1000,
  },
  caps: {
    daily: 12000,
    weekly: 60000,
    dailyMult: 1,
    weeklyMult: 1,
    overflowRate: 0.2,
  },
  social: { dailyGiftLimit: 3 },
  shop: {
    weapon: { price: 800, buyback: 400, active: true },
    energy: { price: 500, buyback: 250, active: true },
    wisdom: { price: 1200, buyback: 600, active: true },
    help: { price: 1500, buyback: 750, active: true },
    chance: { price: 3000, buyback: 1500, active: true },
  },
  games: {
    xiangyu: { enabled: true },
    normandy: { enabled: true },
    gladiator: { enabled: true },
  },
  piExchange: {
    pointsPerPi: 10000,
    pointsPerToken: 100,
    walletAddress: "GCTNAT52AHWOYLJCEZYC6XHQTHK2ZUZ5I26PGQ7NKRCROXMMOEM5ERJM",
    memoHint: "",
  },
  leaderboardRewards: [
    { from: 1, to: 1, points: 5000, tokens: 10 },
    { from: 2, to: 3, points: 3000, tokens: 0 },
    { from: 4, to: 10, points: 1500, tokens: 0 },
    { from: 11, to: 50, points: 500, tokens: 0 },
  ],
  events: [],
};
