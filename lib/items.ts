import type { ItemType, L } from "@/lib/types";

export const ITEM_META: Record<
  ItemType,
  { name: L; effect: L; usage: L }
> = {
  weapon: {
    name: { zh: "武器類", en: "Weapons" },
    effect: {
zh: "戰鬥中提升攻擊或射擊威力；肉搏戰中為護具強化，同時減少受傷。",
  en: "Boosts attack or shooting power in battle. In the arena it is protective gear: more power and less damage taken.",
    },
    usage: { zh: "戰鬥階段使用", en: "Use during battle" },
  },
  energy: {
    name: { zh: "能量類", en: "Energy" },
    effect: {
      zh: "回復或延長體力、耐力。",
      en: "Restores or extends your stamina.",
    },
    usage: { zh: "戰鬥階段使用", en: "Use during battle" },
  },
  wisdom: {
    name: { zh: "智慧類", en: "Wisdom" },
    effect: {
      zh: "在抉擇階段顯示各選項的後果提示。",
      en: "Reveals the consequences of each choice.",
    },
    usage: { zh: "抉擇階段使用", en: "Use at the choice" },
  },
  help: {
    name: { zh: "幫助類", en: "Allies" },
    effect: {
      zh: "呼叫援軍或隊友支援一次，直接贏下當前小節。",
      en: "Call allies once to win the current round outright.",
    },
    usage: { zh: "戰鬥階段使用", en: "Use during battle" },
  },
  chance: {
    name: { zh: "機會類", en: "Chances" },
    effect: {
      zh: "重新選擇一次抉擇，或重試一次失敗的關卡。",
      en: "Redo a choice once, or retry a failed level once.",
    },
    usage: { zh: "抉擇或失敗後使用", en: "Use at choice or after defeat" },
  },
};
