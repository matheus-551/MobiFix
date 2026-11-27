"use client";

import { useState } from "react";
import Link from "next/link";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { useAsync } from "@/shared/hooks/useAsync";
import { ApiError, getFriendlyError } from "@/shared/lib/api/http";
import { EmptyState, ErrorState, LoadingBlock } from "@/features/cliente/components/StateViews";
import { StarRow } from "@/features/cliente/components/StarRating";
import { StatusBadge } from "@/features/cliente/components/StatusBadge";
import { formatDateBr, toIsoDate } from "@/features/cliente/utils/dates";
import { FeatureUnavailable, PageTitle, StatCard } from "../components/ProviderUi";
import { useProvider } from "../context/ProviderContext";
import { listProviderAppointments } from "../services/providerAppointmentService";
import { listMyReviews } from "../services/providerReviewService";

const COLUMNS = ["Cliente", "Veículo", "Serviço", "Data", "Valor", "Status", "Avaliação"] as const;

const PERIODS = [
  { id: "30", label: "Período: últimos 30 dias", days: 30 },
  { id: "90", label: "Período: últimos 90 dias", days: 90 },
  { id: "all", label: "Período: todo o histórico", days: null },
] as const;

const STATUSES = [
  { id: "all", label: "Status: todos" },
  { id: "completed", label: "Status: concluídos" },
  { id: "cancelled", label: "Status: cancelados" },
] as const;

const FIELD = "h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200";

export default function ProviderHistory() {
  const { uid } = useProvider();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("30");
  const [status, setStatus] = useState<(typeof STATUSES)[number]["id"]>("all");
  const [search, setSearch] = useState("");

  // GET /agendamentos/me (prestador): o histórico reúne os atendimentos concluídos e os cancelados.
  const appointments = useAsync(listProviderAppointments, `provider-appointments:${uid}`, uid !== "");

  // Avaliações (Firestore): preenchem a coluna "Avaliação" e a "Taxa de Satisfação"; se falharem, ficam em "—".
  const reviews = useAsync(() => listMyReviews().catch(() => []), `provider-reviews:${uid}`, uid !== "");
  const ratingByAppointment = new Map((reviews.data ?? []).map((review) => [review.appointmentId, review.rating]));

  const days = PERIODS.find((item) => item.id === period)?.days ?? null;
  const limit = days === null ? null : (() => {
    const start = new Date();
    start.setDate(start.getDate() - days);
    return toIsoDate(start);
  })();
  const term = search.trim().toLowerCase();

  const history = (appointments.data ?? [])
    .filter((item) => item.status === "completed" || item.status === "cancelled")
    .filter((item) => (limit === null || item.date >= limit) && (status === "all" || item.status === status))
    .filter((item) => term === "" || item.specialtyName.toLowerCase().includes(term))
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  const completed = history.filter((item) => item.status === "completed");
  const clients = new Set(completed.map((item) => item.clientId)).size;
  const rated = completed.flatMap((item) => ratingByAppointment.get(item.id) ?? []);
  const satisfaction = rated.length > 0 ? `${Math.round((rated.filter((rating) => rating >= 4).length / rated.length) * 100)}%` : "—";
  const shown = (value: number) => (appointments.data ? String(value) : "—");
  const notFound = appointments.error instanceof ApiError && appointments.error.status === 404;

  return (
    <>
      <PageTitle title="Histórico de Atendimentos" />
      <FeatureUnavailable feature="valores e dados do cliente (nome e veículo) nos atendimentos" />

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Atendimentos" value={shown(completed.length)} />
        <StatCard label="Receita do Mês" />
        <StatCard label="Taxa de Satisfação" value={satisfaction} />
        <StatCard label="Clientes Atendidos" value={shown(clients)} />
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6" aria-label="Atendimentos">
        <div className="flex flex-wrap gap-3">
          <select aria-label="Período" value={period} onChange={(event) => setPeriod(event.target.value as typeof period)} className={FIELD}>
            {PERIODS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={FIELD}>
            {STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <input
            type="search"
            aria-label="Buscar no histórico"
            placeholder="Buscar serviço..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${FIELD} min-w-0 flex-1`}
          />
        </div>

        {appointments.loading && <LoadingBlock label="Carregando histórico..." />}
        {notFound && (
          <Alert tone="info">
            Seu cadastro ainda não existe na API. Complete o seu perfil em{" "}
            <Link href={routes.providerProfile} className="font-semibold underline">Meu Perfil</Link>.
          </Alert>
        )}
        {appointments.error !== null && !notFound && (
          <ErrorState message={getFriendlyError(appointments.error)} onRetry={appointments.reload} />
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500">
                {COLUMNS.map((column) => (
                  <th key={column} scope="col" className="px-3 py-2">{column}</th>
                ))}
              </tr>
            </thead>
            {history.length > 0 && (
              <tbody className="divide-y divide-gray-100">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 text-gray-400">—</td>
                    <td className="px-3 py-3 text-gray-400">—</td>
                    <td className="px-3 py-3 font-semibold text-gray-900">{item.specialtyName}</td>
                    <td className="px-3 py-3 text-gray-700">
                      {formatDateBr(item.date)}
                      <span className="block text-xs text-gray-400">às {item.time}</span>
                    </td>
                    <td className="px-3 py-3 text-gray-400">—</td>
                    <td className="px-3 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-3 py-3 text-gray-400">
                      {ratingByAppointment.has(item.id) ? <StarRow value={ratingByAppointment.get(item.id) ?? 0} className="h-3.5 w-3.5" /> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        {appointments.data && history.length === 0 && (
          <EmptyState title="Nenhum atendimento para exibir">
            Os atendimentos concluídos ou cancelados no período escolhido aparecerão aqui.
          </EmptyState>
        )}
      </section>
    </>
  );
}
