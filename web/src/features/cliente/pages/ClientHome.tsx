"use client";

import Link from "next/link";
import { CalendarCheck, CalendarClock, CalendarDays, Car, Wrench, type LucideIcon } from "lucide-react";
import { routes } from "@/routes";
import { useAsync } from "@/shared/hooks/useAsync";
import { getFriendlyError } from "@/shared/lib/api/http";
import { useClient } from "../context/ClientContext";
import { ProviderCard, ProviderCardSkeleton } from "../components/ProviderCard";
import { EmptyState, ErrorState, LINK_BUTTON } from "../components/StateViews";
import { StatusBadge } from "../components/StatusBadge";
import { listClientAppointments } from "../services/appointmentService";
import { searchProviders } from "../services/providerService";
import { getProviderRatings } from "../services/reviewService";
import { listMyVehicles } from "../services/vehicleService";
import type { ClientAppointment } from "../types";
import { formatRelativeDate, isFuture } from "../utils/dates";

const RECOMMENDED_COUNT = 3;

function SummaryCard({ label, value, Icon, tone }: { label: string; value: string; Icon: LucideIcon; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <span aria-hidden className={`flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
}

function UpcomingCard({ appointment }: { appointment: ClientAppointment }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
          <Wrench className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-gray-900">{appointment.providerName}</h3>
          <p className="truncate text-xs text-gray-500">{appointment.specialtyNames.join(", ")}</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500">
          {formatRelativeDate(appointment.date)}, às {appointment.time}
        </p>
        <Link
          href={`${routes.clientAppointments}?id=${encodeURIComponent(appointment.id)}`}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          Ver Detalhes
        </Link>
      </div>
    </article>
  );
}

export default function ClientHome() {
  const { uid, email, profile } = useClient();

  const appointments = useAsync(() => listClientAppointments(uid), `appointments:${uid}`, uid !== "");
  // O card de veículos depende da API; se ela estiver indisponível, os demais cards continuam funcionando.
  const vehicles = useAsync(() => listMyVehicles(profile, email), `vehicles:${uid}:${profile ? "p" : "n"}`, profile !== null);
  const uf = profile?.state ?? "";
  const recommended = useAsync(
    async () => {
      const page = await searchProviders({ uf: uf || undefined }, 0, RECOMMENDED_COUNT);
      const ratings = await getProviderRatings(page.content.map((item) => item.id)).catch(() => ({}));
      return { page, ratings };
    },
    `recommended:${uf}`,
    profile !== null,
  );

  const list = appointments.data ?? [];
  const count = (status: ClientAppointment["status"]) => list.filter((item) => item.status === status).length;
  const shown = (value: number) => (appointments.data ? String(value) : "—");
  const upcoming = list
    .filter((item) => (item.status === "requested" || item.status === "confirmed") && isFuture(item.date, item.time))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <h1 className="sr-only">Dashboard do cliente</h1>

      {appointments.error !== null && <ErrorState message={getFriendlyError(appointments.error)} onRetry={appointments.reload} />}

      <section aria-label="Resumo" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Agendamentos Pendentes" value={shown(count("requested"))} Icon={CalendarClock} tone="bg-orange-50 text-orange-500" />
        <SummaryCard label="Confirmados" value={shown(count("confirmed"))} Icon={CalendarDays} tone="bg-blue-50 text-blue-500" />
        <SummaryCard label="Concluídos" value={shown(count("completed"))} Icon={CalendarCheck} tone="bg-green-50 text-green-600" />
        <SummaryCard
          label="Meus Veículos"
          value={vehicles.data ? String(vehicles.data.length) : "—"}
          Icon={Car}
          tone="bg-gray-100 text-gray-600"
        />
      </section>
      {vehicles.error !== null && (
        <p className="-mt-4 text-xs text-gray-500">Não foi possível consultar seus veículos: {getFriendlyError(vehicles.error)}</p>
      )}

      <section aria-labelledby="proximos">
        <h2 id="proximos" className="mb-4 text-base font-bold text-gray-900">
          Próximos Agendamentos
        </h2>
        {appointments.loading ? (
          <div aria-hidden className="grid gap-4 md:grid-cols-2">
            <div className="h-32 animate-pulse rounded-xl bg-white" />
            <div className="h-32 animate-pulse rounded-xl bg-white" />
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState
            title="Você não tem agendamentos próximos"
            action={
              <Link href={routes.clientSearch} className={LINK_BUTTON}>
                Buscar prestadores
              </Link>
            }
          >
            Encontre uma oficina e agende seu próximo serviço.
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((appointment) => (
              <UpcomingCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="recomendados">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recomendados" className="text-base font-bold text-gray-900">
            Prestadores Recomendados
          </h2>
          <Link href={`${routes.clientResults}${uf ? `?uf=${uf}` : ""}`} className="text-xs font-semibold text-orange-500 hover:underline">
            Ver todos
          </Link>
        </div>
        {recommended.error !== null ? (
          <ErrorState message={getFriendlyError(recommended.error)} onRetry={recommended.reload} />
        ) : recommended.loading || !recommended.data ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: RECOMMENDED_COUNT }, (_, index) => (
              <ProviderCardSkeleton key={index} />
            ))}
          </div>
        ) : recommended.data.page.content.length === 0 ? (
          <EmptyState title="Nenhum prestador disponível ainda">Volte em breve ou amplie a busca.</EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.data.page.content.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                rating={recommended.data?.ratings[provider.id]}
                actionLabel="Ver Detalhes & Horários"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
