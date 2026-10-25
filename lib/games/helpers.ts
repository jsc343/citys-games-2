import type { ItemType } from "@/lib/types";
import type { Level, LevelOption } from "@/lib/games/types";

type Pair = [string, string];

export function opt(
  text: Pair,
  hint: Pair,
  enemy: number,
  align: number,
  pts = 0,
  item?: ItemType,
): LevelOption {
  return {
    text: { zh: text[0], en: text[1] },
    hint: { zh: hint[0], en: hint[1] },
    enemy,
    align,
    pts,
    item,
  };
}

export function lv(
  title: Pair,
  intro: Pair,
  enemy: Pair,
  prompt: Pair,
  options: LevelOption[],
): Level {
  return {
    title: { zh: title[0], en: title[1] },
    intro: { zh: intro[0], en: intro[1] },
    enemy: { zh: enemy[0], en: enemy[1] },
    prompt: { zh: prompt[0], en: prompt[1] },
    options,
  };
}
