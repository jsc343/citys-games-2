"use client";

import useSWR from "swr";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { errorReason, getJson, postJson } from "@/lib/client-api";
import type { ExchangeRecord, ExchangeStatus } from "@/lib/types";

const STATUS: Record<ExchangeStatus, string> = {
  pending: "待確認",
  confirmed: "已入帳",
  rejected: "已拒絕",
};

export function ExchangesPanel() {
  const { data, mutate } = useSWR("adm-exchanges", () => getJson<{ records: ExchangeRecord[] }>("/api/admin/exchanges"), {
    refreshInterval: 15000,
  });

  const setStatus = async (id: string, status: ExchangeStatus) => {
    try {
      await postJson("/api/admin/exchange-status", { id, status });
      toast.success(status === "confirmed" ? "已確認入帳，玩家下次連線會收到" : "已更新");
      await mutate();
    } catch (e) {
      toast.error(errorReason(e) === "already_confirmed" ? "此筆已入帳，無法更改" : "更新失敗");
    }
  };

  if (!data) return <p className="text-sm text-muted-foreground">載入中…</p>;
  if (data.records.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        尚無兌換記錄
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.records.map((r) => (
        <li key={r.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-black">{r.username}</span>
            <Badge variant={r.status === "confirmed" ? "default" : "outline"}>{STATUS[r.status]}</Badge>
            <span className="ml-auto text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("zh-TW")}</span>
          </div>
          <p>
            {r.pi} Pi {"->"}{" "}
            {r.target === "points" ? `${r.points.toLocaleString()} 分` : `${r.tokens.toLocaleString()} 代幣`}
          </p>
          <p className="break-all text-xs text-muted-foreground">
            單號 {r.id} · UID {r.uid}
          </p>
          {r.status === "pending" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setStatus(r.id, "confirmed")}>
                確認入帳
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setStatus(r.id, "rejected")}>
                拒絕
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
