"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { useAsync } from "@/shared/hooks/useAsync";
import { ApiError, getFriendlyError } from "@/shared/lib/api/http";
import { EmptyState, ErrorState, LoadingBlock } from "@/features/cliente/components/StateViews";
import { StatusBadge } from "@/features/cliente/components/StatusBadge";
import { formatRelativeDate, isFuture, toIsoDate } from "@/features/cliente/utils/dates";
import type { ProviderApprovalStatus } from "@/shared/types/domain";
import { useProvider } from "../context/ProviderContext";
import { PageTitle, StatCard } from "../components/ProviderUi";
import { summarize } from "@/features/cliente/services/reviewService";
import { listProviderAppointments } from "../services/providerAppointmentService";
import { listMyReviews } from "../services/providerReviewService";

const WEEK_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
const UPCOMING_COUNT = 5;

/** Segunda-feira da semana de `date`, no horário local. */
function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

const APPROVAL_TEXT: Record<ProviderApprovalStatus, { title: string; detail: string }> = {
  under_review: {
    title: "Cadastro em análise",
    detail: "Nossa equipe está analisando seu cadastro. Você será avisado quando o perfil for aprovado.",
  },
  changes_requested: {
    title: "Ajustes solicitados",
    detail: "A equipe pediu ajustes no seu cadastro. Entre em contato com o suporte para mais detalhes.",
  },
  rejected: {
    title: "Cadastro não aprovado",
    detail: "Não foi possível aprovar seu cadastro. Entre em contato com o suporte para mais informações.",
  },
  approved: {
    title: "Perfil aprovado",
    detail: "Seu perfil foi aprovado e está apto a receber solicitações de clientes.",
  },
};

export default function ProviderHome() {
  const { uid, profile, loaded, error, email, displayName } = useProvider();
  const approval = profile ? APPROVAL_TEXT[profile.approvalStatus] : null;
  const approved = profile?.approvalStatus === "approved";

  // GET /agendamentos/me (prestador): base dos indicadores, dos próximos atendimentos e do gráfico semanal.
  const appointments = useAsync(listProviderAppointments, `provider-appointments:${uid}`, uid !== "");
  // Avaliações (Firestore, indexadas pelo ID do perfil na API): só alimentam a "Avaliação Média".
  const reviews = useAsync(listMyReviews, `provider-reviews:${uid}`, uid !== "");
  const rating = reviews.data ? summarize(reviews.data) : null;
  const list = appointments.data ?? [];
  const today = toIsoDate(new Date());
  const month = today.slice(0, 7);
  const pending = list.filter((item) => item.status === "requested").length;
  const todayCount = list.filter((item) => item.date === today && item.status !== "cancelled").length;
  const completedThisMonth = list.filter((item) => item.status === "completed" && item.date.startsWith(month)).length;
  const shown = (value: number) => (appointments.data ? String(value) : "—");
  const notFound = appointments.error instanceof ApiError && appointments.error.status === 404;
  const upcoming = list
    .filter((item) => (item.status === "requested" || item.status === "confirmed") && isFuture(item.date, item.time))
    .slice(0, UPCOMING_COUNT);
  const weekStart = startOfWeek(new Date());
  const week = WEEK_LABELS.map((label, index) => {
    const day = toIsoDate(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index));
    return { label, total: list.filter((item) => item.status === "completed" && item.date === day).length };
  });
  const weekMax = Math.max(1, ...week.map((item) => item.total));

  // Etapas distintas: o cadastro já foi enviado; análise e aprovação dependem do status do perfil.
  const steps = [
    { label: "Cadastro enviado", done: true },
    { label: "Análise do cadastro", done: approved || profile?.approvalStatus === "rejected" },
    { label: "Aprovação profissional", done: approved },
  ];

  return (
    <>
      <PageTitle title="Painel de Controle — Prestador" />

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">{displayName ? `Olá, ${displayName}!` : "Olá!"}</h2>
        <p className="mt-1 text-sm text-gray-500">Acompanhe o desempenho e o andamento da sua oficina.</p>
        {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}
        {!error && !loaded && <LoadingBlock />}
        {approval && (
          <div className="mt-4">
            <Alert tone={approved ? "success" : profile?.approvalStatus === "under_review" ? "info" : "error"}>
              <strong>{approval.title}.</strong> {approval.detail}
            </Alert>
          </div>
        )}
        {loaded && !profile && !error && (
          <div className="mt-4"><Alert tone="error">Perfil profissional não encontrado. Contate o suporte.</Alert></div>
        )}
      </section>

      {notFound && (
        <Alert tone="info">
          Seu cadastro ainda não existe na API. Complete o seu perfil em{" "}
          <Link href={routes.providerProfile} className="font-semibold underline">Meu Perfil</Link> para receber agendamentos.
        </Alert>
      )}
      {appointments.error !== null && !notFound && (
        <ErrorState message={getFriendlyError(appointments.error)} onRetry={appointments.reload} />
      )}

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Solicitações Pendentes" value={shown(pending)} />
        <StatCard label="Agendamentos de Hoje" value={shown(todayCount)} />
        <StatCard label="Concluídos este Mês" value={shown(completedThisMonth)} />
        <StatCard label="Avaliação Média" value={rating ? `${rating.average.toFixed(1)} (${rating.count})` : "—"} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="proximos">
          <h2 id="proximos" className="mb-4 text-sm font-bold text-gray-900">Próximos Atendimentos</h2>
          {appointments.loading ? (
            <LoadingBlock label="Carregando atendimentos..." />
          ) : upcoming.length === 0 ? (
            <EmptyState title="Sem dados para exibir">Os próximos atendimentos aparecerão aqui.</EmptyState>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcoming.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{item.specialtyName}</p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeDate(item.date)} às {item.time}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="desempenho">
          <h2 id="desempenho" className="mb-4 text-sm font-bold text-gray-900">Desempenho Semanal (Serviços Concluídos)</h2>
          {appointments.loading ? (
            <LoadingBlock label="Carregando desempenho..." />
          ) : !appointments.data || week.every((item) => item.total === 0) ? (
            <EmptyState title="Sem dados para exibir">O gráfico semanal aparecerá aqui.</EmptyState>
          ) : (
            <ul className="flex h-40 items-end justify-between gap-2" aria-label="Serviços concluídos por dia da semana">
              {week.map((item) => (
                <li key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1 text-[11px] text-gray-500">
                  <span className="font-semibold text-gray-700">{item.total}</span>
                  <span
                    aria-hidden
                    className="w-full max-w-8 rounded-t-md bg-orange-400"
                    style={{ height: `${Math.max(4, (item.total / weekMax) * 100)}%` }}
                  />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="andamento">
        <h2 id="andamento" className="mb-4 text-sm font-bold text-orange-500">Andamento do cadastro</h2>
        <ol className="space-y-3">
          {steps.map((step, index) => {
            const current = !step.done && steps.slice(0, index).every((previous) => previous.done);
            return (
              <li key={step.label} className="flex items-center gap-3 text-sm text-gray-700">
                {step.done ? (
                  <CheckCircle2 aria-hidden className="h-5 w-5 text-green-600" />
                ) : current ? (
                  <Clock aria-hidden className="h-5 w-5 text-orange-500" />
                ) : (
                  <Circle aria-hidden className="h-5 w-5 text-gray-300" />
                )}
                <span>
                  {step.label}
                  <span className="sr-only">{step.done ? " (concluída)" : current ? " (em andamento)" : " (pendente)"}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {profile && (
        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="dados-empresa">
          <h2 id="dados-empresa" className="mb-4 text-sm font-bold text-orange-500">Dados da oficina</h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Item label="Empresa / Oficina" value={profile.displayName} />
            <Item label="E-mail" value={email ?? "—"} />
            <Item label="Telefone" value={profile.phone} />
            <Item label="Localização" value={`${profile.city} - ${profile.state}`} />
            <Item label="Endereço" value={profile.address} />
          </dl>
        </section>
      )}
    </>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-gray-500">{label}</dt>
      <dd className="mt-0.5 break-words text-gray-800">{value}</dd>
    </div>
  );
}
