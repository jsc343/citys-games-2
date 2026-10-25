"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getJson, postJson } from "@/lib/client-api";
import { ITEM_META } from "@/lib/items";
import { DIFFICULTIES, GAME_IDS, ITEM_TYPES, type GameConfig } from "@/lib/types";

const DIFF_LABEL = { low: "低難度", mid: "中難度", high: "高難度" } as const;
const GAME_LABEL = { xiangyu: "項羽傳", normandy: "諾曼第突圍", gladiator: "角鬥士之怒" } as const;

function Num({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <Input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="text-foreground"
      />
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <h2 className="font-black">{title}</h2>
      {children}
    </section>
  );
}

export function ConfigPanel() {
  const { data, mutate } = useSWR("adm-config", () => getJson<{ config: GameConfig }>("/api/admin/config"));
  const [draft, setDraft] = useState<GameConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data && !draft) setDraft(structuredClone(data.config));
  }, [data, draft]);

  if (!draft) return <p className="text-sm text-muted-foreground">載入中…</p>;

  const edit = (fn: (c: GameConfig) => void) => {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await postJson<{ config: GameConfig }>("/api/admin/config", { config: draft });
      setDraft(structuredClone(res.config));
      await mutate();
      toast.success("設定已儲存，玩家下次連線生效");
    } catch {
      toast.error("儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm("確定要還原為預設值嗎？")) return;
    try {
      const res = await postJson<{ config: GameConfig }>("/api/admin/config-reset", {});
      setDraft(structuredClone(res.config));
      await mutate();
      toast.success("已還原預設值");
    } catch {
      toast.error("還原失敗");
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      {DIFFICULTIES.map((d) => (
        <Group key={d} title={`遊戲參數 · ${DIFF_LABEL[d]}`}>
          <div className="grid grid-cols-2 gap-2">
            <Num label="進場分" value={draft.tuning[d].entry} onChange={(v) => edit((c) => (c.tuning[d].entry = v))} />
            <Num label="失敗扣分 %" value={draft.tuning[d].failPct} onChange={(v) => edit((c) => (c.tuning[d].failPct = v))} step={0.5} />
            <Num label="單節勝分" value={draft.tuning[d].roundWin} onChange={(v) => edit((c) => (c.tuning[d].roundWin = v))} />
            <Num label="單節敗分" value={draft.tuning[d].roundLoss} onChange={(v) => edit((c) => (c.tuning[d].roundLoss = v))} />
            <Num label="過關獎勵" value={draft.tuning[d].passReward} onChange={(v) => edit((c) => (c.tuning[d].passReward = v))} />
          </div>
        </Group>
      ))}

      <Group title="獎勵倍率與上限">
        <div className="grid grid-cols-2 gap-2">
          <Num label="獎勵倍率" step={0.1} value={draft.rewardMultiplier} onChange={(v) => edit((c) => (c.rewardMultiplier = v))} />
          <Num label="首次過關倍率" step={0.1} value={draft.welfare.firstClearMultiplier} onChange={(v) => edit((c) => (c.welfare.firstClearMultiplier = v))} />
          <Num label="重玩獎勵倍率" step={0.05} value={draft.welfare.replayMultiplier} onChange={(v) => edit((c) => (c.welfare.replayMultiplier = v))} />
          <Num label="解鎖結局獎勵" value={draft.welfare.endingBonus} onChange={(v) => edit((c) => (c.welfare.endingBonus = v))} />
          <Num label="每日淨賺上限" value={draft.caps.daily} onChange={(v) => edit((c) => (c.caps.daily = v))} />
          <Num label="每週淨賺上限" value={draft.caps.weekly} onChange={(v) => edit((c) => (c.caps.weekly = v))} />
          <Num label="每日上限倍率" step={0.1} value={draft.caps.dailyMult} onChange={(v) => edit((c) => (c.caps.dailyMult = v))} />
          <Num label="每週上限倍率" step={0.1} value={draft.caps.weeklyMult} onChange={(v) => edit((c) => (c.caps.weeklyMult = v))} />
          <Num label="超額後獎勵比例" step={0.05} value={draft.caps.overflowRate} onChange={(v) => edit((c) => (c.caps.overflowRate = v))} />
        </div>
      </Group>

      <Group title="邀請與好友互贈">
        <div className="grid grid-cols-2 gap-2">
          <Num label="新手初始贈分" value={draft.welfare.startBonus} onChange={(v) => edit((c) => (c.welfare.startBonus = v))} />
          <Num label="簽到倍率" step={0.1} value={draft.welfare.checkinMultiplier} onChange={(v) => edit((c) => (c.welfare.checkinMultiplier = v))} />
          <Num label="邀請人獎勵" value={draft.welfare.inviterBonus} onChange={(v) => edit((c) => (c.welfare.inviterBonus = v))} />
          <Num label="被邀請人獎勵" value={draft.welfare.inviteeBonus} onChange={(v) => edit((c) => (c.welfare.inviteeBonus = v))} />
          <Num label="每人每月邀請上限" value={draft.welfare.inviteMonthlyCap} onChange={(v) => edit((c) => (c.welfare.inviteMonthlyCap = v))} />
          <Num label="每日互贈次數上限" value={draft.social.dailyGiftLimit} onChange={(v) => edit((c) => (c.social.dailyGiftLimit = v))} />
        </div>
      </Group>

      <Group title="寶物商店">
        <ul className="flex flex-col gap-3">
          {ITEM_TYPES.map((t) => (
            <li key={t} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <Num label={`${ITEM_META[t].name.zh} 售價`} value={draft.shop[t].price} onChange={(v) => edit((c) => (c.shop[t].price = v))} />
              <Num label="兌回價" value={draft.shop[t].buyback} onChange={(v) => edit((c) => (c.shop[t].buyback = v))} />
              <div className="flex flex-col items-center gap-1 pb-1.5 text-xs text-muted-foreground">
                上架
                <Switch
                  checked={draft.shop[t].active}
                  onCheckedChange={(v) => edit((c) => (c.shop[t].active = v))}
                  aria-label={`${ITEM_META[t].name.zh} 上架`}
                />
              </div>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Pi 兌換">
        <div className="grid grid-cols-2 gap-2">
          <Num label="1 Pi = 幾分" value={draft.piExchange.pointsPerPi} onChange={(v) => edit((c) => (c.piExchange.pointsPerPi = v))} />
          <Num label="1 代幣 = 幾分" value={draft.piExchange.pointsPerToken} onChange={(v) => edit((c) => (c.piExchange.pointsPerToken = v))} />
        </div>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          收款地址
          <Input
            value={draft.piExchange.walletAddress}
            onChange={(e) => edit((c) => (c.piExchange.walletAddress = e.target.value))}
            className="text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          備註提示文字
          <Input
            value={draft.piExchange.memoHint}
            onChange={(e) => edit((c) => (c.piExchange.memoHint = e.target.value))}
            className="text-foreground"
          />
        </label>
      </Group>

      <Group title="排行榜每週獎勵">
        <ul className="flex flex-col gap-2">
          {draft.leaderboardRewards.map((r, i) => (
            <li key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-1.5">
              <Num label="起名次" value={r.from} onChange={(v) => edit((c) => (c.leaderboardRewards[i].from = v))} />
              <Num label="迄名次" value={r.to} onChange={(v) => edit((c) => (c.leaderboardRewards[i].to = v))} />
              <Num label="分數" value={r.points} onChange={(v) => edit((c) => (c.leaderboardRewards[i].points = v))} />
              <Num label="代幣" value={r.tokens} onChange={(v) => edit((c) => (c.leaderboardRewards[i].tokens = v))} />
              <Button
                size="icon"
                variant="ghost"
                aria-label="刪除此級距"
                onClick={() => edit((c) => c.leaderboardRewards.splice(i, 1))}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          onClick={() => edit((c) => c.leaderboardRewards.push({ from: 51, to: 100, points: 200, tokens: 0 }))}
        >
          <Plus className="size-4" aria-hidden="true" />
          新增級距
        </Button>
      </Group>

      <Group title="福利站活動">
        <ul className="flex flex-col gap-3">
          {draft.events.map((e, i) => (
            <li key={e.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  標題（中）
                  <Input value={e.title.zh} onChange={(ev) => edit((c) => (c.events[i].title.zh = ev.target.value))} className="text-foreground" />
                </label>
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  Title (EN)
                  <Input value={e.title.en} onChange={(ev) => edit((c) => (c.events[i].title.en = ev.target.value))} className="text-foreground" />
                </label>
                <Num label="分數" value={e.points} onChange={(v) => edit((c) => (c.events[i].points = v))} />
                <Num label="代幣" value={e.tokens} onChange={(v) => edit((c) => (c.events[i].tokens = v))} />
                <Num label="總名額（0 為不限）" value={e.total} onChange={(v) => edit((c) => (c.events[i].total = v))} />
                <div className="flex items-end gap-2 pb-2 text-xs text-muted-foreground">
                  啟用
                  <Switch checked={e.active} onCheckedChange={(v) => edit((c) => (c.events[i].active = v))} aria-label="啟用活動" />
                </div>
              </div>
              <Button size="sm" variant="ghost" className="self-end" onClick={() => edit((c) => c.events.splice(i, 1))}>
                <Trash2 className="size-4" aria-hidden="true" />
                刪除活動
              </Button>
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          onClick={() =>
            edit((c) =>
              c.events.push({
                id: `evt_${Date.now().toString(36)}`,
                title: { zh: "新活動", en: "New event" },
                points: 500,
                tokens: 0,
                total: 100,
                active: false,
              }),
            )
          }
        >
          <Plus className="size-4" aria-hidden="true" />
          新增活動
        </Button>
      </Group>

      <Group title="遊戲主題上架 / 下架">
        <ul className="flex flex-col gap-2">
          {GAME_IDS.map((g) => (
            <li key={g} className="flex items-center justify-between">
              <span>{GAME_LABEL[g]}</span>
              <Switch
                checked={draft.games[g].enabled}
                onCheckedChange={(v) => edit((c) => (c.games[g].enabled = v))}
                aria-label={`${GAME_LABEL[g]} 上架`}
              />
            </li>
          ))}
        </ul>
      </Group>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Button className="flex-1" size="lg" disabled={saving} onClick={save}>
            儲存設定
          </Button>
          <Button variant="secondary" size="lg" onClick={reset}>
            還原預設
          </Button>
        </div>
      </div>
    </div>
  );
}
