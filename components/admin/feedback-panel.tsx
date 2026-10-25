"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getJson, postJson } from "@/lib/client-api";
import type { FeedbackRecord, FeedbackStatus, FeedbackType } from "@/lib/types";

const STATUS: Record<FeedbackStatus, string> = {
  unread: "未讀",
  processing: "處理中",
  replied: "已回覆",
  closed: "已關閉",
};
const TYPES: Record<FeedbackType, string> = { suggestion: "建議", bug: "Bug", other: "其他" };

function FeedbackItem({ f, onChanged }: { f: FeedbackRecord; onChanged: () => void }) {
  const [reply, setReply] = useState("");
  const [open, setOpen] = useState(false);

  const update = async (payload: Record<string, unknown>, okMsg: string) => {
    try {
      await postJson("/api/admin/feedback-update", { id: f.id, ...payload });
      toast.success(okMsg);
      onChanged();
    } catch {
      toast.error("更新失敗");
    }
  };

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm">
      <button
        type="button"
        className="flex flex-col gap-1 text-left"
        onClick={() => {
          setOpen(!open);
          if (!open && f.status === "unread") void update({ status: "processing" }, "已標記為處理中");
        }}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Badge variant="secondary">{TYPES[f.type]}</Badge>
          <Badge variant={f.status === "unread" ? "default" : "outline"}>{STATUS[f.status]}</Badge>
          <span className="ml-auto text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleString("zh-TW")}</span>
        </span>
        <span className="font-black">{f.title}</span>
        <span className="text-xs text-muted-foreground">來自 {f.username}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-3">
          <p className="whitespace-pre-line leading-relaxed">{f.body}</p>
          {f.shot && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.shot} alt="玩家上傳的截圖" className="max-h-64 w-fit rounded-lg border border-border" />
          )}
          {f.replies.map((r) => (
            <div key={r.at} className="rounded bg-secondary p-2">
              <p className="text-xs text-muted-foreground">{new Date(r.at).toLocaleString("zh-TW")}</p>
              <p className="whitespace-pre-line">{r.text}</p>
            </div>
          ))}
          <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="回覆玩家…" aria-label="回覆內容" />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!reply.trim()}
              onClick={async () => {
                await update({ reply }, "已回覆");
                setReply("");
              }}
            >
              送出回覆
            </Button>
            {(Object.keys(STATUS) as FeedbackStatus[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={f.status === s ? "default" : "secondary"}
                onClick={() => update({ status: s }, "狀態已更新")}
              >
                {STATUS[s]}
              </Button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

export function FeedbackPanel() {
  const { data, mutate } = useSWR("adm-feedback", () => getJson<{ records: FeedbackRecord[] }>("/api/admin/feedback"), {
    refreshInterval: 20000,
  });
  if (!data) return <p className="text-sm text-muted-foreground">載入中…</p>;
  if (data.records.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        尚無反饋
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {data.records.map((f) => (
        <FeedbackItem key={f.id} f={f} onChanged={() => void mutate()} />
      ))}
    </ul>
  );
}
