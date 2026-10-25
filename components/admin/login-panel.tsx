"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, errorReason, postJson } from "@/lib/client-api";

const MESSAGES: Record<string, string> = {
  not_admin: "此信箱不是管理員信箱，無法進入後台",
  needs_setup: "此帳號尚未設定密碼，請使用「首次登入 / 忘記密碼」",
  bad_password: "密碼不正確",
  rate_limit: "嘗試次數過多，請 15 分鐘後再試",
  too_soon: "驗證碼剛寄出，請稍候 30 秒再重新取得",
  invalid_code: "驗證碼不正確或已過期",
  weak_password: "密碼至少需要 8 個字元",
  not_configured: "後台尚未設定管理員金鑰，請先在專案變數中加入 ADMIN_SETUP_KEY",
};

type Mode = "login" | "verify";

function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  onKeyDown,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "隱藏密碼" : "顯示密碼"}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {shown ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
      </button>
    </div>
  );
}

export function LoginPanel({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const [problem, setProblem] = useState<string | null>(null);

  const fail = (e: unknown) => {
    const reason = errorReason(e);
    const detail =
      e instanceof ApiError && e.data && typeof e.data === "object"
        ? ((e.data as { detail?: string }).detail ?? null)
        : e instanceof ApiError && typeof e.data === "string"
          ? e.data.replace(/<[^>]*>/g, " ").trim().slice(0, 200) || null
          : e instanceof Error
            ? e.message
            : null;
    const status = e instanceof ApiError ? e.status : 0;
    const text =
      MESSAGES[reason] ??
      `操作失敗（${status || "無法連線"}${detail ? `：${detail}` : ""}）`;
    setProblem(text);
    toast.error(text);
  };

  const login = async () => {
    setBusy(true);
    try {
      await postJson("/api/admin/login", { email, password });
      onDone();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const requestCode = async () => {
    setBusy(true);
    try {
      setProblem(null);
      const res = await postJson<{ ok: boolean; sent?: boolean; devCode?: string; mailError?: string }>(
        "/api/admin/request-code",
        { email },
      );
      setCodeSent(true);
      setDevCode(res.devCode ?? null);
      if (res.sent === false) {
        const text = `驗證碼寄送失敗：${res.mailError ?? "未知原因"}`;
        setProblem(text);
        toast.error(text);
      } else {
        toast.success("若此信箱為管理員信箱，驗證碼已寄出");
      }
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const setNewPassword = async () => {
    setBusy(true);
    try {
      await postJson("/api/admin/set-password", { email, code, password });
      toast.success("密碼已設定");
      onDone();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-5 px-4 py-10">
      <div>
        <h1 className="text-2xl font-black">商家管理後台</h1>
        <p className="text-sm text-muted-foreground">City&apos;s Games(2) · 僅限指定管理員信箱</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="adm-email" className="text-sm font-bold">
          管理員信箱
        </label>
        <Input
          id="adm-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {problem && (
        <p role="alert" className="rounded-lg border border-destructive bg-card p-3 text-sm break-words text-destructive">
          {problem}
        </p>
      )}

      {mode === "login" ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="adm-pass" className="text-sm font-bold">
              密碼
            </label>
            <PasswordField
              id="adm-pass"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229 && email && password) login();
              }}
            />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            尚未設定密碼或收不到驗證碼時，可直接在密碼欄輸入「管理員金鑰」登入。
          </p>
          <Button size="lg" disabled={busy || !email || !password} onClick={login}>
            登入
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setMode("verify");
              setPassword("");
            }}
          >
            首次登入 / 忘記密碼
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-muted-foreground">
            先以信箱取得驗證碼（也可在驗證碼欄輸入管理員金鑰），再設定新密碼（至少 8 個字元）。
          </p>
          <Button variant="secondary" disabled={busy || !email} onClick={requestCode}>
            {codeSent ? "重新寄送驗證碼" : "寄送驗證碼"}
          </Button>
          {devCode && (
            <p className="rounded-lg border border-border bg-card p-3 text-sm">
              測試環境尚未設定郵件服務，驗證碼：<span className="font-black text-primary">{devCode}</span>
            </p>
          )}
          {codeSent && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="adm-code" className="text-sm font-bold">
                  驗證碼
                </label>
                <Input
                  id="adm-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="adm-newpass" className="text-sm font-bold">
                  新密碼
                </label>
                <PasswordField
                  id="adm-newpass"
                  autoComplete="new-password"
                  value={password}
                  onChange={setPassword}
                />
              </div>
              <Button size="lg" disabled={busy || code.length < 6 || password.length < 8} onClick={setNewPassword}>
                設定密碼並登入
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={() => setMode("login")}>
            返回登入
          </Button>
        </>
      )}
    </main>
  );
}
