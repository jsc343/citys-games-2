"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getJson, postJson } from "@/lib/client-api";
import type { AnnouncementCategory, L } from "@/lib/types";

interface Item {
  id: string;
  title: L;
  body: L;
  category: AnnouncementCategory;
  publishAt: number;
  offline: boolean;
}

const CATS: Record<AnnouncementCategory, string> = {
  maintenance: "維護通知",
  update: "版本更新",
  event: "活動消息",
  rules: "規則更新",
};

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const blank = () => ({
  id: "",
  titleZh: "",
  titleEn: "",
  bodyZh: "",
  bodyEn: "",
  category: "update" as AnnouncementCategory,
  publishAt: toLocalInput(Date.now()),
});

export function AnnouncementsPanel() {
  const { data, mutate } = useSWR("adm-ann", () => getJson<{ items: Item[]; now: number }>("/api/admin/announcements"));
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ReturnType<typeof blank>>(k: K, v: ReturnType<typeof blank>[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await postJson("/api/admin/announcement-save", {
        id: form.id || undefined,
        title: { zh: form.titleZh, en: form.titleEn },
        body: { zh: form.bodyZh, en: form.bodyEn },
        category: form.category,
        publishAt: new Date(form.publishAt).getTime(),
      });
      toast.success(form.id ? "公告已更新" : "公告已建立");
      setForm(blank());
      await mutate();
    } catch {
      toast.error("儲存失敗，請至少填寫一個標題");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id: string, offline: boolean) => {
    await postJson("/api/admin/announcement-toggle", { id, offline });
    await mutate();
  };

  const remove = async (id: string) => {
    if (!window.confirm("確定要刪除這則公告嗎？")) return;
    await postJson("/api/admin/announcement-delete", { id });
    await mutate();
  };

  const now = data?.now ?? Date.now();

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <h2 className="font-black">{form.id ? "編輯公告" : "發佈新公告"}</h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="公告類別">
          {(Object.keys(CATS) as AnnouncementCategory[]).map((c) => (
            <Button
              key={c}
              size="sm"
              role="radio"
              aria-checked={form.category === c}
              variant={form.category === c ? "default" : "secondary"}
              onClick={() => set("category", c)}
            >
              {CATS[c]}
            </Button>
          ))}
        </div>
        <Input placeholder="標題（中文）" aria-label="標題中文" value={form.titleZh} onChange={(e) => set("titleZh", e.target.value)} />
        <Input placeholder="Title (English)" aria-label="Title English" value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} />
        <Textarea rows={4} placeholder="內容（中文）" aria-label="內容中文" value={form.bodyZh} onChange={(e) => set("bodyZh", e.target.value)} />
        <Textarea rows={4} placeholder="Body (English)" aria-label="Body English" value={form.bodyEn} onChange={(e) => set("bodyEn", e.target.value)} />
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          發佈時間（未來時間即為排程）
          <Input type="datetime-local" value={form.publishAt} onChange={(e) => set("publishAt", e.target.value)} className="text-foreground" />
        </label>
        <div className="flex gap-2">
          <Button className="flex-1" disabled={saving || (!form.titleZh.trim() && !form.titleEn.trim())} onClick={save}>
            {form.id ? "更新公告" : "發佈 / 排程"}
          </Button>
          {form.id && (
            <Button variant="secondary" onClick={() => setForm(blank())}>
              取消編輯
            </Button>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-black">公告列表</h2>
        {!data ? (
          <p className="text-sm text-muted-foreground">載入中…</p>
        ) : data.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">尚無公告</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.items.map((a) => {
              const scheduled = a.publishAt > now;
              return (
                <li key={a.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{CATS[a.category]}</Badge>
                    {a.offline ? <Badge variant="outline">已下架</Badge> : scheduled ? <Badge variant="outline">排程中</Badge> : <Badge>已發佈</Badge>}
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(a.publishAt).toLocaleString("zh-TW")}</span>
                  </div>
                  <p className="font-black">{a.title.zh}</p>
                  <p className="text-xs text-muted-foreground">{a.title.en}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setForm({
                          id: a.id,
                          titleZh: a.title.zh,
                          titleEn: a.title.en,
                          bodyZh: a.body.zh,
                          bodyEn: a.body.en,
                          category: a.category,
                          publishAt: toLocalInput(a.publishAt),
                        });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      編輯
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => toggle(a.id, !a.offline)}>
                      {a.offline ? "重新上架" : "下架"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>
                      刪除
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
