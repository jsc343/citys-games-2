"use client";

import Link from "next/link";
import {
  Coins,
  Gift,
  Megaphone,
  MessageSquare,
  Repeat,
  Settings,
  Store,
  Trophy,
  Users,
} from "lucide-react";
import { LanguageButton } from "@/components/language-button";
import { Marquee } from "@/components/marquee";
import { PiLogo } from "@/components/pi-logo";
import { ItemIcon } from "@/components/item-icon";
import { GameAreas } from "@/components/lobby/game-areas";
import { useGame } from "@/contexts/game-context";
import { ITEM_META } from "@/lib/items";
import { ITEM_TYPES } from "@/lib/types";

export default function LobbyPage() {
  const { tr, pick, username, profile } = useGame();

  const welcomes = [
    tr(`歡迎回來，${username}！`, `Welcome back, ${username}!`),
    tr(`${username}，戰場在等你下決定。`, `${username}, the battlefield awaits your call.`),
    tr(`英雄 ${username}，今日也要慎選每一步。`, `Hero ${username}, choose every step with care today.`),
    tr(`${username} 帶著 Pi 的信念出征。`, `${username} marches out with the spirit of Pi.`),
  ];

  const winRate = profile.plays > 0 ? Math.round((profile.wins / profile.plays) * 100) : 0;
  const stats = [
    { label: tr("總場次", "Games played"), value: profile.plays.toLocaleString() },
    { label: tr("勝率", "Win rate"), value: `${winRate}%` },
    { label: tr("最高分數", "Best score"), value: profile.bestScore.toLocaleString() },
    { label: tr("總過關數", "Levels cleared"), value: profile.cleared.toLocaleString() },
  ];

  const entries = [
    { href: "/shop", icon: Store, label: tr("寶物商店", "Item shop") },
    { href: "/exchange", icon: Repeat, label: tr("寶物交換站", "Exchange") },
    { href: "/welfare", icon: Gift, label: tr("福利站", "Rewards") },
    { href: "/pi-exchange", icon: Coins, label: tr("Pi 兌換", "Pi exchange") },
    { href: "/leaderboard", icon: Trophy, label: tr("排行榜", "Leaderboard") },
    { href: "/friends", icon: Users, label: tr("好友邀請", "Friends") },
    { href: "/feedback", icon: MessageSquare, label: tr("我的反饋", "Feedback") },
    { href: "/announcements", icon: Megaphone, label: tr("查看通告", "News") },
    { href: "/settings", icon: Settings, label: tr("設定", "Settings") },
  ];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-2 backdrop-blur">
        <Link href="/" aria-label={tr("回到首頁", "Home")}>
          <PiLogo className="size-8 text-base" />
        </Link>
        <h1 className="flex-1 text-lg font-black">{tr("遊戲大廳", "Game lobby")}</h1>
        <LanguageButton />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pb-20 pt-4">
        <Marquee items={welcomes} />

        <section aria-label={tr("統計數據", "Statistics")} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 text-xl font-black">{s.value}</p>
            </div>
          ))}
        </section>

        <section aria-label={tr("財產數據", "Assets")} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{tr("遊戲幣", "Points")}</p>
              <p className="text-3xl font-black text-primary">{profile.points.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{tr("代幣", "Tokens")}</p>
              <p className="text-2xl font-black">{profile.tokens.toLocaleString()}</p>
            </div>
          </div>
          <ul className="grid grid-cols-5 gap-1.5">
            {ITEM_TYPES.map((t) => (
              <li
                key={t}
                className="flex flex-col items-center gap-0.5 rounded-md bg-secondary px-1 py-2 text-center"
              >
                <ItemIcon type={t} className="size-4 text-primary" />
                <span className="text-[11px] leading-tight text-muted-foreground">{pick(ITEM_META[t].name)}</span>
                <span className="text-sm font-black">{profile.items[t]}</span>
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label={tr("功能入口", "Shortcuts")} className="grid grid-cols-3 gap-2">
          {entries.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-1 py-3 text-center text-xs font-bold transition-colors hover:bg-secondary"
            >
              <Icon className="size-5 text-primary" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <GameAreas />
      </main>
    </div>
  );
}
