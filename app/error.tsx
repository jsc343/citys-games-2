"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.log("[v0] Page error:", error?.message, error?.stack);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
      <h1 className="text-2xl font-black">頁面發生問題 / Something went wrong</h1>
      <p className="max-w-sm break-words text-sm text-muted-foreground">
        {error?.message || "Unknown error"}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground"
      >
        重新載入 / Try again
      </button>
    </main>
  );
}
