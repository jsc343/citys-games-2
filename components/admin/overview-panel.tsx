"use client";

import useSWR from "swr";
import { getJson } from "@/lib/client-api";

interface Overview {
  totalPlayers: number;
  totalPlays: number;
  totalExchanges: number;
  pendingExchanges: number;
  unreadFeedback: number;
  dau: number;
  mau: number;
  db?: { configured: boolean; ok: boolean; error: string; saves: number };
  games: { id: string; plays: number; passRate: number; avgScore: number }[];
}

const GAME_NAMES: Record<string, string> = {
  xiangyu: "古代戰爭 · 項羽傳",
  normandy: "時代槍戰 · 諾曼第突圍",
  gladiator: "肉搏格鬥 · 角鬥士之怒",
};

export function OverviewPanel() {
  const { data } = useSWR("adm-overview", () => getJson<Overview>("/api/admin/overview"), {
    refreshInterval: 15000,
  });
  if (!data) return <p className="text-sm text-muted-foreground">載入中…</p>;

  const cards = [
    { label: "總註冊玩家數", value: data.totalPlayers },
    { label: "總遊戲局數", value: data.totalPlays },
    { label: "總兌換記錄數", value: data.totalExchanges },
    { label: "待確認兌換", value: data.pendingExchanges },
    { label: "未讀反饋", value: data.unreadFeedback },
    { label: "DAU（估算）", value: data.dau },
    { label: "MAU（估算）", value: data.mau },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-black">{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <section className="flex flex-col gap-2">
        <h2 className="font-black">各遊戲數據</h2>
        <ul className="flex flex-col gap-2">
          {data.games.map((g) => (
            <li key={g.id} className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-3 text-sm">
              <p className="col-span-3 font-bold">{GAME_NAMES[g.id] ?? g.id}</p>
              <p>
                <span className="block text-xs text-muted-foreground">遊玩次數</span>
                {g.plays.toLocaleString()}
              </p>
              <p>
                <span className="block text-xs text-muted-foreground">通過率</span>
                {Math.round(g.passRate * 100)}%
              </p>
              <p>
                <span className="block text-xs text-muted-foreground">平均分數</span>
                {g.avgScore.toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </section>
      {data.db && (
        <p className="rounded-lg border border-border bg-card p-3 text-sm">
          資料庫狀態：
          {!data.db.configured
            ? "尚未連接（資料只存在暫存記憶，可能消失）"
            : data.db.ok
              ? `正常，已成功寫入 ${data.db.saves} 次`
              : `連接失敗　${data.db.error || "尚未有寫入紀錄"}`}
        </p>
      )}
      <p className="text-xs text-muted-foreground">DAU / MAU 為依玩家連線紀錄估算的數值。</p>
    </div>
  );
}
