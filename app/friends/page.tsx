"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageBody, PageHeader } from "@/components/page-header";
import { useGame } from "@/contexts/game-context";
import { reasonMessage } from "@/lib/reasons";

export default function FriendsPage() {
  const { tr, inviteCode, profile, social, config, redeemInvite, addFriend, removeFriend } = useGame();
  const [redeem, setRedeem] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const [busy, setBusy] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success(tr("已複製邀請碼", "Invite code copied"));
    } catch {
      toast.error(tr("無法複製，請手動記下", "Couldn't copy. Please note it down."));
    }
  };

  return (
    <>
      <PageHeader title={tr("好友與邀請", "Friends & invites")} />
      <PageBody>
        <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-muted-foreground">{tr("我的邀請碼", "My invite code")}</h2>
          <div className="flex items-center gap-2">
            <p className="flex-1 text-3xl font-black tracking-widest text-primary">{inviteCode}</p>
            <Button variant="secondary" size="icon" onClick={copy} aria-label={tr("複製", "Copy")}>
              <Copy className="size-5" />
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {tr(
              `新玩家輸入你的邀請碼並完成第 1 關後，你可獲得 ${config.welfare.inviterBonus.toLocaleString()} 分，對方獲得 ${config.welfare.inviteeBonus.toLocaleString()} 分。每月最多 ${config.welfare.inviteMonthlyCap} 人。`,
              `When a new player enters your code and clears level 1, you get ${config.welfare.inviterBonus.toLocaleString()} points and they get ${config.welfare.inviteeBonus.toLocaleString()}. Up to ${config.welfare.inviteMonthlyCap} people per month.`,
            )}
          </p>
        </section>

        {!profile.invite.invitedBy && (
          <section className="flex flex-col gap-2">
            <h2 className="font-black">{tr("輸入邀請碼", "Enter an invite code")}</h2>
            <div className="flex gap-2">
              <Input
                value={redeem}
                onChange={(e) => setRedeem(e.target.value.toUpperCase())}
                placeholder={tr("朋友的邀請碼", "Friend's code")}
                maxLength={12}
                aria-label={tr("邀請碼", "Invite code")}
              />
              <Button
                disabled={busy || redeem.trim().length < 3}
                onClick={async () => {
                  setBusy(true);
                  const r = await redeemInvite(redeem);
                  setBusy(false);
                  if (r.ok) {
                    toast.success(tr("邀請碼已登記，完成第 1 關即可獲得獎勵", "Code saved. Clear level 1 to get your reward."));
                    setRedeem("");
                  } else toast.error(reasonMessage(r.reason, tr));
                }}
              >
                {tr("送出", "Submit")}
              </Button>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-black">{tr("加入好友", "Add a friend")}</h2>
          <div className="flex gap-2">
            <Input
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
              placeholder={tr("好友的邀請碼", "Friend's code")}
              maxLength={12}
              aria-label={tr("好友邀請碼", "Friend code")}
            />
            <Button
              disabled={busy || friendCode.trim().length < 3}
              onClick={async () => {
                setBusy(true);
                const r = await addFriend(friendCode);
                setBusy(false);
                if (r.ok) {
                  toast.success(tr("已加入好友", "Friend added"));
                  setFriendCode("");
                } else toast.error(reasonMessage(r.reason, tr));
              }}
            >
              {tr("加入", "Add")}
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-black">
            {tr("好友清單", "Friends")} ({social.friends.length})
          </h2>
          {social.friends.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              {tr("還沒有好友，輸入對方的邀請碼即可加入。", "No friends yet. Enter someone's code to add them.")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {social.friends.map((f) => (
                <li key={f.uid} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{f.username}</p>
                    <p className="text-xs text-muted-foreground">{f.code}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={tr("刪除好友", "Remove friend")}
                    onClick={() => removeFriend(f.uid)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageBody>
    </>
  );
}
