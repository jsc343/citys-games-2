"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postJson } from "@/lib/client-api";
import { AnnouncementsPanel } from "@/components/admin/announcements-panel";
import { ConfigPanel } from "@/components/admin/config-panel";
import { ExchangesPanel } from "@/components/admin/exchanges-panel";
import { FeedbackPanel } from "@/components/admin/feedback-panel";
import { OverviewPanel } from "@/components/admin/overview-panel";
import { PlayersPanel } from "@/components/admin/players-panel";
import { SystemPanel } from "@/components/admin/system-panel";

const TABS = [
  { id: "overview", label: "統計", panel: <OverviewPanel /> },
  { id: "players", label: "玩家", panel: <PlayersPanel /> },
  { id: "exchanges", label: "兌換", panel: <ExchangesPanel /> },
  { id: "config", label: "設定", panel: <ConfigPanel /> },
  { id: "news", label: "通告", panel: <AnnouncementsPanel /> },
  { id: "feedback", label: "反饋", panel: <FeedbackPanel /> },
  { id: "system", label: "系統", panel: <SystemPanel /> },
];

export function Dashboard({ email, onLogout }: { email: string; onLogout: () => void }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0 flex-1">
          <h1 className="font-black">商家管理後台</h1>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await postJson("/api/admin/logout", {});
            onLogout();
          }}
        >
          登出
        </Button>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 py-4">
        <Tabs defaultValue="overview">
          <div className="-mx-4 overflow-x-auto px-4">
            <TabsList className="w-max">
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {TABS.map((t) => (
            <TabsContent key={t.id} value={t.id} className="mt-4">
              {t.panel}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
