"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBody, PageHeader } from "@/components/page-header";
import { useGame } from "@/contexts/game-context";
import { errorReason, getJson, postJson } from "@/lib/client-api";
import { reasonMessage } from "@/lib/reasons";
import type { FeedbackRecord, FeedbackStatus, FeedbackType } from "@/lib/types";

const MAX_SHOT_BYTES = 600_000;

export default function FeedbackPage() {
  const { tr, uid, username, lang } = useGame();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [body, setBody] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState("new");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, mutate } = useSWR(["feedback", uid], () =>
    getJson<{ records: FeedbackRecord[] }>(`/api/app/feedback?uid=${encodeURIComponent(uid)}`),
  );

  const typeLabels: Record<FeedbackType, string> = {
    suggestion: tr("建議", "Suggestion"),
    bug: "Bug",
    other: tr("其他", "Other"),
  };
  const statusLabels: Record<FeedbackStatus, string> = {
    unread: tr("未讀", "Unread"),
    processing: tr("處理中", "In progress"),
    replied: tr("已回覆", "Replied"),
    closed: tr("已關閉", "Closed"),
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(tr("請選擇圖片檔", "Please choose an image file"));
      return;
    }
    if (file.size > MAX_SHOT_BYTES) {
      toast.error(tr("截圖請小於 600 KB", "Screenshot must be under 600 KB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setShot(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setSending(true);
    try {
      await postJson("/api/app/feedback", { uid, username, title, type, body, shot });
      toast.success(tr("已送出，謝謝你的反饋", "Sent. Thanks for your feedback."));
      setTitle("");
      setBody("");
      setShot(null);
      setType("suggestion");
      await mutate();
      setTab("mine");
    } catch (e) {
      toast.error(reasonMessage(errorReason(e), tr));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader title={tr("我的反饋", "Feedback")} />
      <PageBody>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">{tr("提交反饋", "Send feedback")}</TabsTrigger>
            <TabsTrigger value="mine">
              {tr("我的反饋", "My feedback")} ({data?.records.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fb-title" className="text-sm font-bold">
                {tr("標題", "Title")}
              </label>
              <Input id="fb-title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">{tr("內容類型", "Type")}</span>
              <div className="grid grid-cols-3 gap-2" role="radiogroup">
                {(Object.keys(typeLabels) as FeedbackType[]).map((k) => (
                  <Button
                    key={k}
                    role="radio"
                    aria-checked={type === k}
                    variant={type === k ? "default" : "secondary"}
                    onClick={() => setType(k)}
                  >
                    {typeLabels[k]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fb-body" className="text-sm font-bold">
                {tr("詳細描述", "Details")}
              </label>
              <Textarea id="fb-body" rows={6} value={body} maxLength={2000} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
                aria-label={tr("上傳截圖", "Upload screenshot")}
              />
              {shot ? (
                <div className="relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shot} alt={tr("截圖預覽", "Screenshot preview")} className="max-h-48 rounded-lg border border-border" />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-1 top-1 size-7"
                    aria-label={tr("移除截圖", "Remove screenshot")}
                    onClick={() => setShot(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="size-4" aria-hidden="true" />
                  {tr("上傳截圖（選填）", "Add a screenshot (optional)")}
                </Button>
              )}
            </div>
            <Button size="lg" disabled={sending || !title.trim() || !body.trim()} onClick={submit}>
              {tr("送出反饋", "Submit")}
            </Button>
          </TabsContent>

          <TabsContent value="mine" className="mt-4">
            {!data || data.records.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {tr("你還沒有提交過反饋。", "You haven't sent any feedback yet.")}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.records.map((f) => (
                  <li key={f.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{typeLabels[f.type]}</Badge>
                      <Badge variant={f.status === "replied" ? "default" : "outline"}>{statusLabels[f.status]}</Badge>
                      <time className="ml-auto text-xs text-muted-foreground" dateTime={new Date(f.createdAt).toISOString()}>
                        {new Date(f.createdAt).toLocaleDateString(lang === "zh" ? "zh-TW" : "en-US")}
                      </time>
                    </div>
                    <h3 className="font-black">{f.title}</h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                    {f.replies.map((r) => (
                      <div key={r.at} className="rounded-lg bg-secondary p-3 text-sm">
                        <p className="mb-1 text-xs font-bold text-primary">{tr("官方回覆", "Team reply")}</p>
                        <p className="whitespace-pre-line leading-relaxed">{r.text}</p>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}
