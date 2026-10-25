"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { PageBody, PageHeader } from "@/components/page-header";
import { useGame } from "@/contexts/game-context";
import { getJson } from "@/lib/client-api";
import { reasonMessage } from "@/lib/reasons";
import type { LeaderboardReward } from "@/lib/types";

interface BoardResponse {
  rows: { rank: number; username: string; value: number; mine: boolean }[];
  me: { rank: number; value: number } | null;
  week: string;
  rewards: LeaderboardReward[];
}

type Metric = "total" | "best" | "cleared" | "week";

export default function LeaderboardPage() {
  const { tr, uid, claimWeekly } = useGame();
  const [metric, setMetric] = useState<Metric>("total");
  const [claiming, setClaiming] = useState(false);
  const { data, isLoading } = useSWR(
    ["board", metric, uid],
    () => getJson<BoardResponse>(`/api/app/leaderboard?metric=${metric}&uid=${encodeURIComponent(uid)}`),
    { refreshInterval: 30000 },
  );

  return (
    <>
      <PageHeader title={tr("排行榜", "Leaderboard")} />
      <PageBody>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="total">{tr("總分", "Total")}</TabsTrigger>
            <TabsTrigger value="best">{tr("最高分", "Best")}</TabsTrigger>
            <TabsTrigger value="cleared">{tr("過關數", "Cleared")}</TabsTrigger>
            <TabsTrigger value="week">{tr("本週", "Week")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <section className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{tr("我的名次", "My rank")}</p>
          {data?.me ? (
            <p className="text-2xl font-black text-primary">
              #{data.me.rank}{" "}
              <span className="text-sm font-normal text-foreground">{data.me.value.toLocaleString()}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {tr("尚未上榜，去打一關吧。", "Not ranked yet. Go play a level.")}
            </p>
          )}
        </section>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-6" />
          </div>
        ) : data && data.rows.length > 0 ? (
          <ol className="flex flex-col gap-1.5">
            {data.rows.map((r) => (
              <li
                key={r.rank}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                  r.mine ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <span className="w-8 text-center font-black text-muted-foreground">{r.rank}</span>
                <span className="min-w-0 flex-1 truncate font-bold">{r.username}</span>
                <span className="font-black">{r.value.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {tr("榜單目前是空的。", "The board is empty for now.")}
          </p>
        )}

        <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <h2 className="font-black">{tr("每週結算獎勵", "Weekly rewards")}</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {(data?.rewards ?? []).map((r) => (
              <li key={`${r.from}-${r.to}`} className="flex justify-between">
                <span>
                  {tr("第", "#")}
                  {r.from === r.to ? r.from : `${r.from}-${r.to}`}
                  {tr("名", "")}
                </span>
                <span className="font-bold text-primary">
                  +{r.points.toLocaleString()}
                  {r.tokens > 0 && ` +${r.tokens} ${tr("代幣", "tokens")}`}
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant="secondary"
            disabled={claiming}
            onClick={async () => {
              setClaiming(true);
              const r = await claimWeekly();
              setClaiming(false);
              if (r.ok) toast.success(tr(`上週第 ${r.rank} 名獎勵已入帳`, `Reward for rank ${r.rank} received`));
              else toast.error(reasonMessage(r.reason, tr));
            }}
          >
            {tr("領取上週獎勵", "Claim last week's reward")}
          </Button>
        </section>
      </PageBody>
    </>
  );
}
