"use client";

import { ExternalLink, ShieldAlert, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntryGate } from "@/components/home/entry-gate";
import { LanguageButton } from "@/components/language-button";
import { Marquee } from "@/components/marquee";
import { PiLogo } from "@/components/pi-logo";
import { useGame } from "@/contexts/game-context";

export default function HomePage() {
  const { tr, pick, announcements } = useGame();

  const ticker =
    announcements.length > 0
      ? announcements.slice(0, 5).map((a) => pick(a.title))
      : [tr("歡迎來到 City's Games(2)", "Welcome to City's Games(2)")];

  const notes = [
    tr("歷史人物與事件均經戲劇化改編，並非史實紀錄。", "Historical figures and events are dramatized and are not factual records."),
    tr("你的抉擇可能造成失敗、失去資源、角色離場，或走向不同結局。", "Your choices can lead to defeat, lost resources, fallen allies, or different endings."),
    tr("積分與寶物僅限平台規則允許的遊戲內用途。", "Points and items may only be used in-game as the platform rules allow."),
  ];

  const disclaimers = [
    tr("內容與數值可能調整。", "Content and values may change."),
    tr("本 App 不提供投資、金融、醫療或法律建議。", "This app gives no investment, financial, medical, or legal advice."),
    tr("歷史內容為遊戲化創作。", "Historical content is a creative, gamified retelling."),
    tr("積分、代幣與寶物不代表現金，亦無兌付承諾。", "Points, tokens, and items are not cash and carry no promise of payout."),
    tr("Pi 相關服務一律以官方資訊為準。", "Pi-related services follow official Pi information."),
    tr("兌換操作可能不可逆。", "Exchanges may be irreversible."),
    tr("請注意遊玩時間；未成年人須經監護人同意。", "Watch your play time. Minors need a guardian's consent."),
  ];

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 py-3">
        <PiLogo className="size-9 text-lg" />
        <p className="font-display min-w-0 flex-1 truncate text-center text-xl font-black tracking-wide">
          City&apos;s Games(2)
        </p>
        <LanguageButton />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-24">
        <Marquee items={ticker} />

        <section className="scanlines relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary via-card to-muted p-6">
          <div className="vignette pointer-events-none absolute inset-0" />
          <div className="relative flex flex-col gap-3">
            <Swords className="size-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl font-black leading-tight text-balance">
              {tr("每一次抉擇，都決定生死", "Every choice decides who lives")}
            </h1>
            <p className="leading-relaxed text-pretty text-muted-foreground">
              {tr(
                "以各國歷史英雄列傳為背景，先判斷局勢、配置資源，再投入需要反應與操作的街機戰鬥。",
                "Set in the legends of history's heroes: read the situation and spend your resources, then fight an arcade battle that tests your reflexes.",
              )}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-black">{tr("創建主旨", "Why we built this")}</h2>
          <p className="leading-relaxed text-pretty">
            {tr(
              "City's Games(2) 以歷史人物為背景，把忠義、勇氣、策略、求生與自由，化為可玩的街機挑戰。玩家在娛樂中練習判斷風險、承擔後果與重新出發。",
              "City's Games(2) takes historical figures as its backdrop and turns loyalty, courage, strategy, survival, and freedom into playable arcade challenges. Players practice weighing risk, owning consequences, and starting over.",
            )}
          </p>
          <p className="leading-relaxed text-pretty text-muted-foreground">
            {tr(
              "本平台旨在增添 Pi 生態的多元性，不以營利為目的；積分、代幣與寶物僅限遊戲內用途。",
              "The platform aims to add variety to the Pi ecosystem. It is not run for profit, and points, tokens, and items are for in-game use only.",
            )}
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-black">{tr("進入遊戲注意事項", "Before you play")}</h2>
          <ul className="flex flex-col gap-2">
            {notes.map((n) => (
              <li key={n} className="rounded-lg border border-border bg-card px-3 py-2 text-sm leading-relaxed">
                {n}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 text-xl font-black">
            <ShieldAlert className="size-5 text-destructive" aria-hidden="true" />
            {tr("免責聲明", "Disclaimer")}
          </h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
            {disclaimers.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-black">{tr("還沒有 Pi 帳號？", "No Pi account yet?")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tr(
              "請前往 Pi Network 官方網站了解與註冊。請確認網域為 minepi.com，切勿向任何人提供你的密碼或驗證碼。",
              "Visit the official Pi Network website to learn more and sign up. Check that the domain is minepi.com, and never share your password or verification codes with anyone.",
            )}
          </p>
          <Button asChild variant="secondary">
            <a href="https://minepi.com" target="_blank" rel="noopener noreferrer">
              {tr("前往 Pi Network 官網", "Go to the Pi Network site")}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </section>

        <EntryGate />
      </main>
    </div>
  );
}
