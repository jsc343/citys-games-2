import type { GameId, L } from "@/lib/types";
import type { Progress } from "@/lib/state";
import type { Ending, GameCategory, GameDef } from "@/lib/games/types";
import { XIANGYU } from "@/lib/games/xiangyu";
import { NORMANDY } from "@/lib/games/normandy";
import { GLADIATOR } from "@/lib/games/gladiator";

export const GAMES: Record<GameId, GameDef> = {
  xiangyu: XIANGYU,
  normandy: NORMANDY,
  gladiator: GLADIATOR,
};

export const CATEGORIES: { id: GameCategory; game: GameId; title: L }[] = [
  { id: "war", game: "xiangyu", title: { zh: "古代戰爭類", en: "Ancient War" } },
  { id: "gun", game: "normandy", title: { zh: "時代槍戰類", en: "Era Gunfight" } },
  { id: "brawl", game: "gladiator", title: { zh: "肉搏格鬥類", en: "Hand-to-Hand Combat" } },
];

export const TOTAL_SLOTS = 10;

export function totalAlignment(game: GameId, progress: Progress): number {
  const def = GAMES[game];
  const choices = progress[game].choices;
  let total = 0;
  for (const [level, idx] of Object.entries(choices)) {
    const opt = def.levels[Number(level) - 1]?.options[idx];
    if (opt) total += opt.align;
  }
  return total;
}

export function pickEnding(game: GameId, align: number): Ending {
  const endings = GAMES[game].endings;
  return endings.find((e) => align >= e.min) ?? endings[endings.length - 1];
}
