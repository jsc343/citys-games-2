"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/page-header";
import { WealthStrip } from "@/components/wealth-strip";
import { ItemIcon } from "@/components/item-icon";
import { useGame } from "@/contexts/game-context";
import { ITEM_META } from "@/lib/items";
import { reasonMessage } from "@/lib/reasons";
import { ITEM_TYPES } from "@/lib/types";

export default function ShopPage() {
  const { tr, pick, config, profile, buyItem } = useGame();
  return (
    <>
      <PageHeader title={tr("寶物商店", "Item shop")} />
      <PageBody>
        <WealthStrip />
        <p className="text-sm leading-relaxed text-muted-foreground">
          {tr(
            "以遊戲幣購買寶物，存入背包後可在關卡中使用。",
            "Buy items with points. They go to your bag and can be used in levels.",
          )}
        </p>
        <ul className="flex flex-col gap-3">
          {ITEM_TYPES.map((t) => {
            const entry = config.shop[t];
            const meta = ITEM_META[t];
            const afford = profile.points >= entry.price;
            return (
              <li key={t} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <ItemIcon type={t} className="size-6 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-black">
                    {pick(meta.name)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {tr("持有", "Owned")} {profile.items[t]}
                    </span>
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{pick(meta.effect)}</p>
                  <p className="mt-1 text-sm font-bold text-primary">
                    {entry.price.toLocaleString()} {tr("分", "pts")}
                  </p>
                </div>
                <Button
                  disabled={!entry.active || !afford}
                  onClick={() => {
                    const r = buyItem(t);
                    if (r.ok) toast.success(tr("購買成功", "Purchased"));
                    else toast.error(reasonMessage(r.reason, tr));
                  }}
                >
                  {entry.active ? tr("購買", "Buy") : tr("已下架", "Off sale")}
                </Button>
              </li>
            );
          })}
        </ul>
      </PageBody>
    </>
  );
}
