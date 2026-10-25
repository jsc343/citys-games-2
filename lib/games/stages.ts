import type { GameId, L } from "@/lib/types";
import type { MusicTheme } from "@/lib/audio";
import { levelRounds } from "@/lib/economy";

export type EnemyKind =
  | "grunt"
  | "archer"
  | "cavalry"
  | "elite"
  | "boss"
  | "gunner"
  | "grenadier"
  | "gladiator"
  | "beast";

export type Mode = "waves" | "advance" | "survive" | "boss";
export type Hazard = "none" | "falling" | "mines";
export type FarKind = "mountains" | "city" | "ships" | "dunes" | "arena" | "cliffs" | "fort" | "ruins";
export type MidKind = "tents" | "walls" | "trees" | "bunkers" | "columns" | "hedgehogs" | "boats" | "torches";
export type FxKind = "embers" | "snow" | "smoke" | "rain" | "dust" | "none";

export interface SectionDef {
  mode: Mode;
  kinds: EnemyKind[];
  count: number;
  hazard: Hazard;
  time: number;
}

export interface SceneDef {
  name: L;
  sky: [string, string, string];
  sun?: [number, number, number, string];
  far: FarKind;
  mid: MidKind;
  ground: [string, string];
  fx: FxKind;
  far_c: string;
  mid_c: string;
}

const S = (
  mode: Mode,
  kinds: EnemyKind[],
  count: number,
  hazard: Hazard = "none",
  time = 0,
): SectionDef => ({ mode, kinds, count, hazard, time });

const POOLS: Record<GameId, SectionDef[]> = {
  xiangyu: [
    S("waves", ["grunt", "grunt", "archer"], 6),
    S("advance", ["grunt", "cavalry"], 6),
    S("survive", ["grunt", "archer", "cavalry"], 0, "none", 22),
    S("waves", ["grunt", "elite"], 5, "falling"),
    S("advance", ["archer", "elite", "grunt"], 7, "falling"),
  ],
  normandy: [
    S("advance", ["gunner", "grunt"], 7, "mines"),
    S("waves", ["gunner", "gunner", "grenadier"], 6),
    S("survive", ["gunner", "grenadier", "grunt"], 0, "falling", 24),
    S("waves", ["grunt", "elite", "gunner"], 5, "mines"),
    S("advance", ["gunner", "grenadier", "elite"], 8, "falling"),
  ],
  gladiator: [
    S("waves", ["gladiator", "gladiator"], 3),
    S("survive", ["beast", "grunt"], 0, "none", 20),
    S("waves", ["gladiator", "grunt", "grunt"], 5),
    S("waves", ["elite", "gladiator"], 3),
    S("waves", ["beast", "gladiator", "elite"], 4, "falling"),
  ],
};

const DEFAULT_HAZARD: Record<GameId, Hazard> = {
  xiangyu: "falling",
  normandy: "mines",
  gladiator: "falling",
};

export const MUSIC: Record<GameId, MusicTheme> = {
  xiangyu: "war",
  normandy: "gun",
  gladiator: "brawl",
};

const SCENE_ORDER: Record<GameId, string[]> = {
  xiangyu: ["gate-dawn", "river-fire", "camp-night", "banquet", "siege", "plains", "dusk-river", "fortress", "burning", "gaixia"],
  normandy: ["landing", "beach", "seawall", "trench", "village", "hedgerow", "bunker", "crossroads", "ruins", "dawn-exit"],
  gladiator: ["sand-day", "sand-dusk", "tunnel", "arena-night", "pit-fire", "colosseum", "rain-arena", "imperial", "torch-hall", "grand-final"],
};

export const SCENES: Record<string, SceneDef> = {
  "gate-dawn": { name: { zh: "郡守府前 · 黎明", en: "Governor's Gate · Dawn" }, sky: ["#2b3a67", "#c9735b", "#f2c58a"], sun: [0.7, 0.62, 26, "#ffe2a8"], far: "city", mid: "walls", ground: ["#5a4a3a", "#3b2f25"], fx: "dust", far_c: "#4a4560", mid_c: "#6b4f3a" },
  "river-fire": { name: { zh: "漳水渡口 · 焚舟", en: "River Crossing · Burning Boats" }, sky: ["#1a1830", "#7a2a22", "#e8742e"], sun: [0.3, 0.7, 20, "#ffb066"], far: "mountains", mid: "boats", ground: ["#4d3b2e", "#2c211a"], fx: "embers", far_c: "#2d2538", mid_c: "#3a2520" },
  "camp-night": { name: { zh: "楚軍大營 · 夜", en: "Chu Camp · Night" }, sky: ["#0a1026", "#18244a", "#2b3a6c"], sun: [0.8, 0.2, 14, "#e8eefc"], far: "mountains", mid: "tents", ground: ["#2f3a2e", "#1b231b"], fx: "embers", far_c: "#141b36", mid_c: "#6a2a2a" },
  banquet: { name: { zh: "鴻門宴 · 燈火", en: "Hongmen Banquet · Lanterns" }, sky: ["#2a1620", "#5a2a30", "#a8573a"], far: "city", mid: "torches", ground: ["#4a3426", "#2a1d15"], fx: "dust", far_c: "#3a2030", mid_c: "#8a2a24" },
  siege: { name: { zh: "城下攻堅", en: "Siege of the Walls" }, sky: ["#6f8aa8", "#a9bccb", "#e0d8c0"], sun: [0.2, 0.3, 22, "#fff3d0"], far: "fort", mid: "walls", ground: ["#6e5c44", "#463a2a"], fx: "dust", far_c: "#7b8190", mid_c: "#8a7358" },
  plains: { name: { zh: "中原曠野", en: "Plains of Zhongyuan" }, sky: ["#4f7fb0", "#8fb8d6", "#e8e2c0"], sun: [0.75, 0.25, 24, "#fffbe0"], far: "mountains", mid: "trees", ground: ["#6f7b3f", "#444d26"], fx: "dust", far_c: "#6a86a0", mid_c: "#3e5a2a" },
  "dusk-river": { name: { zh: "烏江暮色", en: "Wu River · Dusk" }, sky: ["#2a2548", "#8a4a5a", "#f0a064"], sun: [0.5, 0.7, 28, "#ffc890"], far: "cliffs", mid: "boats", ground: ["#524434", "#2f261c"], fx: "smoke", far_c: "#3a3250", mid_c: "#3a2a24" },
  fortress: { name: { zh: "楚漢關隘", en: "Chu-Han Pass" }, sky: ["#38425a", "#6a7490", "#b8b4b0"], far: "fort", mid: "walls", ground: ["#5a5046", "#352e28"], fx: "smoke", far_c: "#4a5068", mid_c: "#6a6258" },
  burning: { name: { zh: "烽火連天", en: "Beacon Fires" }, sky: ["#180c10", "#5c1c14", "#e0501c"], far: "city", mid: "torches", ground: ["#3a2a22", "#20150f"], fx: "embers", far_c: "#2a1418", mid_c: "#7a2410" },
  gaixia: { name: { zh: "垓下 · 四面楚歌", en: "Gaixia · Songs of Chu" }, sky: ["#0c1224", "#27385a", "#6d86a8"], sun: [0.78, 0.22, 16, "#f4f8ff"], far: "mountains", mid: "tents", ground: ["#3a4350", "#1f252e"], fx: "snow", far_c: "#1a2440", mid_c: "#2a3350" },

  landing: { name: { zh: "登陸艇 · 衝向灘頭", en: "Landing Craft · Run for the Beach" }, sky: ["#3b4a58", "#7e8e98", "#b9c2c0"], far: "ships", mid: "boats", ground: ["#6a6a60", "#3e3e38"], fx: "smoke", far_c: "#58646c", mid_c: "#4a5254" },
  beach: { name: { zh: "奧馬哈海灘", en: "Omaha Beach" }, sky: ["#4a5a68", "#8a9aa0", "#c8c4b0"], sun: [0.25, 0.3, 18, "#f0ead0"], far: "ships", mid: "hedgehogs", ground: ["#b09c78", "#7a6a4c"], fx: "smoke", far_c: "#60707a", mid_c: "#3a3a36" },
  seawall: { name: { zh: "海堤掩體", en: "The Seawall" }, sky: ["#3c4650", "#6c7a80", "#a8aaa0"], far: "cliffs", mid: "bunkers", ground: ["#8a7a5a", "#54482e"], fx: "smoke", far_c: "#4a5458", mid_c: "#6a6a62" },
  trench: { name: { zh: "壕溝突破", en: "Trench Breakthrough" }, sky: ["#2e3830", "#586458", "#8a9078"], far: "ruins", mid: "bunkers", ground: ["#4a4030", "#2a2418"], fx: "smoke", far_c: "#3a443c", mid_c: "#554a38" },
  village: { name: { zh: "諾曼第村落", en: "Norman Village" }, sky: ["#4a6078", "#8aa0b0", "#d8cfa8"], sun: [0.7, 0.28, 20, "#fff4d0"], far: "ruins", mid: "walls", ground: ["#6a6044", "#403a28"], fx: "dust", far_c: "#6a7a84", mid_c: "#8a7a5a" },
  hedgerow: { name: { zh: "樹籬戰場", en: "Hedgerow Country" }, sky: ["#4c6a58", "#86a890", "#d0d8b0"], far: "mountains", mid: "trees", ground: ["#4f6a2e", "#2c3d18"], fx: "dust", far_c: "#587060", mid_c: "#2e4a22" },
  bunker: { name: { zh: "德軍碉堡", en: "German Bunker" }, sky: ["#2a3038", "#4c545c", "#7c8078"], far: "fort", mid: "bunkers", ground: ["#505048", "#2c2c28"], fx: "smoke", far_c: "#3c444a", mid_c: "#60625a" },
  crossroads: { name: { zh: "十字路口", en: "The Crossroads" }, sky: ["#5a4a50", "#a07860", "#e8c890"], sun: [0.2, 0.55, 22, "#ffd8a0"], far: "ruins", mid: "walls", ground: ["#6a5a44", "#403626"], fx: "dust", far_c: "#6a5058", mid_c: "#7a6048" },
  ruins: { name: { zh: "斷垣殘壁", en: "Shattered Ruins" }, sky: ["#202428", "#403c3c", "#78604c"], far: "ruins", mid: "walls", ground: ["#403a34", "#221f1b"], fx: "embers", far_c: "#2c2e30", mid_c: "#4c443c" },
  "dawn-exit": { name: { zh: "黎明突圍", en: "Dawn Breakout" }, sky: ["#365a8c", "#e0907a", "#ffe0a0"], sun: [0.6, 0.62, 30, "#fff0c0"], far: "mountains", mid: "trees", ground: ["#6a7438", "#3c4420"], fx: "dust", far_c: "#6a7898", mid_c: "#3a5028" },

  "sand-day": { name: { zh: "競技場 · 烈日", en: "Arena · Blazing Sun" }, sky: ["#5c9ad0", "#a8d0e8", "#f4ecd0"], sun: [0.5, 0.18, 26, "#fffbe8"], far: "arena", mid: "columns", ground: ["#d8b878", "#a8844c"], fx: "dust", far_c: "#c8aa78", mid_c: "#e8d8b0" },
  "sand-dusk": { name: { zh: "競技場 · 黃昏", en: "Arena · Dusk" }, sky: ["#3a2a5c", "#c0605a", "#f8b068"], sun: [0.25, 0.6, 28, "#ffd088"], far: "arena", mid: "columns", ground: ["#c0985c", "#8a6a3c"], fx: "dust", far_c: "#7a5058", mid_c: "#c8a888" },
  tunnel: { name: { zh: "地下囚道", en: "Underground Passage" }, sky: ["#0c0a0c", "#1c1618", "#2c2224"], far: "ruins", mid: "torches", ground: ["#3a322c", "#1c1814"], fx: "smoke", far_c: "#161214", mid_c: "#e87a2a" },
  "arena-night": { name: { zh: "競技場 · 火炬夜戰", en: "Arena · Torchlit Night" }, sky: ["#0a0c1c", "#14183a", "#242c58"], sun: [0.85, 0.15, 12, "#e8ecff"], far: "arena", mid: "torches", ground: ["#9a7a4c", "#5e4828"], fx: "embers", far_c: "#161a38", mid_c: "#e8782a" },
  "pit-fire": { name: { zh: "烈焰鬥獸坑", en: "Pit of Flames" }, sky: ["#180808", "#5a1a10", "#d8501c"], far: "arena", mid: "torches", ground: ["#5a3a24", "#2c1a10"], fx: "embers", far_c: "#2c1010", mid_c: "#f08030" },
  colosseum: { name: { zh: "羅馬競技場 · 萬眾歡呼", en: "Colosseum · The Crowd Roars" }, sky: ["#3c7ac0", "#88b8e0", "#f0e4c4"], sun: [0.8, 0.2, 24, "#fff8dc"], far: "arena", mid: "columns", ground: ["#d0a868", "#9a7440"], fx: "dust", far_c: "#b89870", mid_c: "#e8dcc0" },
  "rain-arena": { name: { zh: "雨中決鬥", en: "Duel in the Rain" }, sky: ["#2c3640", "#4c5a64", "#78868c"], far: "arena", mid: "columns", ground: ["#7a6a50", "#4a3e2c"], fx: "rain", far_c: "#3a464e", mid_c: "#98948a" },
  imperial: { name: { zh: "皇帝觀禮台", en: "The Imperial Box" }, sky: ["#4a3068", "#a0587a", "#f0b878"], sun: [0.5, 0.5, 26, "#ffe4a8"], far: "arena", mid: "columns", ground: ["#c09c60", "#8a6c38"], fx: "dust", far_c: "#6a4668", mid_c: "#e0c8a0" },
  "torch-hall": { name: { zh: "火炬長廊", en: "Hall of Torches" }, sky: ["#100c14", "#241a28", "#3c2a34"], far: "ruins", mid: "torches", ground: ["#4a3a30", "#251c16"], fx: "embers", far_c: "#1c1420", mid_c: "#f09030" },
  "grand-final": { name: { zh: "終極之戰", en: "The Grand Final" }, sky: ["#1a1030", "#6a2848", "#f09848"], sun: [0.5, 0.45, 34, "#fff0c8"], far: "arena", mid: "columns", ground: ["#d4ac6c", "#94703c"], fx: "embers", far_c: "#5a2a48", mid_c: "#f0dcb4" },
};

export type Tactic = "bold" | "careful" | "even";

export interface StagePlan {
  sceneId: string;
  scene: SceneDef;
  music: MusicTheme;
  sections: SectionDef[];
  tactic: Tactic;
}

export function tacticFor(optionEnemy: number): Tactic {
  if (optionEnemy > 0.02) return "bold";
  if (optionEnemy < -0.02) return "careful";
  return "even";
}

export const TACTIC_TEXT: Record<Tactic, L> = {
  bold: {
    zh: "強攻路線：敵兵更多、更密集，沒有埋伏，正面硬碰。",
    en: "Bold route: more enemies, no ambushes, a head-on clash.",
  },
  careful: {
    zh: "謹慎路線：敵兵較少，但沿途布有埋伏與陷阱，要注意腳下與頭頂。",
    en: "Careful route: fewer enemies, but ambushes and traps line the way. Watch above and below.",
  },
  even: {
    zh: "均衡路線：敵人與埋伏皆按常態出現。",
    en: "Balanced route: a standard mix of enemies and ambushes.",
  },
};

export function buildPlan(game: GameId, level: number, optionEnemy: number): StagePlan {
  const tactic = tacticFor(optionEnemy);
  const pool = POOLS[game];
  const n = levelRounds(level);
  const offset = game === "xiangyu" ? 0 : game === "normandy" ? 2 : 4;
  const sections: SectionDef[] = [];
  for (let i = 0; i < n - 1; i++) {
    let idx = (level * 2 + i * 3 + offset) % pool.length;
    if (i === 0 && pool[idx].mode === "survive") idx = (idx + 1) % pool.length;
    const base = pool[idx];
    const scale = (1 + level * 0.06) * (tactic === "bold" ? 1.3 : tactic === "careful" ? 0.85 : 1);
    let hazard = base.hazard;
    if (tactic === "bold") hazard = "none";
    if (tactic === "careful" && hazard === "none") hazard = DEFAULT_HAZARD[game];
    sections.push({
      ...base,
      count: base.mode === "survive" ? 0 : Math.max(2, Math.round(base.count * scale)),
      time: base.mode === "survive" ? base.time + Math.min(10, level) : 0,
      hazard,
    });
  }
  sections.push(S("boss", ["boss"], 1, tactic === "careful" ? DEFAULT_HAZARD[game] : "none"));
  const sceneId = SCENE_ORDER[game][(level - 1) % 10];
  return { sceneId, scene: SCENES[sceneId], music: MUSIC[game], sections, tactic };
}

export const MODE_TEXT: Record<Mode, { title: L; goal: L }> = {
  waves: {
    title: { zh: "殲滅戰", en: "Annihilation" },
    goal: { zh: "擊潰所有來襲敵人", en: "Defeat every enemy that charges you" },
  },
  advance: {
    title: { zh: "突破戰", en: "Breakthrough" },
    goal: { zh: "一路殺出，抵達右側旗標", en: "Fight through and reach the flag on the right" },
  },
  survive: {
    title: { zh: "堅守戰", en: "Hold the Line" },
    goal: { zh: "撐到時間結束", en: "Survive until the timer runs out" },
  },
  boss: {
    title: { zh: "首領決戰", en: "Showdown" },
    goal: { zh: "擊倒敵方首領", en: "Bring down the enemy commander" },
  },
};
