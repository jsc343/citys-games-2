"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Lock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/page-header";
import { WealthStrip } from "@/components/wealth-strip";
import { useGame } from "@/contexts/game-context";
import { GAMES } from "@/lib/games";
import { DIFFICULTIES, GAME_IDS, type Difficulty } from "@/lib/types";

export default function GameLevelsPage() {
  const params = useParams<{ game: string }>();
  const { tr, pick, progress, profile, config, setSettings } = useGame();
  const id = GAME_IDS.find((g) => g === params.game);

  if (!id) {
    return (
      <>
        <PageHeader title={tr("找不到遊戲", "Game not found")} />
        <PageBody>
          <Button asChild>
            <Link href="/lobby">{tr("回到大廳", "Back to lobby")}</Link>
          </Button>
        </PageBody>
      </>
    );
  }

  const def = GAMES[id];
  const gp = progress[id];
  const enabled = config.games[id].enabled;
  const labels: Record<Difficulty, string> = {
    low: tr("低", "Low"),
    mid: tr("中", "Mid"),
    high: tr("高", "High"),
  };

  return (
    <>
      <PageHeader title={pick(def.title)} />
      <PageBody>
        <WealthStrip />
        <p className="leading-relaxed text-pretty">{pick(def.blurb)}</p>

        <section className="flex flex-col gap-2" aria-label={tr("難度", "Difficulty")}>
          <h2 className="text-sm font-bold text-muted-foreground">{tr("難度", "Difficulty")}</h2>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {DIFFICULTIES.map((d) => (
              <Button
                key={d}
                role="radio"
                aria-checked={profile.settings.difficulty === d}
                variant={profile.settings.difficulty === d ? "default" : "secondary"}
                onClick={() => setSettings({ difficulty: d })}
                className="h-auto flex-col gap-0.5 py-2"
              >
                <span className="font-black">{labels[d]}</span>
                <span className="text-[11px] font-normal opacity-80">
                  {tr("進場", "Entry")} {config.tuning[d].entry.toLocaleString()}
                </span>
                <span className="text-[11px] font-normal opacity-80">
                  {tr("已過", "Cleared")} {gp.byDiff[d].cleared.length}/{def.levels.length}
                </span>
              </Button>
            ))}
          </div>
        </section>

        {!enabled && (
          <p className="rounded-lg border border-border bg-card p-3 text-sm">
            {tr("此遊戲目前維護中。", "This game is under maintenance.")}
          </p>
        )}

        <section className="flex flex-col gap-2" aria-label={tr("關卡", "Levels")}>
          <h2 className="text-sm font-bold text-muted-foreground">
            {tr("關卡", "Levels")} · {labels[profile.settings.difficulty]}
          </h2>
          <ol className="flex flex-col gap-2">
            {def.levels.map((lv, i) => {
              const n = i + 1;
              const dp = gp.byDiff[profile.settings.difficulty];
              const cleared = dp.cleared.includes(n);
              const locked = n > 1 && !dp.cleared.includes(n - 1);
              const best = dp.best[n];
              const body = (
                <>
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                      cleared ? "bg-primary text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    {cleared ? <Check className="size-4" aria-hidden="true" /> : n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{pick(lv.title)}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {locked
                        ? tr("尚未解鎖", "Locked")
                        : best
                          ? `${tr("最佳", "Best")} ${best.toLocaleString()}`
                          : pick(lv.enemy)}
                    </span>
                  </span>
                  {locked ? (
                    <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <Play className="size-4 text-primary" aria-hidden="true" />
                  )}
                </>
              );
              return (
                <li key={n}>
                  {locked || !enabled ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 opacity-60">
                      {body}
                    </div>
                  ) : (
                    <Link
                      href={`/games/${id}/play/${n}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary"
                    >
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="flex flex-col gap-2" aria-label={tr("結局", "Endings")}>
          <h2 className="text-sm font-bold text-muted-foreground">
            {tr("已解鎖結局", "Endings unlocked")} {gp.endings.length}/{def.endings.length}
          </h2>
          <ul className="flex flex-col gap-2">
            {def.endings.map((e) => {
              const got = gp.endings.includes(e.id);
              return (
                <li key={e.id} className="rounded-lg border border-border bg-card p-3">
                  {got ? (
                    <>
                      <p className="font-black text-primary">{pick(e.title)}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{pick(e.text)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{tr("尚未解鎖的結局", "A locked ending")}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </PageBody>
    </>
  );
}
