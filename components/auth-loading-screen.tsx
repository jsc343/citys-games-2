"use client";

import { usePiAuth } from "@/contexts/pi-auth-context";

export function AuthLoadingScreen() {
  const { authMessage, hasError, reinitialize } = usePiAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-6 text-center space-y-6">
        <div className="flex justify-center">
          {hasError ? (
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-destructive"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          ) : (
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">
            {hasError ? "Authentication Failed" : "Pi Network Authentication"}
          </h2>
          <p
            className={`text-sm ${
              hasError ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {authMessage}
          </p>
        </div>

        {hasError && (
          <button
            onClick={reinitialize}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Retry Authentication
          </button>
        )}
      </div>
    </div>
  );
}
