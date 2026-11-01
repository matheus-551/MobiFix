"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardList, History, LayoutDashboard, LogOut, Menu, Star, User, Wrench, X } from "lucide-react";
import { routes } from "@/routes";
import { signOutUser } from "@/features/auth/services/authService";
import { Alert } from "@/shared/components/Alert";
import { getFriendlyError } from "@/shared/lib/api/http";
import { useProvider } from "../context/ProviderContext";

const NAV_ITEMS = [
  { href: routes.providerHome, label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: routes.providerRequests, label: "Solicitações", Icon: ClipboardList, exact: false },
  { href: routes.providerSchedule, label: "Agenda", Icon: CalendarDays, exact: false },
  { href: routes.providerHistory, label: "Histórico", Icon: History, exact: false },
  { href: routes.providerReviews, label: "Avaliações", Icon: Star, exact: false },
  { href: routes.providerProfile, label: "Meu Perfil", Icon: User, exact: false },
] as const;

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <nav aria-label="Navegação do prestador" className="flex h-full flex-col gap-1 px-4 py-6">
      <Link href={routes.providerHome} onClick={onNavigate} className="mb-8 flex items-center gap-2 px-2 text-orange-500">
        <Wrench aria-hidden className="h-6 w-6" />
        <span className="text-xl font-extrabold">
          MobiFix <span className="text-xs font-bold text-gray-300">Pro</span>
        </span>
      </Link>
      {NAV_ITEMS.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
              active ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon aria-hidden className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ProviderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { displayName } = useProvider();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    try {
      await signOutUser();
    } catch (failure) {
      setError(getFriendlyError(failure));
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-[#1e2127] lg:block">
        <Sidebar pathname={pathname} onNavigate={() => undefined} />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="relative h-full w-64 bg-[#1e2127]">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-4 rounded p-1 text-gray-300 hover:text-white"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>
            <Sidebar pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-100 bg-white px-4 sm:px-6">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <Menu aria-hidden className="h-5 w-5" />
        </button>

        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
              {(displayName || "?").charAt(0).toUpperCase()}
            </span>
            <span className="hidden max-w-48 truncate sm:inline">{displayName || "Prestador"}</span>
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <LogOut aria-hidden className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {error && <Alert tone="error">{error}</Alert>}
        {children}
      </main>
    </div>
  );
}
