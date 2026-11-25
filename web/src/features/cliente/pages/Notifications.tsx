"use client";

import { useState } from "react";
import Link from "next/link";
import { BellOff, CalendarCheck, CalendarClock, CheckCircle2, Star, type LucideIcon } from "lucide-react";
import { EmptyState, ErrorState, LoadingSkeleton } from "../components/StateViews";
import { useNotifications } from "../context/NotificationsContext";
import { formatTimeAgo, type NotificationKind } from "../utils/notifications";
import { getFriendlyError } from "@/shared/lib/api/http";

type Tab = "all" | "appointments" | "system";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "appointments", label: "Agendamentos" },
  { id: "system", label: "Sistema" },
];

const ICONS: Record<NotificationKind, { Icon: LucideIcon; style: string }> = {
  requested: { Icon: CalendarClock, style: "text-amber-600" },
  confirmed: { Icon: CalendarCheck, style: "text-blue-600" },
  cancelled: { Icon: BellOff, style: "text-red-500" },
  completed: { Icon: CheckCircle2, style: "text-green-600" },
  review: { Icon: Star, style: "text-orange-500" },
};

export default function Notifications() {
  const { notifications, readIds, unreadCount, loading, error, reload, markRead, markAllRead } = useNotifications();
  const [tab, setTab] = useState<Tab>("all");

  // Hoje todos os avisos nascem de agendamentos; "Sistema" ficará vazio até a API ter esse recurso.
  const visible = tab === "system" ? [] : notifications;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="mt-1 text-sm text-gray-500">Acompanhe novidades, confirmações e alertas do sistema.</p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="text-sm font-semibold text-orange-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
        >
          Marcar todas como lidas
        </button>
      </header>

      <div role="tablist" aria-label="Filtrar notificações" className="flex flex-wrap gap-2">
        {TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSkeleton label="Carregando notificações..." />
      ) : error ? (
        <ErrorState message={getFriendlyError(error)} onRetry={reload} />
      ) : visible.length === 0 ? (
        tab === "system" ? (
          <EmptyState title="Nenhum aviso do sistema">
            Avisos e promoções do MobiFix aparecerão aqui quando estiverem disponíveis.
          </EmptyState>
        ) : (
          <EmptyState title="Nenhuma notificação">
            Quando você solicitar, tiver confirmado ou cancelado um agendamento, os avisos aparecerão aqui.
          </EmptyState>
        )
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => {
            const unread = !readIds.has(item.id);
            const { Icon, style } = ICONS[item.kind];
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => markRead(item.id)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:gap-4 ${
                    unread ? "border-orange-100 bg-orange-50/60" : "border-gray-100 bg-white"
                  }`}
                >
                  <span
                    aria-label={unread ? "Não lida" : undefined}
                    className={`h-2 w-2 shrink-0 rounded-full ${unread ? "bg-orange-500" : "bg-transparent"}`}
                  />
                  <span aria-hidden className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 ${style}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-gray-900">{item.title}</span>
                    <span className="block text-xs text-gray-600">{item.message}</span>
                  </span>
                  <span className="shrink-0 self-start text-[11px] text-gray-400 sm:self-center">{formatTimeAgo(item.date)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
