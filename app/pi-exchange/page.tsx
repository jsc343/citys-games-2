"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageBody, PageHeader } from "@/components/page-header";
import { useGame } from "@/contexts/game-context";
import { errorReason, getJson, postJson } from "@/lib/client-api";
import { reasonMessage } from "@/lib/reasons";
import type { ExchangeRecord, ExchangeStatus } from "@/lib/types";

export default function PiExchangePage() {
  const { tr, uid, username, config, lang } = useGame();
  const [amount, setAmount] = useState("1");
  const [target, setTarget] = useState<"points" | "tokens">("points");
  const [sending, setSending] = useState(false);
  const [current, setCurrent] = useState<ExchangeRecord | null>(null);

  const { data, mutate } = useSWR(
    ["exchange", uid],
    () => getJson<{ records: ExchangeRecord[] }>(`/api/app/exchange?uid=${encodeURIComponent(uid)}`),
    { refreshInterval: 20000 },
  );

  const { pointsPerPi, pointsPerToken, walletAddress, memoHint } = config.piExchange;
  const pi = Number(amount);
  const valid = Number.isFinite(pi) && pi > 0 && pi <= 1000;
  const totalPoints = valid ? Math.floor(pi * pointsPerPi) : 0;
  const tokens = Math.floor(totalPoints / pointsPerToken);

  const statusLabels: Record<ExchangeStatus, string> = {
    pending: tr("待確認", "Pending"),
    confirmed: tr("已入帳", "Credited"),
    rejected: tr("已拒絕", "Rejected"),
  };

  const create = async () => {
    setSending(true);
    try {
      const res = await postJson<{ record: ExchangeRecord }>("/api/app/exchange", {
        uid,
        username,
        pi,
        target,
      });
      setCurrent(res.record);
      await mutate();
      toast.success(tr("兌換單已建立，請依下方資訊付款", "Order created. Pay using the details below."));
    } catch (e) {
      toast.error(reasonMessage(errorReason(e), tr));
    } finally {
      setSending(false);
    }
  };

  const memo = current ? `${current.id}${memoHint ? ` ${memoHint}` : ""}` : "";
  const qrValue = current ? `${walletAddress}\n${current.id}\n${current.pi} Pi` : "";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(tr("已複製", "Copied"));
    } catch {
      toast.error(tr("無法複製", "Couldn't copy"));
    }
  };

  return (
    <>
      <PageHeader title={tr("Pi 兌換", "Pi exchange")} />
      <PageBody>
        <section className="flex flex-col gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-4">
          <h2 className="flex items-center gap-2 font-black">
            <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
            {tr("注意事項", "Please note")}
          </h2>
          <ul className="list-disc pl-5 text-sm leading-relaxed">
            <li>{tr("兌換不可逆轉。", "Exchanges cannot be undone.")}</li>
            <li>{tr("兌換所得僅限遊戲內使用。", "What you receive can only be used in-game.")}</li>
            <li>{tr("操作前請保留截圖與紀錄。", "Keep screenshots and records before you pay.")}</li>
            <li>{tr("入帳可能延遲，請稍後查詢。", "Crediting may be delayed. Please check again later.")}</li>
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 text-sm">
          <p className="font-black">{tr("兌換比例", "Rates")}</p>
          <p className="mt-1 text-muted-foreground">
            1 Pi = {pointsPerPi.toLocaleString()} {tr("分", "pts")} · 1 {tr("代幣", "token")} = {pointsPerToken.toLocaleString()}{" "}
            {tr("分", "pts")}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-black">{tr("1. 輸入兌換數量", "1. Enter an amount")}</h2>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="decimal"
              min={0.01}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label={tr("Pi 數量", "Pi amount")}
            />
            <span className="font-black">Pi</span>
          </div>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            <Button role="radio" aria-checked={target === "points"} variant={target === "points" ? "default" : "secondary"} onClick={() => setTarget("points")}>
              {tr("兌換遊戲幣", "Get points")}
            </Button>
            <Button role="radio" aria-checked={target === "tokens"} variant={target === "tokens" ? "default" : "secondary"} onClick={() => setTarget("tokens")}>
              {tr("兌換代幣", "Get tokens")}
            </Button>
          </div>
          <p className="rounded-lg bg-secondary p-3 text-sm">
            {valid
              ? target === "points"
                ? tr(`可得 ${totalPoints.toLocaleString()} 分`, `You receive ${totalPoints.toLocaleString()} pts`)
                : tr(`可得 ${tokens.toLocaleString()} 代幣`, `You receive ${tokens.toLocaleString()} tokens`)
              : tr("請輸入 0 到 1000 之間的數量", "Enter an amount between 0 and 1000")}
          </p>
          <Button size="lg" disabled={!valid || sending} onClick={create}>
            {tr("建立兌換單", "Create order")}
          </Button>
        </section>

        {current && (
          <section className="flex flex-col gap-3 rounded-xl border border-primary bg-card p-4">
            <h2 className="font-black">{tr("2. 付款資訊", "2. Payment details")}</h2>
            {walletAddress ? (
              <>
                <div className="mx-auto w-fit rounded-lg p-3" style={{ backgroundColor: "#ffffff" }}>
                  <QRCodeSVG value={qrValue} size={176} bgColor="#ffffff" fgColor="#000000" />
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  <p className="text-xs text-muted-foreground">{tr("收款地址", "Wallet address")}</p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all rounded bg-secondary px-2 py-1 text-xs">{walletAddress}</code>
                    <Button size="icon" variant="secondary" aria-label={tr("複製地址", "Copy address")} onClick={() => copy(walletAddress)}>
                      <Copy className="size-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{tr("備註 (Memo)", "Memo")}</p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all rounded bg-secondary px-2 py-1 text-xs">{memo}</code>
                    <Button size="icon" variant="secondary" aria-label={tr("複製備註", "Copy memo")} onClick={() => copy(current.id)}>
                      <Copy className="size-4" />
                    </Button>
                  </div>
                  <p className="mt-2 font-bold">
                    {tr("應付", "Amount due")}: {current.pi} Pi
                  </p>
                </div>
              </>
            ) : (
              <p className="rounded-lg bg-secondary p-3 text-sm">
                {tr(
                  "收款資訊尚未設定，請稍後再試或聯絡管理員。",
                  "Payment details haven't been set up yet. Please try again later or contact the team.",
                )}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {tr(
                "3. 支付後，系統確認入帳會自動加到你的帳戶。請至下方記錄查看狀態。",
                "3. After you pay, the credit is added to your account once confirmed. Check the status in your records below.",
              )}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button asChild variant="secondary">
                <Link href="/">{tr("首頁", "Home")}</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/settings">{tr("設定", "Settings")}</Link>
              </Button>
              <Button asChild>
                <Link href="/lobby">{tr("大廳", "Lobby")}</Link>
              </Button>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-black">{tr("我的兌換記錄", "My exchange records")}</h2>
          {!data || data.records.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              {tr("尚無記錄。", "No records yet.")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.records.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {r.pi} Pi {"->"}{" "}
                      {r.target === "points"
                        ? `${r.points.toLocaleString()} ${tr("分", "pts")}`
                        : `${r.tokens.toLocaleString()} ${tr("代幣", "tokens")}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString(lang === "zh" ? "zh-TW" : "en-US")} · {r.id}
                    </p>
                  </div>
                  <Badge variant={r.status === "confirmed" ? "default" : "outline"}>{statusLabels[r.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageBody>
    </>
  );
}
