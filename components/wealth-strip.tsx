"use client";

import { Coins } from "lucide-react";
import { useGame } from "@/contexts/game-context";

export function WealthStrip() {
  const { profile, tr } = useGame();
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-3 py-2 text-sm">
      <span className="flex items-center gap-1.5 font-bold text-primary">
        <Coins className="size-4" aria-hidden="true" />
        {profile.points.toLocaleString()}
        <span className="text-xs font-normal text-muted-foreground">{tr("分", "pts")}</span>
      </span>
      <span className="text-muted-foreground">
        {tr("代幣", "Tokens")}{" "}
        <span className="font-bold text-foreground">{profile.tokens}</span>
      </span>
    </div>
  );
}
