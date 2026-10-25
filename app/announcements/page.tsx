"use client";

import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/page-header";
import { useGame } from "@/contexts/game-context";
import type { AnnouncementCategory } from "@/lib/types";

export default function AnnouncementsPage() {
  const { tr, pick, announcements, lang } = useGame();
  const labels: Record<AnnouncementCategory, string> = {
    maintenance: tr("維護通知", "Maintenance"),
    update: tr("版本更新", "Update"),
    event: tr("活動消息", "Event"),
    rules: tr("規則更新", "Rules"),
  };
  const sorted = [...announcements].sort((a, b) => b.publishedAt - a.publishedAt);

  return (
    <>
      <PageHeader title={tr("查看通告", "Announcements")} />
      <PageBody>
        {sorted.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {tr("目前沒有公告。", "No announcements yet.")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sorted.map((a, i) => (
              <li
                key={a.id}
                className={`flex flex-col gap-2 rounded-xl border p-4 ${
                  i === 0 ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-2">
                  {i === 0 && <Badge>{tr("最新", "Latest")}</Badge>}
                  <Badge variant="secondary">{labels[a.category]}</Badge>
                  <time className="ml-auto text-xs text-muted-foreground" dateTime={new Date(a.publishedAt).toISOString()}>
                    {new Date(a.publishedAt).toLocaleString(lang === "zh" ? "zh-TW" : "en-US")}
                  </time>
                </div>
                <h2 className="font-black">{pick(a.title)}</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{pick(a.body)}</p>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}
