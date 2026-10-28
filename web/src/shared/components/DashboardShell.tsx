"use client";

import { useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { Alert } from "./Alert";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import { signOutUser } from "@/features/auth/services/authService";

export function DashboardShell({ greeting, children }: { greeting: string; children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    try {
      await signOutUser();
    } catch (failure) {
      setError(getErrorMessage(failure));
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
          <BrandLogo />
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-600 sm:inline">{greeting}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <LogOut aria-hidden className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">
        {error && <Alert tone="error">{error}</Alert>}
        {children}
      </main>
    </div>
  );
}
