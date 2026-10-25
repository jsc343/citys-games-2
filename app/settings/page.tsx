"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageBody, PageHeader } from "@/components/page-header";
import { useGame } from "@/contexts/game-context";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";
import { LANGUAGES } from "@/lib/languages";

export default function SettingsPage() {
  const { tr, profile, setSettings, setLang, lang, username, saveFailed, config } = useGame();
  const s = profile.settings;

  const toggles = [
    { key: "music" as const, label: tr("背景音樂", "Background music") },
    { key: "sfx" as const, label: tr("音效", "Sound effects") },
    { key: "voice" as const, label: tr("語音", "Voice") },
  ];
  const diffLabels: Record<Difficulty, string> = {
    low: tr("低", "Low"),
    mid: tr("中", "Mid"),
    high: tr("高", "High"),
  };

  return (
    <>
      <PageHeader title={tr("設定", "Settings")} />
      <PageBody>
        <p className="text-sm text-muted-foreground">
          {tr("Pi 帳號", "Pi account")}: <span className="font-bold text-foreground">{username}</span>
        </p>
        {saveFailed && (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
            {tr("進度暫時無法儲存，系統會自動重試。", "Progress couldn't be saved just now. We'll retry automatically.")}
          </p>
        )}

        <section className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {toggles.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between px-4 py-3">
              <Label htmlFor={`set-${key}`} className="text-base">
                {label}
              </Label>
              <Switch id={`set-${key}`} checked={s[key]} onCheckedChange={(v) => setSettings({ [key]: v })} />
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-black">{tr("難度", "Difficulty")}</h2>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {DIFFICULTIES.map((d) => (
              <Button
                key={d}
                role="radio"
                aria-checked={s.difficulty === d}
                variant={s.difficulty === d ? "default" : "secondary"}
                onClick={() => setSettings({ difficulty: d })}
                className="h-auto flex-col gap-0.5 py-3"
              >
                <span className="font-black">{diffLabels[d]}</span>
                <span className="text-[11px] font-normal opacity-80">
                  {tr("進場", "Entry")} {config.tuning[d].entry.toLocaleString()}
                </span>
              </Button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {tr(
              "難度越高，敵人越強、失敗扣分越重，過關獎勵也越高。",
              "Higher difficulty means tougher enemies and bigger defeat penalties, with bigger clear rewards.",
            )}
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-black">{tr("語言", "Language")}</h2>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {LANGUAGES.map((o) => (
              <Button
                key={o.id}
                role="radio"
                aria-checked={lang === o.id}
                variant={lang === o.id ? "default" : "secondary"}
                onClick={() => setLang(o.id)}
              >
                {o.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {tr(
              "介面文字支援多國語言；旁白語音目前僅有中文與英文。",
              "The interface supports many languages; spoken narration is currently Chinese and English only.",
            )}
          </p>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="secondary">
            <Link href="/pi-exchange">{tr("Pi 兌換", "Pi exchange")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">{tr("返回首頁", "Home")}</Link>
          </Button>
        </div>
        <Link
          href="/admin"
          className="self-center text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {tr("商家管理後台", "Merchant admin")}
        </Link>
      </PageBody>
    </>
  );
}
