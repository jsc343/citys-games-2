"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBody, PageHeader } from "@/components/page-header";
import { WealthStrip } from "@/components/wealth-strip";
import { ItemIcon } from "@/components/item-icon";
import { useGame } from "@/contexts/game-context";
import { swapRate } from "@/lib/economy";
import { ITEM_META } from "@/lib/items";
import { reasonMessage } from "@/lib/reasons";
import { ITEM_TYPES, type ItemType } from "@/lib/types";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground";

export default function ExchangePage() {
  const {
    tr,
    pick,
    config,
    profile,
    social,
    giftsLeft,
    sellItem,
    swapItem,
    tokensToPoints,
    giftItem,
  } = useGame();
  const [from, setFrom] = useState<ItemType>("weapon");
  const [to, setTo] = useState<ItemType>("energy");
  const [giftType, setGiftType] = useState<ItemType>("weapon");
  const [tokenQty, setTokenQty] = useState("1");
  const [busy, setBusy] = useState<string | null>(null);

  const rate = from !== to ? swapRate(config, from, to) : null;

  return (
    <>
      <PageHeader title={tr("寶物交換站", "Exchange")} />
      <PageBody>
        <WealthStrip />
        <Tabs defaultValue="system">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="system">{tr("系統交換", "System")}</TabsTrigger>
            <TabsTrigger value="friends">{tr("好友互贈", "Gift friends")}</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="mt-4 flex flex-col gap-5">
            <section className="flex flex-col gap-2">
              <h2 className="font-black">{tr("寶物兌換遊戲幣", "Sell items for points")}</h2>
              <p className="text-xs text-muted-foreground">
                {tr("兌回價為售價的 5 折。", "Buyback is half of the shop price.")}
              </p>
              <ul className="flex flex-col gap-2">
                {ITEM_TYPES.map((t) => (
                  <li key={t} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <ItemIcon type={t} className="size-5 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {pick(ITEM_META[t].name)} x{profile.items[t]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tr("兌回", "Buyback")} {config.shop[t].buyback.toLocaleString()} {tr("分", "pts")}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      disabled={profile.items[t] < 1}
                      onClick={() => {
                        const r = sellItem(t);
                        if (r.ok) toast.success(tr("已兌換遊戲幣", "Converted to points"));
                        else toast.error(reasonMessage(r.reason, tr));
                      }}
                    >
                      {tr("兌換", "Sell")}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-black">{tr("等值寶物互換", "Swap items")}</h2>
              <div className="flex items-center gap-2">
                <select
                  className={selectClass}
                  value={from}
                  onChange={(e) => setFrom(e.target.value as ItemType)}
                  aria-label={tr("交出", "Give")}
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {pick(ITEM_META[t].name)}
                    </option>
                  ))}
                </select>
                <ArrowRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <select
                  className={selectClass}
                  value={to}
                  onChange={(e) => setTo(e.target.value as ItemType)}
                  aria-label={tr("換得", "Receive")}
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {pick(ITEM_META[t].name)}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-muted-foreground">
                {rate
                  ? tr(
                      `${rate.give} 個換 ${rate.get} 個（依售價等值計算）`,
                      `${rate.give} for ${rate.get} (by shop price)`,
                    )
                  : tr("請選擇不同的類別", "Pick two different categories")}
              </p>
              <Button
                disabled={!rate}
                onClick={() => {
                  const r = swapItem(from, to);
                  if (r.ok) toast.success(tr("互換完成", "Swapped"));
                  else toast.error(reasonMessage(r.reason, tr));
                }}
              >
                {tr("確認互換", "Swap")}
              </Button>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-black">{tr("代幣兌換遊戲幣", "Tokens to points")}</h2>
              <p className="text-xs text-muted-foreground">
                1 {tr("代幣", "token")} = {config.piExchange.pointsPerToken.toLocaleString()} {tr("分", "pts")}
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={tokenQty}
                  onChange={(e) => setTokenQty(e.target.value)}
                  aria-label={tr("代幣數量", "Token amount")}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const r = tokensToPoints(Number(tokenQty));
                    if (r.ok) toast.success(tr("兌換完成", "Converted"));
                    else toast.error(reasonMessage(r.reason, tr));
                  }}
                >
                  {tr("兌換", "Convert")}
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="friends" className="mt-4 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {tr(
                `僅限好友清單對象，今日還可贈送 ${giftsLeft} 次。`,
                `Friends only. You can send ${giftsLeft} more gift(s) today.`,
              )}
            </p>
            <select
              className={selectClass}
              value={giftType}
              onChange={(e) => setGiftType(e.target.value as ItemType)}
              aria-label={tr("贈送寶物", "Item to gift")}
            >
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {pick(ITEM_META[t].name)} x{profile.items[t]}
                </option>
              ))}
            </select>
            {social.friends.length === 0 ? (
              <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border p-4 text-sm">
                <p>{tr("還沒有好友。", "You have no friends yet.")}</p>
                <Button asChild variant="secondary">
                  <Link href="/friends">{tr("前往好友頁", "Go to friends")}</Link>
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {social.friends.map((f) => (
                  <li key={f.uid} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <span className="min-w-0 flex-1 truncate font-bold">{f.username}</span>
                    <Button
                      disabled={busy === f.uid || giftsLeft < 1 || profile.items[giftType] < 1}
                      onClick={async () => {
                        setBusy(f.uid);
                        const r = await giftItem(f, giftType);
                        setBusy(null);
                        if (r.ok) toast.success(tr("已送出", "Gift sent"));
                        else toast.error(reasonMessage(r.reason, tr));
                      }}
                    >
                      {tr("贈送", "Gift")}
                    </Button>
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
