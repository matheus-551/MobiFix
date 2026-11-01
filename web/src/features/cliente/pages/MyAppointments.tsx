"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { useAsync } from "@/shared/hooks/useAsync";
import { getFriendlyError } from "@/shared/lib/api/http";
import { Modal } from "../components/Modal";
import { EmptyState, ErrorState, LINK_BUTTON, LoadingBlock } from "../components/StateViews";
import { STATUS_LABEL, StatusBadge } from "../components/StatusBadge";
import { useClient } from "../context/ClientContext";
import { cancelAppointment, listClientAppointments } from "../services/appointmentService";
import { listReviewedAppointmentIds } from "../services/reviewService";
import type { AppointmentStatus, ClientAppointment } from "../types";
import { formatRelativeDate, isFuture } from "../utils/dates";
import { routes } from "@/routes";

type Filter = "all" | AppointmentStatus;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "requested", label: "Pendentes" },
  { id: "confirmed", label: "Confirmados" },
  { id: "completed", label: "Concluídos" },
  { id: "cancelled", label: "Cancelados" },
];

/** Regra aplicada pelo web (a API ainda não tem agendamentos): só cancela pendente/confirmado que ainda não ocorreu. */
const canCancel = (item: ClientAppointment) =>
  (item.status === "requested" || item.status === "confirmed") && isFuture(item.date, item.time);

const reviewHref = (id: string) => `${routes.clientReview}?id=${encodeURIComponent(id)}`;

export default function MyAppointments() {
  const { uid } = useClient();
  const params = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(params.get("id"));
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const appointments = useAsync(() => listClientAppointments(uid), `appointments:${uid}`, uid !== "");
  const reviewed = useAsync(() => listReviewedAppointmentIds(uid), `reviewed:${uid}`, uid !== "");

  const list = appointments.data ?? [];
  const reviewedIds = new Set(reviewed.data ?? []);
  const countOf = (id: Filter) => (id === "all" ? list.length : list.filter((item) => item.status === id).length);
  const visible = filter === "all" ? list : list.filter((item) => item.status === filter);
  const details = list.find((item) => item.id === openId) ?? null;
  const toCancel = list.find((item) => item.id === confirmingId) ?? null;

  async function handleCancel() {
    if (!toCancel || cancelling) return;
    setCancelling(true);
    try {
      await cancelAppointment(toCancel.id);
      setFeedback({ tone: "success", message: `Agendamento com ${toCancel.providerName} cancelado.` });
      setConfirmingId(null);
      setOpenId(null);
      appointments.reload();
    } catch (error) {
      setFeedback({ tone: "error", message: getFriendlyError(error) });
      setConfirmingId(null);
    } finally {
      setCancelling(false);
    }
  }

  function actions(item: ClientAppointment) {
    const link = "text-xs font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400";
    return (
      <div className="flex items-center justify-end gap-3">
        {item.status === "completed" &&
          (reviewedIds.has(item.id) ? (
            <span className="text-xs text-gray-400">Avaliado</span>
          ) : (
            <Link href={reviewHref(item.id)} className="rounded-md border border-orange-300 px-2.5 py-1 text-xs font-semibold text-orange-500 hover:bg-orange-50">
              Avaliar
            </Link>
          ))}
        <button type="button" onClick={() => setOpenId(item.id)} className={`${link} text-orange-500`}>
          Ver detalhes
        </button>
        {canCancel(item) && (
          <button type="button" onClick={() => setConfirmingId(item.id)} className={`${link} text-red-500`}>
            Cancelar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Meus Agendamentos</h1>
        <p className="mt-1 text-sm text-gray-500">Gerencie e acompanhe seus agendamentos de serviços automotivos.</p>
      </header>

      {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}

      <div role="tablist" aria-label="Filtrar por status" className="flex gap-5 overflow-x-auto border-b border-gray-200">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            onClick={() => setFilter(id)}
            className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 pb-2.5 text-sm font-semibold transition ${
              filter === id ? "border-orange-500 text-orange-500" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {label}
            <span className="rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-500">{appointments.data ? countOf(id) : "–"}</span>
          </button>
        ))}
      </div>

      {appointments.loading ? (
        <LoadingBlock label="Carregando agendamentos..." />
      ) : appointments.error !== null ? (
        <ErrorState message={getFriendlyError(appointments.error)} onRetry={appointments.reload} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "Você ainda não tem agendamentos" : `Nenhum agendamento ${STATUS_LABEL[filter].toLowerCase()}`}
          action={
            filter === "all" ? (
              <Link href={routes.clientSearch} className={LINK_BUTTON}>
                Buscar prestadores
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Tabela em telas médias ou maiores */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Prestador</th>
                  <th scope="col" className="px-4 py-3">Serviço</th>
                  <th scope="col" className="px-4 py-3">Veículo</th>
                  <th scope="col" className="px-4 py-3">Data / Horário</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.providerName}</td>
                    <td className="px-4 py-3 text-gray-600">{item.specialtyNames.join(", ")}</td>
                    <td className="px-4 py-3 text-gray-600">{item.vehicleLabel}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatRelativeDate(item.date)}
                      <span className="block text-xs text-gray-400">às {item.time}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3">{actions(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartões em telas pequenas */}
          <ul className="space-y-3 md:hidden">
            {visible.map((item) => (
              <li key={item.id} className="space-y-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-900">{item.providerName}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs text-gray-600">{item.specialtyNames.join(", ")}</p>
                <p className="text-xs text-gray-500">{item.vehicleLabel}</p>
                <p className="text-xs text-gray-700">
                  {formatRelativeDate(item.date)} às {item.time}
                </p>
                <div className="border-t border-gray-100 pt-2">{actions(item)}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      {details && (
        <Modal title="Detalhes do agendamento" onClose={() => setOpenId(null)}>
          <dl className="space-y-3 text-sm">
            {(
              [
                ["Prestador", details.providerName],
                ["Serviço(s)", details.specialtyNames.join(", ")],
                ["Veículo", details.vehicleLabel],
                ["Data e horário", `${formatRelativeDate(details.date)} às ${details.time}`],
                ["Valor estimado", "A combinar com a oficina"],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-gray-500">{label}</dt>
                <dd className="text-right font-semibold text-gray-900">{value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-500">Status</dt>
              <dd>
                <StatusBadge status={details.status} />
              </dd>
            </div>
            {details.description && (
              <div>
                <dt className="text-gray-500">Descrição do problema</dt>
                <dd className="mt-1 whitespace-pre-line text-gray-800">{details.description}</dd>
              </div>
            )}
          </dl>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            {canCancel(details) && (
              <div className="sm:w-40">
                <Button variant="secondary" onClick={() => setConfirmingId(details.id)}>
                  Cancelar agendamento
                </Button>
              </div>
            )}
            {details.status === "completed" && !reviewedIds.has(details.id) && (
              <Link href={reviewHref(details.id)} className={LINK_BUTTON}>
                Avaliar atendimento
              </Link>
            )}
          </div>
        </Modal>
      )}

      {toCancel && (
        <Modal title="Cancelar agendamento?" onClose={() => !cancelling && setConfirmingId(null)}>
          <p className="text-sm text-gray-600">
            Você está cancelando o atendimento com <strong>{toCancel.providerName}</strong> em {formatRelativeDate(toCancel.date)} às {toCancel.time}. Esta ação não pode ser desfeita.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <div className="sm:w-32">
              <Button variant="secondary" onClick={() => setConfirmingId(null)} disabled={cancelling}>
                Voltar
              </Button>
            </div>
            <div className="sm:w-44">
              <Button onClick={handleCancel} loading={cancelling} loadingLabel="Cancelando...">
                Confirmar cancelamento
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
