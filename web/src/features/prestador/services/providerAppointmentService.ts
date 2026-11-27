import {
  cancelAppointment,
  changeAppointment,
  fetchApiAppointments,
  lastChangeOf,
  loadSpecialtyNames,
  toAppointmentStatus,
} from "@/features/cliente/services/appointmentService";
import { formatTime } from "@/features/cliente/utils/dates";
import type { ProviderAppointment } from "../types";

/**
 * Agendamentos recebidos pelo prestador logado (`/api/v1/agendamentos`). Usa as mesmas funções do painel do
 * cliente (`appointmentService`): a API devolve os agendamentos do usuário conforme o tipo da conta.
 */

/** `GET /api/v1/agendamentos/me` (todas as páginas), do mais próximo para o mais distante. */
export async function listProviderAppointments(): Promise<ProviderAppointment[]> {
  const [items, specialtyNames] = await Promise.all([fetchApiAppointments(), loadSpecialtyNames()]);
  return items
    .map<ProviderAppointment>((item) => ({
      id: item.id,
      clientId: item.clienteId,
      specialtyName: specialtyNames.get(item.especialidadeId) ?? "Serviço",
      date: item.data,
      time: formatTime(item.horaInicio),
      status: toAppointmentStatus(item.status),
      createdAt: new Date(item.criadoEm),
      updatedAt: lastChangeOf(item),
    }))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

/** `PATCH /api/v1/agendamentos/{id}/confirmar` — só o prestador, pendente e antes do início. */
export async function approveAppointment(id: string): Promise<void> {
  await changeAppointment(id, "confirmar");
}

/** `PATCH /api/v1/agendamentos/{id}/cancelar` — recusa uma solicitação ou cancela um agendamento confirmado. */
export const declineAppointment = cancelAppointment;

/** `PATCH /api/v1/agendamentos/{id}/concluir` — só o prestador, confirmado e a partir do horário de início. */
export async function completeAppointment(id: string): Promise<void> {
  await changeAppointment(id, "concluir");
}
