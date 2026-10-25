"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/page-header";
import { WealthStrip } from "@/components/wealth-strip";
import { useGame } from "@/contexts/game-context";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { checkinReward, dayKey } from "@/lib/economy";
import { reasonMessage } from "@/lib/reasons";

export default function WelfarePage() {
  const { tr, pick, config, profile, progress, social, checkin, claimAchievement, claimEvent, claimWeekly } =
    useGame();
  const [busy, setBusy] = useState<string | null>(null);

  const today = dayKey();
  const done = social.checkin.last === today;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const continuing = social.checkin.last === dayKey(y) || done;
  const nextDay = done ? social.checkin.streak + 1 : continuing ? social.checkin.streak + 1 : 1;
  const todayReward = checkinReward(done ? social.checkin.streak : nextDay, config.welfare.checkinMultiplier);

  const stepsToShow = [1, 3, 7, 8, 14, 15];

  return (
    <>
      <PageHeader title={tr("獎勵福利站", "Rewards")} />
      <PageBody>
        <WealthStrip />

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <CalendarCheck className="size-6 text-primary" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="font-black">{tr("每日簽到", "Daily check-in")}</h2>
              <p className="text-xs text-muted-foreground">
                {tr("連續", "Streak")} {social.checkin.streak} {tr("天", "day(s)")} · {tr("今日", "Today")} +
                {todayReward.toLocaleString()}
              </p>
            </div>
            <Button
              disabled={done}
              onClick={() => {
                const r = checkin();
                if (r.ok)
                  toast.success(tr(`簽到成功 +${r.reward}（連續 ${r.streak} 天）`, `Checked in +${r.reward} (day ${r.streak})`));
                else toast.error(reasonMessage(r.reason, tr));
              }}
            >
              {done ? tr("已簽到", "Done") : tr("簽到", "Check in")}
            </Button>
          </div>
          <ul className="grid grid-cols-6 gap-1.5 text-center text-[11px]">
            {stepsToShow.map((d) => (
              <li key={d} className="rounded-md bg-secondary py-1.5">
                <p className="text-muted-foreground">
                  {tr("第", "D")}
                  {d}
                  {d === 15 ? "+" : ""}
                  {tr("天", "")}
                </p>
                <p className="font-black text-primary">{checkinReward(d, config.welfare.checkinMultiplier)}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            {tr("中斷後連續天數會重新計算。", "Missing a day resets your streak.")}
          </p>
        </section>

        <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <h2 className="font-black">{tr("每週排行榜獎勵", "Weekly leaderboard reward")}</h2>
          <p className="text-xs text-muted-foreground">
            {tr("領取上週名次的獎勵。", "Claim the reward for last week's rank.")}
          </p>
          <Button
            variant="secondary"
            disabled={busy === "weekly"}
            onClick={async () => {
              setBusy("weekly");
              const r = await claimWeekly();
              setBusy(null);
              if (r.ok)
                toast.success(
                  tr(
                    `第 ${r.rank} 名：+${r.points} 分${r.tokens ? ` +${r.tokens} 代幣` : ""}`,
                    `Rank ${r.rank}: +${r.points} pts${r.tokens ? ` +${r.tokens} tokens` : ""}`,
                  ),
                );
              else toast.error(reasonMessage(r.reason, tr));
            }}
          >
            {tr("領取上週獎勵", "Claim last week's reward")}
          </Button>
        </section>

        <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <h2 className="font-black">{tr("邀請好友", "Invite friends")}</h2>
          <p className="text-sm text-muted-foreground">
            {tr(
              `邀請人 +${config.welfare.inviterBonus.toLocaleString()} 分，被邀請人 +${config.welfare.inviteeBonus.toLocaleString()} 分。`,
              `Inviter +${config.welfare.inviterBonus.toLocaleString()} pts, invitee +${config.welfare.inviteeBonus.toLocaleString()} pts.`,
            )}
          </p>
          <Button asChild variant="secondary">
            <Link href="/friends">{tr("取得我的邀請碼", "Get my invite code")}</Link>
          </Button>
        </section>

        {config.events.some((e) => e.active) && (
          <section className="flex flex-col gap-2">
            <h2 className="font-black">{tr("限時活動", "Events")}</h2>
            <ul className="flex flex-col gap-2">
              {config.events
                .filter((e) => e.active)
                .map((e) => {
                  const claimed = profile.claimed.events.includes(e.id);
                  return (
                    <li key={e.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{pick(e.title)}</p>
                        <p className="text-xs text-muted-foreground">
                          +{e.points.toLocaleString()} {tr("分", "pts")}
                          {e.tokens > 0 && ` +${e.tokens} ${tr("代幣", "tokens")}`}
                        </p>
                      </div>
                      <Button
                        disabled={claimed || busy === e.id}
                        onClick={async () => {
                          setBusy(e.id);
                          const r = await claimEvent(e.id);
                          setBusy(null);
                          if (r.ok) toast.success(tr("已領取", "Claimed"));
                          else toast.error(reasonMessage(r.reason, tr));
                        }}
                      >
                        {claimed ? tr("已領取", "Claimed") : tr("領取", "Claim")}
                      </Button>
                    </li>
                  );
                })}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-black">{tr("過關成就", "Achievements")}</h2>
          <ul className="flex flex-col gap-2">
            {ACHIEVEMENTS.map((a) => {
              const claimed = profile.claimed.achievements.includes(a.id);
              const ok = a.check(profile, progress, social);
              return (
                <li key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{pick(a.title)}</p>
                    <p className="text-xs text-muted-foreground">{pick(a.desc)}</p>
                    <p className="text-xs text-primary">
                      +{a.points.toLocaleString()} {tr("分", "pts")}
                      {a.tokens > 0 && ` +${a.tokens} ${tr("代幣", "tokens")}`}
                    </p>
                  </div>
                  <Button
                    variant={claimed ? "ghost" : "default"}
                    disabled={claimed || !ok}
                    onClick={() => {
                      const r = claimAchievement(a.id);
                      if (r.ok) toast.success(tr("成就獎勵已領取", "Reward claimed"));
                      else toast.error(reasonMessage(r.reason, tr));
                    }}
                  >
                    {claimed ? <Check className="size-4" aria-label={tr("已領取", "Claimed")} /> : tr("領取", "Claim")}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      </PageBody>
    </>
  );
}
