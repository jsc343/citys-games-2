import type { GameId, ItemType, L } from "@/lib/types";

export interface WeaponDef {
  id: string;
  name: L;
  note: L;
  unlock: number;
  dmg: number;
  cd: number;
  reach: number;
  targets: number;
  ranged: boolean;
  range: number;
  len: number;
}

const W = (
  id: string,
  zh: string,
  en: string,
  noteZh: string,
  noteEn: string,
  unlock: number,
  dmg: number,
  cd: number,
  o: Partial<Pick<WeaponDef, "reach" | "targets" | "ranged" | "range" | "len">> = {},
): WeaponDef => ({
  id,
  name: { zh, en },
  note: { zh: noteZh, en: noteEn },
  unlock,
  dmg,
  cd,
  reach: o.reach ?? 38,
  targets: o.targets ?? 1,
  ranged: o.ranged ?? false,
  range: o.range ?? 0,
  len: o.len ?? 26,
});

export const WEAPONS: Record<GameId, WeaponDef[]> = {
  xiangyu: [
    W("sword", "楚劍", "Chu Sword", "平衡的近戰，可同時斬中兩人。", "Balanced. Cuts two foes at once.", 1, 1, 0.3, { reach: 44, targets: 2, len: 28 }),
    W("halberd", "畫戟", "Halberd", "範圍寬、威力大，但揮動較慢。", "Wide and heavy, but slow to swing.", 3, 1.5, 0.5, { reach: 58, targets: 3, len: 38 }),
    W("spear", "長矛", "Spear", "攻擊距離最長，適合牽制騎兵。", "Longest reach. Keeps cavalry at bay.", 5, 1.2, 0.38, { reach: 72, len: 46 }),
    W("bow", "強弓", "War Bow", "遠距離射擊，威力略低。", "Ranged shots with lighter damage.", 7, 0.9, 0.45, { ranged: true, range: 300 }),
  ],
  normandy: [
    W("rifle", "步槍", "Rifle", "穩定的中距離射擊。", "Steady mid-range fire.", 1, 1, 0.3, { ranged: true, range: 330 }),
    W("smg", "衝鋒槍", "SMG", "射速極快，單發威力低。", "Very fast fire, weak per shot.", 3, 0.55, 0.12, { ranged: true, range: 250 }),
    W("shotgun", "霰彈槍", "Shotgun", "近距離重擊，可打中兩人，裝填慢。", "Heavy close range, hits two, slow reload.", 5, 2.2, 0.75, { ranged: true, range: 150, targets: 2 }),
    W("marksman", "狙擊步槍", "Marksman Rifle", "超遠距離，一發重擊。", "Extreme range, one heavy shot.", 7, 2, 0.6, { ranged: true, range: 430 }),
  ],
  gladiator: [
    W("boxer", "拳擊架式", "Boxing Stance", "徒手快拳，連擊最流暢。", "Bare-fisted. The smoothest combos.", 1, 1, 0.3, { reach: 36, len: 0 }),
    W("wrestler", "摔角架式", "Wrestling Stance", "貼身重擊，威力大但出手慢。", "Close and heavy, but slower.", 3, 1.5, 0.5, { reach: 30, len: 0 }),
    W("kickboxer", "踢拳架式", "Kickboxing Stance", "拳腳並用，攻擊距離較長。", "Hands and legs together. Longer reach.", 5, 1.2, 0.36, { reach: 48, len: 0 }),
    W("heavy", "重拳架式", "Heavy-Hitter Stance", "蓄力重拳，一擊撼動對手。", "Crushing punches that rock the foe.", 7, 1.9, 0.56, { reach: 38, len: 0 }),
  ],
};

export interface GearDef {
  id: string;
  name: L;
  note: L;
  unlock: number;
  hp?: number;
  def?: number;
  hand?: number;
  foot?: number;
  spd?: number;
}

export const GLADIATOR_GEAR: GearDef[] = [
  { id: "helmet", name: { zh: "青銅頭盔", en: "Bronze Helmet" }, note: { zh: "體力上限 +10", en: "Max HP +10" }, unlock: 1, hp: 10 },
  { id: "gloves", name: { zh: "競技拳套", en: "Arena Gloves" }, note: { zh: "手攻擊威力 +10%", en: "Hand attacks +10%" }, unlock: 1, hand: 0.1 },
  { id: "tunic", name: { zh: "皮革護服", en: "Leather Tunic" }, note: { zh: "受傷減少 5%", en: "Damage taken -5%" }, unlock: 2, def: 0.05 },
  { id: "mask", name: { zh: "護面面罩", en: "Face Mask" }, note: { zh: "受傷減少 5%", en: "Damage taken -5%" }, unlock: 3, def: 0.05 },
  { id: "kneepads", name: { zh: "護膝", en: "Knee Pads" }, note: { zh: "足攻擊威力 +15%", en: "Foot attacks +15%" }, unlock: 4, foot: 0.15 },
  { id: "boots", name: { zh: "競技軟靴", en: "Arena Boots" }, note: { zh: "移動速度 +8%", en: "Move speed +8%" }, unlock: 5, spd: 0.08 },
  { id: "guards", name: { zh: "前臂護甲", en: "Forearm Guards" }, note: { zh: "受傷減少 5%", en: "Damage taken -5%" }, unlock: 6, def: 0.05 },
  { id: "wraps", name: { zh: "強化指套", en: "Reinforced Wraps" }, note: { zh: "手攻擊威力 +10%", en: "Hand attacks +10%" }, unlock: 7, hand: 0.1 },
  { id: "greaves", name: { zh: "脛甲", en: "Shin Greaves" }, note: { zh: "體力上限 +15", en: "Max HP +15" }, unlock: 8, hp: 15 },
  { id: "belt", name: { zh: "冠軍腰帶", en: "Champion's Belt" }, note: { zh: "體力上限 +10，受傷減少 5%", en: "Max HP +10, damage -5%" }, unlock: 9, hp: 10, def: 0.05 },
];

export interface GearStats {
  hp: number;
  def: number;
  hand: number;
  foot: number;
  spd: number;
}

export function gearStats(level: number): GearStats {
  const s: GearStats = { hp: 0, def: 0, hand: 0, foot: 0, spd: 0 };
  GLADIATOR_GEAR.filter((g) => g.unlock <= level).forEach((g) => {
    s.hp += g.hp ?? 0;
    s.def += g.def ?? 0;
    s.hand += g.hand ?? 0;
    s.foot += g.foot ?? 0;
    s.spd += g.spd ?? 0;
  });
  return s;
}

export function itemName(game: GameId, type: ItemType, base: L): L {
  if (game === "gladiator" && type === "weapon") return { zh: "護具類", en: "Protective gear" };
  return base;
}

export function weaponsFor(game: GameId, level: number): WeaponDef[] {
  return WEAPONS[game].filter((w) => w.unlock <= level);
}

export interface DropRule {
  who: L;
  kinds: string[];
  item: ItemType;
  chance: number;
}

const GENERIC: DropRule[] = [
  { who: { zh: "一般士兵", en: "Regular soldiers" }, kinds: ["grunt", "gladiator"], item: "energy", chance: 0.06 },
  { who: { zh: "遠程射手", en: "Archers and gunners" }, kinds: ["archer", "gunner"], item: "weapon", chance: 0.06 },
  { who: { zh: "衝鋒兵與猛獸", en: "Chargers and beasts" }, kinds: ["cavalry", "grenadier", "beast"], item: "weapon", chance: 0.1 },
  { who: { zh: "精銳將領", en: "Elite officers" }, kinds: ["elite"], item: "energy", chance: 0.3 },
  { who: { zh: "精銳將領", en: "Elite officers" }, kinds: ["elite"], item: "help", chance: 0.14 },
];

export const KILL_DROPS: Record<GameId, DropRule[]> = {
  xiangyu: GENERIC,
  normandy: GENERIC,
  gladiator: [
    { who: { zh: "競技場鬥士", en: "Arena fighters" }, kinds: ["grunt", "gladiator"], item: "weapon", chance: 0.08 },
    { who: { zh: "競技場鬥士", en: "Arena fighters" }, kinds: ["grunt", "gladiator"], item: "energy", chance: 0.05 },
    { who: { zh: "猛獸", en: "Beasts" }, kinds: ["beast"], item: "weapon", chance: 0.12 },
    { who: { zh: "精銳鬥士", en: "Elite champions" }, kinds: ["elite"], item: "energy", chance: 0.3 },
    { who: { zh: "精銳鬥士", en: "Elite champions" }, kinds: ["elite"], item: "help", chance: 0.14 },
  ],
};

export const BOSS_DROP: Record<number, ItemType> = {
  1: "energy",
  2: "weapon",
  3: "energy",
  4: "wisdom",
  5: "help",
  6: "weapon",
  7: "wisdom",
  8: "help",
  9: "energy",
  10: "chance",
};

export const BOSS_BONUS_CHANCE = 0.15;
export const MAX_DROPS_PER_BATTLE = 3;

export function dropsFor(game: GameId, kind: string, level: number): ItemType[] {
  if (kind === "boss") {
    const list: ItemType[] = [BOSS_DROP[level] ?? "energy"];
    if (Math.random() < BOSS_BONUS_CHANCE) list.push("chance");
    return list;
  }
  const out: ItemType[] = [];
  KILL_DROPS[game].forEach((r) => {
    if (r.kinds.includes(kind) && Math.random() < r.chance) out.push(r.item);
  });
  return out.slice(0, 1);
}
