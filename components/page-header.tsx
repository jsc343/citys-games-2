"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageButton } from "@/components/language-button";
import { PiLogo } from "@/components/pi-logo";
import { useGame } from "@/contexts/game-context";

export function PageHeader({
  title,
  backHref = "/lobby",
}: {
  title: string;
  backHref?: string;
}) {
  const { tr } = useGame();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/90 px-3 py-2 backdrop-blur">
      <Button asChild variant="ghost" size="icon" aria-label={tr("返回", "Back")}>
        <Link href={backHref}>
          <ChevronLeft className="size-5" />
        </Link>
      </Button>
      <PiLogo className="size-7 text-base" />
      <h1 className="min-w-0 flex-1 truncate text-lg font-black">{title}</h1>
      <LanguageButton />
    </header>
  );
}

export function PageBody({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-16 pt-4">
      {children}
    </main>
  );
}
