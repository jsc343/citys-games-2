import type { GameId } from "@/lib/types";

export type Team = "p" | "e" | "a";
export type Tele = "" | "high" | "low" | "shoot" | "charge";

export interface Fighter {
  id: number;
  team: Team;
  kind: string;
  style: GameId;
  x: number;
  z: number;
  h: number;
  vh: number;
  hp: number;
  mhp: number;
  dir: 1 | -1;
  speed: number;
  dmg: number;
  crouch: boolean;
  atk: number;
  atkDur: number;
  atkType: "" | "hand" | "foot" | "swing" | "shoot";
  cd: number;
  flash: number;
  inv: number;
  tele: number;
  teleType: Tele;
  teleMax: number;
  guard: number;
  walkT: number;
  dead: number;
  dash: number;
  active: boolean;
  ranged: boolean;
  scale: number;
  moving: boolean;
  glow: number;
  wlen?: number;
}

export interface Projectile {
  x: number;
  z: number;
  vx: number;
  low: boolean;
  dmg: number;
  life: number;
  friendly: boolean;
}

export interface Strike {
  x: number;
  z: number;
  t: number;
  max: number;
  r: number;
  dmg: number;
  kind: "falling" | "grenade";
}

export interface Mine {
  x: number;
  z: number;
  armed: boolean;
  boom: number;
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}
