"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Car, LayoutDashboard, LogOut, Menu, Search, Wrench, X } from "lucide-react";
import { routes } from "@/routes";
import { signOutUser } from "@/features/auth/services/authService";
import { Alert } from "@/shared/components/Alert";
import { getFriendlyError } from "@/shared/lib/api/http";
import { useClient } from "../context/ClientContext";

const NAV_ITEMS = [
  { href: routes.clientHome, label: "Dashboard", Icon: LayoutDashboard, match: (path: string) => path === routes.clientHome },
  {
    href: routes.clientSearch,
    label: "Buscar Prestadores",
    Icon: Search,
    match: (path: string) => path.startsWith(routes.clientSearch) || path.startsWith(routes.clientBooking),
  },
  {
    href: routes.clientAppointments,
    label: "Meus Agendamentos",
    Icon: CalendarDays,
    match: (path: string) => path.startsWith(routes.clientAppointments),
  },
  { href: routes.clientVehicles, label: "Meus Veículos", Icon: Car, match: (path: string) => path.startsWith(routes.clientVehicles) },
] as const;

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <nav aria-label="Navegação do cliente" className="flex h-full flex-col gap-1 px-4 py-6">
      <Link href={routes.clientHome} onClick={onNavigate} className="mb-8 flex items-center gap-2 px-2 text-orange-500">
        <Wrench aria-hidden className="h-6 w-6" />
        <span className="text-xl font-extrabold">MobiFix</span>
      </Link>
      {NAV_ITEMS.map(({ href, label, Icon, match }) => {
        const active = match(pathname);
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

export function ClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { firstName } = useClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    if (text) router.push(`${routes.clientResults}?q=${encodeURIComponent(text)}`);
  }

  async function handleSignOut() {
    try {
      await signOutUser();
    } catch (failure) {
      setError(getFriendlyError(failure));
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] lg:pl-64">
      {/* Sidebar fixa em telas grandes */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-[#1e2127] lg:block">
        <Sidebar pathname={pathname} onNavigate={() => undefined} />
      </aside>

      {/* Gaveta em telas pequenas */}
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

        <form onSubmit={handleSearch} role="search" className="relative min-w-0 max-w-md flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            name="q"
            type="search"
            aria-label="Buscar serviços ou oficinas"
            placeholder="Buscar serviços ou oficinas..."
            className="h-10 w-full rounded-lg bg-gray-100 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </form>

        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
              {(firstName || "?").charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{firstName ? `Olá, ${firstName}!` : "Olá!"}</span>
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

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <div className="mb-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
