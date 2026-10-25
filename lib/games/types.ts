import type { GameId, ItemType, L } from "@/lib/types";

export interface LevelOption {
  text: L;
  hint: L;
  /** Added to enemy strength. Negative makes the fight easier. */
  enemy: number;
  /** Story alignment contribution used to pick the ending. */
  align: number;
  /** Negative = cost paid when you commit, positive = bonus on first clear. */
  pts: number;
  item?: ItemType;
}

export interface Level {
  title: L;
  intro: L;
  enemy: L;
  prompt: L;
  options: LevelOption[];
}

export interface Ending {
  id: string;
  title: L;
  text: L;
  /** Minimum total alignment needed. Endings are checked from the top. */
  min: number;
}

export type GameCategory = "war" | "gun" | "brawl";

export interface GameDef {
  id: GameId;
  category: GameCategory;
  accent: "destructive" | "accent" | "primary";
  title: L;
  subtitle: L;
  blurb: L;
  levels: Level[];
  endings: Ending[];
}
