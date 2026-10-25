"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, Volume2, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/page-header";
import { WealthStrip } from "@/components/wealth-strip";
import { ItemIcon } from "@/components/item-icon";
import { BeatEngine, type BattleResult, type Scoring } from "@/components/arcade/beat-engine";
import { useGame, type FinishSummary } from "@/contexts/game-context";
import { GAMES } from "@/lib/games";
import { buildPlan, MODE_TEXT, TACTIC_TEXT } from "@/lib/games/stages";
import { ITEM_META } from "@/lib/items";
import { BOSS_BONUS_CHANCE, BOSS_DROP, GLADIATOR_GEAR, gearStats, itemName, KILL_DROPS, MAX_DROPS_PER_BATTLE, weaponsFor, WEAPONS } from "@/lib/games/loadout";
import { ENTRY_FEE_RATE, battlePointUnit, difficultyProfile, isCapped, levelStrength } from "@/lib/economy";
import { playSfx, startMusic, stopMusic } from "@/lib/audio";
import { speechLang } from "@/lib/languages";
import type { GameId } from "@/lib/types";

type Phase = "intro" | "choice" | "ready" | "battle" | "result";

const ACCENT_TEXT = {
  destructive: "text-destructive",
  accent: "text-accent",
  primary: "text-primary",
} as const;

export function LevelPlayer({ gameId, level }: { gameId: GameId; level: number }) {
  const [runKey, setRunKey] = useState(0);
  return (
    <LevelRun
      key={`${gameId}-${level}-${runKey}`}
      gameId={gameId}
      level={level}
      onReplay={() => setRunKey((k) => k + 1)}
    />
  );
}

function LevelRun({
  gameId,
  level,
  onReplay,
}: {
  gameId: GameId;
  level: number;
  onReplay: () => void;
}) {
  const game = useGame();
  const { tr, pick, profile, progress, config, consumeItem, grantItem, spendPoints, refundPoints, finishLevel } = game;
  const def = GAMES[gameId];
  const lv = def?.levels[level - 1];
  const backHref = `/games/${gameId}`;

  const [phase, setPhase] = useState<Phase>("intro");
  const [selected, setSelected] = useState<number | null>(null);
  const [optionIdx, setOptionIdx] = useState(0);
  const [hints, setHints] = useState(false);
  const [choiceRedone, setChoiceRedone] = useState(false);
  const [feePaid, setFeePaid] = useState(0);
  const [summary, setSummary] = useState<FinishSummary | null>(null);
  const [stats, setStats] = useState<{ kills: number; maxCombo: number }>({ kills: 0, maxCombo: 0 });
  const finalized = useRef(false);

  const difficulty = profile.settings.difficulty;
  const tuning = config.tuning[difficulty];
  const option = lv?.options[optionIdx];
  const strength = levelStrength(level, difficulty, option?.enemy ?? 0);
  const plan = useMemo(() => buildPlan(gameId, level, option?.enemy ?? 0), [gameId, level, option?.enemy]);
  const fee = Math.round(tuning.entry * ENTRY_FEE_RATE);

  useEffect(() => {
    startMusic(profile.settings.music, phase === "battle" ? plan.music : "calm");
    return () => stopMusic();
  }, [profile.settings.music, phase, plan.music]);

  const speak = useCallback(
    (text: string) => {
      if (!profile.settings.voice || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = speechLang(game.lang);
      window.speechSynthesis.speak(u);
    },
    [profile.settings.voice, game.lang],
  );

  useEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  if (!def || !lv || level < 1) {
    return (
      <>
        <PageHeader title={tr("找不到關卡", "Level not found")} backHref="/lobby" />
        <PageBody>
          <Button asChild>
            <Link href="/lobby">{tr("回到大廳", "Back to lobby")}</Link>
          </Button>
        </PageBody>
      </>
    );
  }

  const gp = progress[gameId];
  const locked = level > 1 && !gp.byDiff[difficulty].cleared.includes(level - 1);
  const disabled = !config.games[gameId].enabled;
  const title = `${pick(def.title)} · ${tr("第", "Lv ")}${level}${tr("關", "")}`;

  if (locked || disabled) {
    return (
      <>
        <PageHeader title={title} backHref={backHref} />
        <PageBody>
          <p className="rounded-lg border border-border bg-card p-4 text-sm">
            {disabled
              ? tr("此遊戲目前維護中，請稍後再來。", "This game is under maintenance. Please come back later.")
              : tr("請先通過上一關。", "Clear the previous level first.")}
          </p>
          <Button asChild>
            <Link href={backHref}>{tr("返回關卡列表", "Back to levels")}</Link>
          </Button>
        </PageBody>
      </>
    );
  }

  const E = battlePointUnit(tuning.entry);
  const scoring: Scoring = {
    hit: E * 0.001,
    whiff: E * 0.002,
    hurt: E * 0.01,
    grunt: E * 0.006,
    elite: E * 0.02,
    boss: E * 0.08,
    ally: E * 0.02,
  };

  const onBattleFinish = (r: BattleResult) => {
    if (finalized.current) return;
    finalized.current = true;
    setStats({ kills: r.kills, maxCombo: r.maxCombo });
    const s = finishLevel({
      game: gameId,
      level,
      results: r.sections,
      optionIdx,
      difficulty,
      battle: { gain: r.gain, loss: r.loss, passed: r.passed },
      fee: feePaid,
    });
    setSummary(s);
    setPhase("result");
    playSfx(s.passed ? "win" : "lose", profile.settings.sfx);
  };

  const commitChoice = () => {
    if (selected === null) return;
    const opt = lv.options[selected];
    if (opt.pts < 0 && !spendPoints(-opt.pts)) {
      toast.error(tr("積分不足，無法選擇此項", "Not enough points for this option"));
      return;
    }
    setOptionIdx(selected);
    setPhase("ready");
  };

  const redoChoice = () => {
    if (!consumeItem("chance")) return;
    if (option && option.pts < 0) refundPoints(-option.pts);
    setChoiceRedone(true);
    setSelected(null);
    setPhase("choice");
  };

  const startBattle = () => {
    if (!spendPoints(fee)) {
      toast.error(tr("積分不足，付不起進場費", "Not enough points for the entry fee"));
      return;
    }
    setFeePaid(fee);
    setPhase("battle");
  };

  return (
    <>
      <PageHeader title={title} backHref={backHref} />
      <PageBody>
        <WealthStrip />
        <section className="relative overflow-hidden rounded-xl border border-border bg-card">
          <div className="scanlines relative h-24 overflow-hidden bg-gradient-to-br from-secondary via-card to-muted">
            <div className="vignette absolute inset-0" />
            <div className="relative flex h-full flex-col justify-end p-3">
              <p className={`text-xs font-bold ${ACCENT_TEXT[def.accent]}`}>{pick(def.subtitle)}</p>
              <h2 className="text-xl font-black text-balance">{pick(lv.title)}</h2>
            </div>
          </div>
        </section>

        {phase === "intro" && (
          <div className="animate-rise-in flex flex-col gap-4">
            <p className="leading-relaxed">{pick(lv.intro)}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">
                {tr("敵人", "Enemy")}: {pick(lv.enemy)}
              </Badge>
              <Badge variant="outline">
                {tr("難度", "Difficulty")}: {{ low: tr("低", "Low"), mid: tr("中", "Mid"), high: tr("高", "High") }[difficulty]}
              </Badge>
              <Badge variant="outline">
                {tr("進場分", "Entry")} {tuning.entry.toLocaleString()}
              </Badge>
              <Badge variant="outline">
                {tr("進場費", "Fee")} {fee.toLocaleString()}
              </Badge>
            </div>
            {isCapped(profile, config) && (
              <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
                {tr(
                  "今日或本週產出已達上限，關卡獎勵降為 20%，仍可遊玩。",
                  "You hit today's or this week's earning cap. Level rewards drop to 20%, but you can still play.",
                )}
              </p>
            )}
            {profile.points < tuning.entry ? (
              <div className="flex flex-col gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
                <p>
                  {tr(
                    `遊戲幣不足（需要 ${tuning.entry.toLocaleString()} 分）。你可以用背包寶物兌換遊戲幣，或以 Pi 兌換補充。`,
                    `Not enough points (${tuning.entry.toLocaleString()} needed). Sell items from your bag or top up with a Pi exchange.`,
                  )}
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="secondary" className="flex-1">
                    <Link href="/exchange">{tr("寶物兌換", "Sell items")}</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/pi-exchange">{tr("Pi 兌換", "Pi exchange")}</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                {profile.settings.voice && (
                  <Button variant="secondary" size="icon" aria-label={tr("朗讀", "Read aloud")} onClick={() => speak(pick(lv.intro))}>
                    <Volume2 className="size-5" />
                  </Button>
                )}
                <Button size="lg" className="h-12 flex-1 text-base font-black" onClick={() => setPhase("choice")}>
                  {tr("進入戰前抉擇", "Face the choice")}
                </Button>
              </div>
            )}
          </div>
        )}

        {phase === "choice" && (
          <div className="animate-rise-in flex flex-col gap-4">
            <div className="flex items-start gap-2">
              <h3 className="flex-1 text-lg font-black text-balance">{pick(lv.prompt)}</h3>
              {profile.settings.voice && (
                <Button variant="ghost" size="icon" aria-label={tr("朗讀", "Read aloud")} onClick={() => speak(pick(lv.prompt))}>
                  <Volume2 className="size-5" />
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label={tr("抉擇選項", "Options")}>
              {lv.options.map((opt, i) => {
                const active = selected === i;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelected(i)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      active ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <span className="block font-bold">{pick(opt.text)}</span>
                    {opt.pts < 0 && (
                      <span className="mt-1 block text-xs text-destructive">
                        {tr("代價", "Cost")} {Math.abs(opt.pts).toLocaleString()} {tr("分", "pts")}
                      </span>
                    )}
                    {hints && (
                      <span className="mt-1 block text-sm text-accent">
                        {pick(opt.hint)}
                        {opt.pts > 0 && ` (+${opt.pts.toLocaleString()} ${tr("分", "pts")})`}
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {pick(TACTIC_TEXT[buildPlan(gameId, level, opt.enemy).tactic])}
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={hints || profile.items.wisdom < 1}
                onClick={() => {
                  if (consumeItem("wisdom")) setHints(true);
                }}
                className="flex-1"
              >
                <Eye className="size-4" aria-hidden="true" />
                {tr("智慧提示", "Wisdom hint")} x{profile.items.wisdom}
              </Button>
              <Button className="flex-1 font-black" disabled={selected === null} onClick={commitChoice}>
                {tr("做出抉擇", "Commit")}
              </Button>
            </div>
          </div>
        )}

        {phase === "ready" && option && (
          <div className="animate-rise-in flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-card p-3 text-sm">
              <p className="mb-1 text-muted-foreground">{tr("你的抉擇", "Your choice")}</p>
              <p className="font-bold">{pick(option.text)}</p>
              <p className="mt-2 text-accent">{pick(TACTIC_TEXT[plan.tactic])}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-sm">
              <p className="mb-2 font-bold">
                {pick(plan.scene.name)} · {tr("共", "")}
                {plan.sections.length}
                {tr("節", " sections")}
              </p>
              <ol className="flex flex-col gap-1 text-muted-foreground">
                {plan.sections.map((s, i) => (
                  <li key={i}>
                    {i + 1}. {pick(MODE_TEXT[s.mode].title)}
                    {s.hazard === "falling" && ` · ${tr("頭頂來襲", "overhead strikes")}`}
                    {s.hazard === "mines" && ` · ${tr("地面陷阱", "ground traps")}`}
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 text-sm font-bold text-foreground">
                {gameId === "gladiator"
                  ? tr("戰鬥風格（徒手肉搏，戰鬥中可切換）", "Fighting stances (bare-handed, switch mid-fight)")
                  : tr("本關武器（戰鬥中可切換）", "Weapons this level (switch mid-fight)")}
              </p>
              <ul className="flex flex-col gap-1">
                {WEAPONS[gameId].map((w) => {
                  const open = w.unlock <= level;
                  return (
                    <li key={w.id} className={open ? "" : "opacity-50"}>
                      <span className="font-bold text-foreground">{pick(w.name)}</span> · {pick(w.note)}
                      {!open && ` (${tr("第", "Lv ")}${w.unlock}${tr("關解鎖", " unlock")})`}
                    </li>
                  );
                })}
              </ul>
            </div>
            {gameId === "gladiator" && (
              <div className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
                <p className="mb-1 text-sm font-bold text-foreground">{tr("護身裝備（隨關卡進展自動穿戴）", "Protective gear (worn as you advance)")}</p>
                <ul className="flex flex-col gap-1">
                  {GLADIATOR_GEAR.map((g) => {
                    const open = g.unlock <= level;
                    return (
                      <li key={g.id} className={open ? "" : "opacity-50"}>
                        <span className="font-bold text-foreground">{pick(g.name)}</span> · {pick(g.note)}
                        {!open && ` (${tr("第", "Lv ")}${g.unlock}${tr("關取得", " unlock")})`}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-1 text-foreground">
                  {tr(
                    `目前加成：體力 +${gearStats(level).hp}、減傷 ${Math.round(gearStats(level).def * 100)}%`,
                    `Current bonus: HP +${gearStats(level).hp}, damage -${Math.round(gearStats(level).def * 100)}%`,
                  )}
                </p>
              </div>
            )}
            <div className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 text-sm font-bold text-foreground">{tr("寶物掉落", "Item drops")}</p>
              <ul className="flex flex-col gap-1">
                {KILL_DROPS[gameId].map((r, i) => (
                  <li key={i}>
                    {pick(r.who)}: {pick(itemName(gameId, r.item, ITEM_META[r.item].name))} {Math.round(r.chance * 100)}%
                  </li>
                ))}
                <li className="text-foreground">
                  {tr("本關首領必掉", "Boss always drops")}: {pick(itemName(gameId, BOSS_DROP[level] ?? "energy", ITEM_META[BOSS_DROP[level] ?? "energy"].name))}
                  {tr(`，另有 ${Math.round(BOSS_BONUS_CHANCE * 100)}% 機率掉機會寶物`, `, plus a ${Math.round(BOSS_BONUS_CHANCE * 100)}% chance of a Chance item`)}
                </li>
                <li>{tr(`每場戰鬥最多拾獲 ${MAX_DROPS_PER_BATTLE} 件（首領除外）。`, `Up to ${MAX_DROPS_PER_BATTLE} drops per battle (boss excluded).`)}</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 text-sm font-bold text-foreground">{tr("戰鬥操作", "How to fight")}</p>
              <p>
                {tr(
                  "左手方向鍵移動，右手：手攻擊、足攻擊（可破防）、跳閃、低閃（按住）。",
                  "Left thumb moves. Right thumb: hand attack, foot attack (breaks guards), jump dodge, duck (hold).",
                )}
              </p>
              <p className="mt-1">
                <span className="font-bold text-destructive">{tr("紅色驚嘆號", "Red mark")}</span>
                {tr("：高位攻擊，按住低閃。", ": a high attack. Hold duck. ")}
                <span className="font-bold text-accent">{tr("黃色驚嘆號", "Yellow mark")}</span>
                {tr("：低位攻擊或衝鋒，跳閃。", ": a low attack or charge. Jump.")}
              </p>
              <p className="mt-1">
                {tr(
                  "戰鬥中可使用武器、能量、智慧、幫助寶物；倒下時用機會寶物重打本節。",
                  "Use weapon, energy, wisdom and ally items mid-battle. If you fall, a Chance item replays the section.",
                )}
              </p>
            </div>
            <p className="text-sm">
              {tr("進場費", "Entry fee")}{" "}
              <span className="font-black text-destructive">{fee.toLocaleString()}</span> {tr("分，開戰即扣除。", "pts, charged when the fight starts.")}
            </p>
            <Button size="lg" className="h-14 text-lg font-black" onClick={startBattle}>
              <Swords className="size-5" aria-hidden="true" />
              {tr("開戰", "Fight")}
            </Button>
            {!choiceRedone && (
              <Button variant="ghost" disabled={profile.items.chance < 1} onClick={redoChoice}>
                <ItemIcon type="chance" className="size-4" />
                {tr("機會：重新抉擇", "Chance: redo the choice")} x{profile.items.chance}
              </Button>
            )}
          </div>
        )}

        {phase === "battle" && (
          <div className="animate-rise-in">
            <BeatEngine
              gameId={gameId}
              level={level}
              weapons={weaponsFor(gameId, level)}
              gear={gameId === "gladiator" ? gearStats(level) : undefined}
              onGrantItem={grantItem}
              plan={plan}
              strength={strength}
              diff={difficultyProfile(difficulty)}
              scoring={scoring}
              sfx={profile.settings.sfx}
              bossName={pick(lv.enemy)}
              items={profile.items}
              onUseItem={consumeItem}
              tr={tr}
              pick={pick}
              onFinish={onBattleFinish}
            />
          </div>
        )}

        {phase === "result" && summary && (
          <ResultPanel
            summary={summary}
            stats={stats}
            gameId={gameId}
            level={level}
            totalLevels={def.levels.length}
            onReplay={onReplay}
          />
        )}
      </PageBody>
    </>
  );
}

function ResultPanel({
  summary,
  stats,
  gameId,
  level,
  totalLevels,
  onReplay,
}: {
  summary: FinishSummary;
  stats: { kills: number; maxCombo: number };
  gameId: GameId;
  level: number;
  totalLevels: number;
  onReplay: () => void;
}) {
  const { tr, pick } = useGame();
  const rows: [string, number][] = [
    [tr("進場費", "Entry fee"), -summary.fee],
    [tr("命中與擊殺得分", "Hits and kills"), summary.battleGain],
    [tr("受傷與落空損失", "Damage taken and misses"), -summary.roundLoss],
    [tr("小節完成獎勵", "Section clears"), summary.roundGain],
    [tr("過關獎勵", "Clear reward"), summary.passReward],
    [tr("抉擇獎勵", "Choice bonus"), summary.choiceBonus],
    [tr("失敗扣分", "Defeat penalty"), -summary.failPenalty],
  ];
  return (
    <div className="animate-rise-in flex flex-col gap-4">
      <div className={`rounded-xl border p-4 ${summary.passed ? "border-primary bg-primary/10" : "border-destructive bg-destructive/10"}`}>
        <h3 className="text-2xl font-black">{summary.passed ? tr("過關", "Level cleared") : tr("失敗", "Level failed")}</h3>
        <p className="text-sm text-muted-foreground">
          {tr("完成", "Cleared")} {summary.wins}/{summary.rounds} {tr("節", "sections")} · {tr("擊倒", "KOs")} {stats.kills} ·{" "}
          {tr("最高連擊", "Best combo")} {stats.maxCombo} · {tr("得分", "Score")} {summary.score.toLocaleString()}
        </p>
        {summary.replay && summary.passed && (
          <p className="mt-1 text-xs text-muted-foreground">
            {tr("重玩關卡，過關獎勵為原值 30%。", "Replay: clear reward is 30% of normal.")}
          </p>
        )}
        {summary.firstClear && summary.passed && (
          <p className="mt-1 text-xs text-primary">{tr("首次通關，過關獎勵 x1.5", "First clear: clear reward x1.5")}</p>
        )}
        {summary.capped && (
          <p className="mt-1 text-xs text-destructive">{tr("已達產出上限，獎勵降為 20%", "Earning cap reached: rewards cut to 20%")}</p>
        )}
      </div>
      <dl className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card text-sm">
        {rows
          .filter(([, v]) => v !== 0)
          .map(([label, v]) => (
            <div key={label} className="flex justify-between px-3 py-2">
              <dt>{label}</dt>
              <dd className={v > 0 ? "font-bold text-primary" : "font-bold text-destructive"}>
                {v > 0 ? "+" : ""}
                {v.toLocaleString()}
              </dd>
            </div>
          ))}
        <div className="flex justify-between px-3 py-2 font-black">
          <dt>{tr("本關淨變化", "Net change")}</dt>
          <dd className={summary.net >= 0 ? "text-primary" : "text-destructive"}>
            {summary.net >= 0 ? "+" : ""}
            {summary.net.toLocaleString()}
          </dd>
        </div>
      </dl>
      {summary.itemReward && (
        <p className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
          <ItemIcon type={summary.itemReward} className="text-primary" />
          {tr("獲得寶物：", "Item found: ")}
          {pick(ITEM_META[summary.itemReward].name)}
        </p>
      )}
      {summary.ending && (
        <div className="rounded-xl border border-primary bg-card p-4">
          <p className="text-xs font-bold text-primary">
            {summary.ending.isNew ? tr("解鎖新結局", "New ending unlocked") : tr("結局", "Ending")}
            {summary.ending.bonus > 0 && ` +${summary.ending.bonus.toLocaleString()} ${tr("分", "pts")}`}
          </p>
          <h4 className="mt-1 text-xl font-black">{pick(summary.ending.title)}</h4>
          <p className="mt-2 text-sm leading-relaxed">{pick(summary.ending.text)}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onReplay}>
          {tr("再玩一次", "Play again")}
        </Button>
        {summary.passed && level < totalLevels ? (
          <Button asChild>
            <Link href={`/games/${gameId}/play/${level + 1}`}>{tr("下一關", "Next level")}</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href={`/games/${gameId}`}>{tr("關卡列表", "Level list")}</Link>
          </Button>
        )}
      </div>
      <Button asChild variant="ghost">
        <Link href="/lobby">{tr("回到大廳", "Back to lobby")}</Link>
      </Button>
    </div>
  );
}
