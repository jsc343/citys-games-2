"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorReason, getJson, postJson } from "@/lib/client-api";

interface SystemInfo {
  admins: { email: string; passwordSet: boolean; protected: boolean }[];
  me: string;
  emailConfigured: boolean;
}

const MSG: Record<string, string> = {
  invalid_code: "驗證碼不正確或已過期",
  weak_password: "密碼至少需要 8 個字元",
  too_soon: "請稍候 30 秒再重新取得驗證碼",
  exists: "此信箱已是管理員",
  invalid: "信箱格式不正確",
  protected: "此帳號無法移除",
};

export function SystemPanel() {
  const { data, mutate } = useSWR("adm-system", () => getJson<SystemInfo>("/api/admin/system"));
  const [newAdmin, setNewAdmin] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const err = (e: unknown) => toast.error(MSG[errorReason(e)] ?? "操作失敗");

  if (!data) return <p className="text-sm text-muted-foreground">載入中…</p>;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <h2 className="font-black">變更密碼</h2>
        <p className="text-xs text-muted-foreground">需要先以 {data.me} 取得信箱驗證碼。</p>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              const res = await postJson<{ devCode?: string }>("/api/admin/request-code", {});
              setCodeSent(true);
              setDevCode(res.devCode ?? null);
              toast.success("驗證碼已寄出");
            } catch (e) {
              err(e);
            }
          }}
        >
          寄送驗證碼
        </Button>
        {devCode && (
          <p className="rounded-lg bg-secondary p-3 text-sm">
            測試環境驗證碼：<span className="font-black text-primary">{devCode}</span>
          </p>
        )}
        {codeSent && (
          <>
            <Input inputMode="numeric" maxLength={6} placeholder="驗證碼" aria-label="驗證碼" value={code} onChange={(e) => setCode(e.target.value)} />
            <Input type="password" autoComplete="new-password" placeholder="新密碼（至少 8 字元）" aria-label="新密碼" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button
              disabled={code.length < 6 || password.length < 8}
              onClick={async () => {
                try {
                  await postJson("/api/admin/set-password", { code, password });
                  toast.success("密碼已變更");
                  setCode("");
                  setPassword("");
                  setCodeSent(false);
                  setDevCode(null);
                } catch (e) {
                  err(e);
                }
              }}
            >
              確認變更
            </Button>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <h2 className="font-black">管理員帳號</h2>
        <ul className="flex flex-col gap-2">
          {data.admins.map((a) => (
            <li key={a.email} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{a.email}</span>
              <Badge variant={a.passwordSet ? "default" : "outline"}>{a.passwordSet ? "已設密碼" : "未設密碼"}</Badge>
              {!a.protected && a.email !== data.me && (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`移除 ${a.email}`}
                  onClick={async () => {
                    try {
                      await postJson("/api/admin/admin-remove", { email: a.email });
                      await mutate();
                    } catch (e) {
                      err(e);
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input type="email" placeholder="新增管理員信箱" aria-label="新增管理員信箱" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} />
          <Button
            disabled={!newAdmin}
            onClick={async () => {
              try {
                await postJson("/api/admin/admin-add", { email: newAdmin });
                setNewAdmin("");
                await mutate();
                toast.success("已新增，對方首次登入時需設定密碼");
              } catch (e) {
                err(e);
              }
            }}
          >
            新增
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="mb-1 font-black text-foreground">系統狀態</h2>
        <p>驗證碼郵件服務：{data.emailConfigured ? "已設定" : "尚未設定（測試環境會直接顯示驗證碼）"}</p>
        <p className="mt-1">其餘系統參數與遊戲主題上架，請至「設定」分頁調整。</p>
      </section>
    </div>
  );
}
