"use client";

import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { useGame } from "@/contexts/game-context";
import { CATEGORIES, GAMES, TOTAL_SLOTS } from "@/lib/games";

const ACCENT_BORDER = {
  destructive: "border-destructive/60",
  accent: "border-accent/60",
  primary: "border-primary/60",
} as const;

const ACCENT_TEXT = {
  destructive: "text-destructive",
  accent: "text-accent",
  primary: "text-primary",
} as const;

export function GameAreas() {
  const { tr, pick, progress, config } = useGame();
  return (
    <div className="flex flex-col gap-6">
      {CATEGORIES.map((cat) => {
        const def = GAMES[cat.game];
        const gp = progress[cat.game];
        const enabled = config.games[cat.game].enabled;
        return (
          <section key={cat.id} className="flex flex-col gap-2" aria-label={pick(cat.title)}>
            <h2 className="text-lg font-black">{pick(cat.title)}</h2>
            {enabled ? (
              <Link
                href={`/games/${cat.game}`}
                className={`scanlines relative flex items-center gap-3 overflow-hidden rounded-xl border bg-gradient-to-br from-secondary to-card p-4 transition-colors hover:bg-secondary ${ACCENT_BORDER[def.accent]}`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold ${ACCENT_TEXT[def.accent]}`}>{pick(def.subtitle)}</p>
                  <p className="font-display truncate text-xl font-black">{pick(def.title)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tr("進度", "Progress")} {gp.cleared.length}/{def.levels.length} · {tr("結局", "Endings")}{" "}
                    {gp.endings.length}/{def.endings.length}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-muted-foreground">
                <Lock className="size-5" aria-hidden="true" />
                <span>{pick(def.title)} · {tr("維護中", "Under maintenance")}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: TOTAL_SLOTS - 1 }).map((_, i) => (
                <div
                  key={i}
                  className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border bg-card/40 px-1 text-center text-xs text-muted-foreground"
                >
                  {tr("敬請期待", "Coming soon")}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
