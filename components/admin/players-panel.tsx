"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJson } from "@/lib/client-api";
import { ITEM_META } from "@/lib/items";
import { ITEM_TYPES, type Items } from "@/lib/types";

interface Row {
  uid: string;
  username: string;
  email?: string;
  registeredAt: number;
  lastSeen: number;
  points: number;
  tokens: number;
  items: Items;
}

interface Detail {
  player: Row & {
    inviteCode: string;
    totalScore: number;
    bestScore: number;
    cleared: number;
    plays: number;
    wins: number;
    progress: Record<string, { cleared: number[]; endings: string[] }>;
  };
}

const fmt = (t: number) => new Date(t).toLocaleString("zh-TW");

function PlayerDetail({ uid, onClose }: { uid: string; onClose: () => void }) {
  const { data } = useSWR(["adm-player", uid], () =>
    getJson<Detail>(`/api/admin/player?uid=${encodeURIComponent(uid)}`),
  );
  if (!data) return <p className="text-sm text-muted-foreground">載入中…</p>;
  const p = data.player;
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-primary bg-card p-4 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">{p.username}</h2>
        <Button size="sm" variant="secondary" onClick={onClose}>
          關閉
        </Button>
      </div>
      <p className="break-all text-sm">郵箱：{p.email || "（尚未登錄）"}</p>
      <p className="break-all text-xs text-muted-foreground">Pi UID: {p.uid} · 邀請碼 {p.inviteCode}</p>
      <div className="grid grid-cols-2 gap-2">
        <p>積分 {p.points.toLocaleString()}</p>
        <p>代幣 {p.tokens.toLocaleString()}</p>
        <p>總分 {p.totalScore.toLocaleString()}</p>
        <p>最高分 {p.bestScore.toLocaleString()}</p>
        <p>總場次 {p.plays}</p>
        <p>勝場 {p.wins}</p>
        <p>總過關 {p.cleared}</p>
        <p>最後上線 {fmt(p.lastSeen)}</p>
      </div>
      <p>
        寶物：
        {ITEM_TYPES.map((t) => `${ITEM_META[t].name.zh} ${p.items[t]}`).join(" / ")}
      </p>
      <ul className="flex flex-col gap-1">
        {Object.entries(p.progress).map(([g, v]) => (
          <li key={g} className="rounded bg-secondary px-3 py-2">
            <span className="font-bold">{g}</span>：已過關 {v.cleared.length} 關，結局 {v.endings.length} 個
            {v.endings.length > 0 && <span className="text-muted-foreground">（{v.endings.join("、")}）</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PlayersPanel() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const { data } = useSWR(["adm-players", q], () => getJson<{ rows: Row[] }>(`/api/admin/players?q=${encodeURIComponent(q)}`));

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜尋 Pi 帳號 / 暱稱"
        aria-label="搜尋玩家"
      />
      {selected && <PlayerDetail uid={selected} onClose={() => setSelected(null)} />}
      {!data ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : data.rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          沒有符合的玩家
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.rows.map((r) => (
            <li key={r.uid}>
              <button
                type="button"
                onClick={() => setSelected(r.uid)}
                className="flex w-full flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:bg-secondary"
              >
                <span className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-2">
                  <span className="truncate font-black">{r.username}</span>
                  <span className="break-all text-xs">{r.email || "—"}</span>
                  <span className="text-xs text-muted-foreground">
                    首次登入 {new Date(r.registeredAt).toLocaleDateString("zh-TW")}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  積分 {r.points.toLocaleString()} · 代幣 {r.tokens} · 寶物 {ITEM_TYPES.reduce((n, t) => n + r.items[t], 0)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
