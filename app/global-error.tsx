"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-Hant">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          background: "#12222b",
          color: "#f1ead8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 22 }}>頁面發生問題 / Something went wrong</h1>
        <p style={{ maxWidth: 320, wordBreak: "break-word", opacity: 0.8 }}>
          {error?.message || "Unknown error"}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            border: 0,
            background: "#e0b455",
            color: "#12222b",
            fontWeight: 700,
          }}
        >
          重新載入 / Try again
        </button>
      </body>
    </html>
  );
}
