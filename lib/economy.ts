import type { Profile } from "@/lib/state";
import type {
  Difficulty,
  GameConfig,
  ItemType,
} from "@/lib/types";

export function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday of the week containing `d`, as a date key. */
export function weekKey(d: Date = new Date()): string {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return dayKey(copy);
}

export function previousWeekKey(d: Date = new Date()): string {
  const copy = new Date(weekKey(d) + "T00:00:00");
  copy.setDate(copy.getDate() - 7);
  return dayKey(copy);
}

export function checkinReward(day: number, multiplier = 1): number {
  let base = 300;
  if (day <= 2) base = 100;
  else if (day <= 6) base = 200;
  else if (day === 7) base = 500;
  else if (day <= 13) base = 300;
  else if (day === 14) base = 1000;
  return Math.round(base * multiplier);
}

/** Share of the entry score charged as a fee the moment a fight starts. */
export const ENTRY_FEE_RATE = 1;

/** Real differences between difficulties: crowd size, elite share and hazard pace. */
export function difficultyProfile(d: Difficulty): { count: number; hazard: number; elite: number } {
  return {
    low: { count: 0.7, hazard: 0.7, elite: 0 },
    mid: { count: 1, hazard: 1, elite: 0.12 },
    high: { count: 1.5, hazard: 1.6, elite: 0.3 },
  }[d];
}

/** Battle points scale 1 : 2 : 3 across difficulties, then are halved. */
export function battlePointUnit(entry: number): number {
  return entry * 2.5;
}

export function levelRounds(level: number): number {
  if (level <= 3) return 3;
  if (level <= 7) return 4;
  return 5;
}

export function levelStrength(
  level: number,
  difficulty: Difficulty,
  optionEnemy: number,
): number {
  const base = { low: 0.2, mid: 0.6, high: 1.1 }[difficulty];
  const value = base + (level - 1) * 0.04 + optionEnemy;
  return Math.min(1.5, Math.max(0.15, value));
}

export function swapRate(
  config: GameConfig,
  from: ItemType,
  to: ItemType,
): { give: number; get: number } {
  const pa = config.shop[from].price;
  const pb = config.shop[to].price;
  if (pa >= pb) return { give: 1, get: Math.max(1, Math.floor(pa / pb)) };
  return { give: Math.ceil(pb / pa), get: 1 };
}

/** Rolls the daily/weekly counters forward when the calendar has moved on. */
export function rollCaps(profile: Profile, now: Date = new Date()): Profile {
  const day = dayKey(now);
  const week = weekKey(now);
  let caps = profile.caps;
  if (caps.day !== day) caps = { ...caps, day, dayNet: 0 };
  if (caps.week !== week) caps = { ...caps, week, weekEarned: 0, weekScore: 0 };
  return caps === profile.caps ? profile : { ...profile, caps };
}

export function isCapped(profile: Profile, config: GameConfig): boolean {
  return (
    profile.caps.dayNet >= config.caps.daily * config.caps.dailyMult ||
    profile.caps.weekEarned >= config.caps.weekly * config.caps.weeklyMult
  );
}

export interface SettleInput {
  difficulty: Difficulty;
  results: boolean[];
  firstClear: boolean;
  replay: boolean;
  choiceBonus: number;
  battle?: { gain: number; loss: number; passed: boolean };
  fee?: number;
}

export interface SettleSummary {
  passed: boolean;
  wins: number;
  rounds: number;
  roundGain: number;
  battleGain: number;
  fee: number;
  roundLoss: number;
  passReward: number;
  failPenalty: number;
  choiceBonus: number;
  net: number;
  score: number;
  capped: boolean;
  firstClear: boolean;
  replay: boolean;
}

export function settleLevel(
  profile: Profile,
  config: GameConfig,
  input: SettleInput,
): { profile: Profile; summary: SettleSummary } {
  const rolled = rollCaps(profile);
  const tuning = config.tuning[input.difficulty];
  const rounds = input.results.length;
  const wins = input.results.filter(Boolean).length;
  const losses = rounds - wins;
  const battle = input.battle;
  const fee = input.fee ?? 0;
  const passed = battle ? battle.passed : wins * 2 > rounds;
  const capped = isCapped(rolled, config);
  const mult = config.rewardMultiplier * (capped ? config.caps.overflowRate : 1);

  const roundGain = Math.round(wins * tuning.roundWin * mult);
  const battleGain = battle ? Math.round(battle.gain * mult) : 0;
  const roundLoss = battle ? battle.loss : losses * tuning.roundLoss;
  let passReward = 0;
  if (passed) {
    let factor = 1;
    if (input.replay) factor = config.welfare.replayMultiplier;
    else if (input.firstClear) factor = config.welfare.firstClearMultiplier;
    passReward = Math.round(tuning.passReward * factor * mult);
  }
  const failPenalty = passed ? 0 : Math.round((tuning.entry * tuning.failPct) / 100);
  const choiceBonus = passed && !input.replay ? input.choiceBonus : 0;

  const gains = roundGain + battleGain + passReward + choiceBonus;
  // The entry fee was already paid when the fight began.
  const net = gains - roundLoss - failPenalty;
  const nextPoints = Math.max(0, rolled.points + net);

  const score = Math.round(
    wins * tuning.roundWin + (battle ? battle.gain : 0) + (passed ? tuning.passReward : 0),
  );

  const next: Profile = {
    ...rolled,
    points: nextPoints,
    caps: {
      ...rolled.caps,
      dayNet: rolled.caps.dayNet + net,
      weekEarned: rolled.caps.weekEarned + Math.max(0, net),
      weekScore: rolled.caps.weekScore + Math.max(0, gains),
    },
  };

  return {
    profile: next,
    summary: {
      passed,
      wins,
      rounds,
      roundGain,
      battleGain,
      fee,
      roundLoss,
      passReward,
      failPenalty,
      choiceBonus,
      net: net - fee,
      score,
      capped,
      firstClear: input.firstClear,
      replay: input.replay,
    },
  };
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
