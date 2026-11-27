"use client";

import { useState } from "react";
import Link from "next/link";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { useAsync } from "@/shared/hooks/useAsync";
import { ApiError, getFriendlyError } from "@/shared/lib/api/http";
import { ConfirmDialog } from "@/features/cliente/components/feedback/Dialogs";
import { EmptyState, ErrorState, LoadingBlock } from "@/features/cliente/components/StateViews";
import { StatusBadge } from "@/features/cliente/components/StatusBadge";
import { formatRelativeDate, isFuture } from "@/features/cliente/utils/dates";
import { PageTitle } from "../components/ProviderUi";
import { useProvider } from "../context/ProviderContext";
import {
  approveAppointment,
  completeAppointment,
  declineAppointment,
  listProviderAppointments,
} from "../services/providerAppointmentService";
import type { ProviderAppointment } from "../types";

const TABS = [
  { id: "requested", label: "Pendentes" },
  { id: "confirmed", label: "Aprovadas" },
  { id: "cancelled", label: "Recusadas" },
] as const;

type TabId = (typeof TABS)[number]["id"];
type Feedback = { tone: "success" | "error"; text: string } | null;

const ACTION =
  "rounded-md border px-2.5 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:opacity-50";

export default function ProviderRequests() {
  const { uid } = useProvider();
  const [tab, setTab] = useState<TabId>("requested");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDecline, setToDecline] = useState<ProviderAppointment | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // GET /agendamentos/me (prestador): todos os agendamentos recebidos.
  const appointments = useAsync(listProviderAppointments, `provider-appointments:${uid}`, uid !== "");
  const list = appointments.data ?? [];
  const countOf = (id: TabId) => list.filter((item) => item.status === id).length;
  const visible = list.filter((item) => item.status === tab);
  if (tab === "cancelled") visible.reverse();

  async function run(item: ProviderAppointment, action: () => Promise<void>, success: string) {
    if (busyId) return;
    setBusyId(item.id);
    setFeedback(null);
    try {
      await action();
      setFeedback({ tone: "success", text: success });
      appointments.reload();
    } catch (error) {
      setFeedback({ tone: "error", text: getFriendlyError(error) });
    } finally {
      setBusyId(null);
      setToDecline(null);
    }
  }

  const notFound = appointments.error instanceof ApiError && appointments.error.status === 404;

  function actionsFor(item: ProviderAppointment) {
    const busy = busyId === item.id;
    const upcoming = isFuture(item.date, item.time);
    if (item.status === "requested") {
      if (!upcoming) return <span className="text-xs text-gray-400">Horário já iniciado</span>;
      return (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(item, () => approveAppointment(item.id), "Solicitação aprovada.")}
            className={`${ACTION} border-orange-500 bg-orange-500 text-white hover:bg-orange-600`}
          >
            {busy ? "Aguarde..." : "Aprovar"}
          </button>
          <button type="button" disabled={busy} onClick={() => setToDecline(item)} className={`${ACTION} border-red-200 text-red-600 hover:bg-red-50`}>
            Recusar
          </button>
        </div>
      );
    }
    if (item.status === "confirmed") {
      return (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={busy || upcoming}
            title={upcoming ? "Disponível a partir do horário de início" : undefined}
            onClick={() => void run(item, () => completeAppointment(item.id), "Atendimento concluído.")}
            className={`${ACTION} border-orange-500 bg-orange-500 text-white hover:bg-orange-600`}
          >
            {busy ? "Aguarde..." : "Concluir"}
          </button>
          {upcoming && (
            <button type="button" disabled={busy} onClick={() => setToDecline(item)} className={`${ACTION} border-red-200 text-red-600 hover:bg-red-50`}>
              Cancelar
            </button>
          )}
        </div>
      );
    }
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <>
      <PageTitle title="Solicitações de Agendamento" />
      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

      <div role="group" aria-label="Situação das solicitações" className="flex flex-wrap gap-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              tab === id ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-80">{appointments.data ? countOf(id) : "–"}</span>
          </button>
        ))}
      </div>

      {appointments.loading && <LoadingBlock label="Carregando solicitações..." />}
      {notFound && (
        <Alert tone="info">
          Seu cadastro ainda não existe na API. Complete o seu perfil em{" "}
          <Link href={routes.providerProfile} className="font-semibold underline">Meu Perfil</Link> para receber solicitações.
        </Alert>
      )}
      {appointments.error !== null && !notFound && (
        <ErrorState message={getFriendlyError(appointments.error)} onRetry={appointments.reload} />
      )}
      {appointments.data && visible.length === 0 && (
        <EmptyState title="Nenhuma solicitação para exibir">
          {tab === "requested"
            ? "As solicitações dos clientes aparecerão aqui para aprovação ou recusa."
            : tab === "confirmed"
              ? "Os agendamentos aprovados aparecerão aqui."
              : "As solicitações recusadas ou canceladas aparecerão aqui."}
        </EmptyState>
      )}
      {visible.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6" aria-label="Solicitações">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500">
                  <th scope="col" className="px-3 py-2">Serviço</th>
                  <th scope="col" className="px-3 py-2">Data / Horário</th>
                  <th scope="col" className="px-3 py-2">Solicitado em</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 font-semibold text-gray-900">{item.specialtyName}</td>
                    <td className="px-3 py-3 text-gray-700">
                      {formatRelativeDate(item.date)}
                      <span className="block text-xs text-gray-400">às {item.time}</span>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{item.createdAt ? new Intl.DateTimeFormat("pt-BR").format(item.createdAt) : "—"}</td>
                    <td className="px-3 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-3 py-3">{actionsFor(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {toDecline && (
        <ConfirmDialog
          title={toDecline.status === "requested" ? "Deseja recusar esta solicitação?" : "Deseja cancelar este agendamento?"}
          description={
            <>
              {toDecline.specialtyName} em {formatRelativeDate(toDecline.date)} às {toDecline.time}. Esta ação não poderá ser desfeita.
            </>
          }
          confirmLabel={toDecline.status === "requested" ? "Recusar" : "Cancelar agendamento"}
          loadingLabel="Aguarde..."
          loading={busyId === toDecline.id}
          onConfirm={() =>
            void run(
              toDecline,
              () => declineAppointment(toDecline.id),
              toDecline.status === "requested" ? "Solicitação recusada." : "Agendamento cancelado.",
            )
          }
          onCancel={() => setToDecline(null)}
        />
      )}
    </>
  );
}
