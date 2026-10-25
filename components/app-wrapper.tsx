"use client";

import type { ReactNode } from "react";
import { PiAuthProvider, usePiAuth } from "@/contexts/pi-auth-context";
import { AuthLoadingScreen } from "./auth-loading-screen";

function AppContent({ children }: { children: ReactNode }) {
  const { isAuthenticated } = usePiAuth();
  if (!isAuthenticated) return <AuthLoadingScreen />;
  return <>{children}</>;
}

export function AppWrapper({ children }: { children: ReactNode }) {
  return (
    <PiAuthProvider>
      <AppContent>{children}</AppContent>
    </PiAuthProvider>
  );
}
