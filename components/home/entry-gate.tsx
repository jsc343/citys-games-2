"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Coins, Eye, EyeOff, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGame } from "@/contexts/game-context";
import { cn } from "@/lib/utils";

type Mode = "trial" | "pi";

async function hashPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${email.trim().toLowerCase()}::${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EntryGate() {
  const { tr, profile, saveAccount } = useGame();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("trial");
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState<Record<Mode, { name: string; email: string; password: string }>>({
    trial: { name: profile.account.trial.name, email: profile.account.trial.email, password: "" },
    pi: { name: profile.account.pi.name, email: profile.account.pi.email, password: "" },
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const current = form[mode];
  const saved = profile.account[mode];
  const complete =
    current.name.trim().length > 0 && EMAIL_RE.test(current.email.trim()) && current.password.length >= 6;

  function patch(m: Mode, key: "name" | "email" | "password", value: string) {
    setError("");
    setForm((f) => ({ ...f, [m]: { ...f[m], [key]: value } }));
  }

  async function enter() {
    if (!complete || busy) return;
    setBusy(true);
    const hash = await hashPassword(current.email, current.password);
    if (saved.hash && saved.hash !== hash && saved.email === current.email.trim()) {
      setError(tr("密碼不正確，請再試一次。", "Wrong password. Please try again."));
      setBusy(false);
      return;
    }
    saveAccount(mode, { name: current.name.trim(), email: current.email.trim(), hash });
    router.push("/lobby");
  }

  const options: { id: Mode; icon: typeof Coins; title: string; hint: string; nameLabel: string; emailLabel: string }[] = [
    {
      id: "trial",
      icon: FlaskConical,
      title: tr("試玩分數", "Trial points"),
      hint: tr("先用試玩分數體驗遊戲。", "Try the game with trial points first."),
      nameLabel: tr("用戶名稱", "Player name"),
      emailLabel: tr("自設郵箱", "Your email"),
    },
    {
      id: "pi",
      icon: Coins,
      title: tr("Pi 代幣分數", "Pi token points"),
      hint: tr("以 Pi 帳號身分進入。", "Enter with your Pi account."),
      nameLabel: tr("Pi 用戶名稱", "Pi username"),
      emailLabel: tr("Pi 用戶郵箱", "Pi email"),
    },
  ];

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4" aria-labelledby="entry-title">
      <h2 id="entry-title" className="text-xl font-black">
        {tr("登入遊戲", "Sign in to play")}
      </h2>

      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label={tr("選擇進入方式", "Choose how to enter")}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={mode === o.id}
            onClick={() => {
              setMode(o.id);
              setError("");
            }}
            className={cn(
              "flex min-h-16 flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
              mode === o.id ? "border-primary bg-primary/10" : "border-border bg-muted/40",
            )}
          >
            <span className="flex items-center gap-2 font-black">
              <o.icon className="size-4 text-primary" aria-hidden="true" />
              {o.title}
            </span>
            <span className="text-xs leading-snug text-muted-foreground">{o.hint}</span>
          </button>
        ))}
      </div>

      {options
        .filter((o) => o.id === mode)
        .map((o) => (
          <form
            key={o.id}
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void enter();
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${o.id}-name`}>{o.nameLabel}</Label>
              <Input
                id={`${o.id}-name`}
                autoComplete="username"
                value={form[o.id].name}
                onChange={(e) => patch(o.id, "name", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${o.id}-email`}>{o.emailLabel}</Label>
              <Input
                id={`${o.id}-email`}
                type="email"
                autoComplete="email"
                value={form[o.id].email}
                onChange={(e) => patch(o.id, "email", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${o.id}-pw`}>{tr("自設密碼（至少 6 碼）", "Password (6+ characters)")}</Label>
              <div className="relative">
                <Input
                  id={`${o.id}-pw`}
                  type={showPw ? "text" : "password"}
                  autoComplete={saved.hash ? "current-password" : "new-password"}
                  value={form[o.id].password}
                  onChange={(e) => patch(o.id, "password", e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? tr("隱藏密碼", "Hide password") : tr("顯示密碼", "Show password")}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="text-sm font-bold text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={!complete || busy}
              className="h-12 text-base font-black disabled:bg-muted disabled:text-muted-foreground"
            >
              {tr("進入遊戲大廳", "Enter the lobby")}
              <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
            {!complete && (
              <p className="text-center text-xs text-muted-foreground">
                {tr("填寫完整資料後即可進入。", "Fill in every field to enter.")}
              </p>
            )}
          </form>
        ))}
    </section>
  );
}
