import { routes } from "@/routes";
import type { ClientAppointment } from "../types";
import { formatDateBr, formatTime } from "./dates";

/**
 * A API ainda não possui o recurso "notificações". Os avisos exibidos são DERIVADOS dos agendamentos e das
 * avaliações reais do cliente (agendamentos da API e avaliações do Firestore): cada mudança de situação de um agendamento gera um aviso.
 * Não há dados simulados; promoções/avisos do sistema só existirão quando houver uma fonte para eles.
 */

export type NotificationKind = "requested" | "confirmed" | "cancelled" | "completed" | "review";

export interface ClientNotification {
  /** Estável por agendamento + situação (`<agendamento>:<tipo>`): é a chave do estado "lida". */
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  date: Date | null;
  href: string;
}

const appointmentHref = (id: string) => `${routes.clientAppointments}?id=${encodeURIComponent(id)}`;
const reviewHref = (id: string) => `${routes.clientReview}?id=${encodeURIComponent(id)}`;

function toNotification(appointment: ClientAppointment, reviewed: ReadonlySet<string>): ClientNotification {
  const date = appointment.updatedAt ?? appointment.createdAt;
  const when = `${formatDateBr(appointment.date)} às ${formatTime(appointment.time)}`;
  const base = { date, href: appointmentHref(appointment.id) };

  switch (appointment.status) {
    case "confirmed":
      return {
        ...base,
        id: `${appointment.id}:confirmed`,
        kind: "confirmed",
        title: "Agendamento confirmado",
        message: `${appointment.providerName} confirmou seu agendamento para ${formatDateBr(appointment.date)}`,
      };
    case "cancelled":
      return {
        ...base,
        id: `${appointment.id}:cancelled`,
        kind: "cancelled",
        title: "Agendamento cancelado",
        message: `O agendamento com ${appointment.providerName} para ${when} foi cancelado`,
      };
    case "completed":
      return reviewed.has(appointment.id)
        ? {
            ...base,
            id: `${appointment.id}:completed`,
            kind: "completed",
            title: "Atendimento concluído",
            message: `Seu serviço com ${appointment.providerName} foi concluído e avaliado`,
          }
        : {
            date,
            href: reviewHref(appointment.id),
            id: `${appointment.id}:review`,
            kind: "review",
            title: "Nova avaliação disponível",
            message: `Avalie seu último serviço realizado com ${appointment.providerName}`,
          };
    default:
      return {
        ...base,
        id: `${appointment.id}:requested`,
        kind: "requested",
        title: "Solicitação enviada",
        message: `Aguardando a confirmação de ${appointment.providerName} para ${when}`,
      };
  }
}

/** Mais recentes primeiro. */
export function buildNotifications(
  appointments: readonly ClientAppointment[],
  reviewedAppointmentIds: ReadonlySet<string>,
): ClientNotification[] {
  return appointments
    .map((appointment) => toNotification(appointment, reviewedAppointmentIds))
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
}

/** "agora mesmo", "2 horas atrás", "1 dia atrás"… (datas com mais de 30 dias aparecem por extenso). */
export function formatTimeAgo(date: Date | null, now: number = Date.now()): string {
  if (!date) return "";
  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  const plural = (value: number, unit: string) => `${value} ${unit}${value === 1 ? "" : "s"} atrás`;
  if (seconds < 60) return "agora mesmo";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return plural(minutes, "minuto");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, "hora");
  const days = Math.floor(hours / 24);
  if (days <= 30) return plural(days, "dia");
  return new Intl.DateTimeFormat("pt-BR").format(date);
}
