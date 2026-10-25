"use client";

import useSWR from "swr";
import { Spinner } from "@/components/ui/spinner";
import { Dashboard } from "@/components/admin/dashboard";
import { LoginPanel } from "@/components/admin/login-panel";
import { getJson } from "@/lib/client-api";

export default function AdminPage() {
  const { data, isLoading, mutate } = useSWR(
    "adm-me",
    () => getJson<{ email: string }>("/api/admin/me").catch(() => null),
    { revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }
  if (!data) return <LoginPanel onDone={() => void mutate()} />;
  return <Dashboard email={data.email} onLogout={() => void mutate(null, { revalidate: false })} />;
}
