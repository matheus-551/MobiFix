import { ApiError, apiRequest } from "@/shared/lib/api/http";
import type { ClientProfile } from "@/shared/types/domain";
import type {
  ApiAppointment,
  ApiAppointmentPage,
  ApiAppointmentStatus,
  ApiVehicle,
  AppointmentStatus,
  CatalogItem,
  ClientAppointment,
} from "../types";
import { formatTime } from "../utils/dates";
import { vehicleLabel } from "../utils/format";
import { listSpecialties } from "./catalogService";
import { getProvider } from "./providerService";
import { ensureApiUser } from "./vehicleService";

/**
 * Agendamentos pela API (`/api/v1/agendamentos`). Este arquivo é o único ponto de acesso do web a esse recurso:
 * o painel do cliente e o do prestador usam as mesmas funções. A API devolve apenas IDs; os nomes exibidos
 * (prestador, veículo e serviço) vêm de `/prestadores/{id}`, `/veiculos/me` e `/especialidades`.
 * A API não possui descrição do problema, então ela não é enviada nem exibida.
 */

/** A API aceita de 1 a 100 itens por página. */
const PAGE_SIZE = 100;
/** Trava de segurança contra laço infinito caso a API devolva metadados inconsistentes. */
const MAX_PAGES = 50;

const STATUS_FROM_API: Record<ApiAppointmentStatus, AppointmentStatus> = {
  PENDENTE: "requested",
  CONFIRMADO: "confirmed",
  CONCLUIDO: "completed",
  CANCELADO: "cancelled",
};

export function toAppointmentStatus(status: ApiAppointmentStatus): AppointmentStatus {
  return STATUS_FROM_API[status] ?? "requested";
}

/** Último instante registrado no agendamento (criação, confirmação, cancelamento, conclusão ou remarcação). */
export function lastChangeOf(appointment: ApiAppointment): Date | null {
  const times = [
    appointment.criadoEm,
    appointment.confirmadoEm,
    appointment.canceladoEm,
    appointment.concluidoEm,
    appointment.remarcadoEm,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));
  return times.length > 0 ? new Date(Math.max(...times)) : null;
}

/** `GET /api/v1/agendamentos/me` — todas as páginas do usuário logado (cliente ou prestador). */
export async function fetchApiAppointments(): Promise<ApiAppointment[]> {
  const all: ApiAppointment[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await apiRequest<ApiAppointmentPage>("/agendamentos/me", { query: { page, size: PAGE_SIZE } });
    all.push(...result.content);
    if (page + 1 >= result.totalPages) break;
  }
  return all;
}

export type AppointmentAction = "confirmar" | "cancelar" | "concluir";

/** `PATCH /api/v1/agendamentos/{id}/(confirmar|cancelar|concluir)` — sem corpo; a permissão é validada pela API. */
export function changeAppointment(id: string, action: AppointmentAction): Promise<ApiAppointment> {
  return apiRequest<ApiAppointment>(`/agendamentos/${encodeURIComponent(id)}/${action}`, { method: "PATCH" });
}

/** Nome de cada especialidade pelo ID (`GET /especialidades`); em falha usa o nome genérico nas telas. */
export async function loadSpecialtyNames(): Promise<Map<number, string>> {
  const items: CatalogItem[] = await listSpecialties().catch(() => []);
  return new Map(items.map((item) => [item.id, item.nome]));
}

async function toClientAppointments(appointments: ApiAppointment[], myVehicles: ApiVehicle[]): Promise<ClientAppointment[]> {
  if (appointments.length === 0) return [];

  const providerIds = [...new Set(appointments.map((item) => item.prestadorId))];
  // Veículos removidos (desativados) não vêm em /veiculos/me: tenta a consulta individual antes de usar um nome genérico.
  const missingVehicleIds = [...new Set(appointments.map((item) => item.veiculoId))].filter(
    (id) => !myVehicles.some((vehicle) => vehicle.id === id),
  );

  const [specialtyNames, providers, otherVehicles] = await Promise.all([
    loadSpecialtyNames(),
    Promise.all(providerIds.map((id) => getProvider(id).catch(() => null))),
    Promise.all(
      missingVehicleIds.map((id) => apiRequest<ApiVehicle>(`/veiculos/${encodeURIComponent(id)}`).catch(() => null)),
    ),
  ]);

  const providerNames = new Map(providerIds.map((id, index) => [id, providers[index]?.nome ?? "Prestador"]));
  const vehicles = [...myVehicles, ...otherVehicles.filter((item): item is ApiVehicle => item !== null)];

  return appointments
    .map<ClientAppointment>((item) => {
      const vehicle = vehicles.find((candidate) => candidate.id === item.veiculoId);
      return {
        id: item.id,
        clientId: item.clienteId,
        providerId: item.prestadorId,
        providerName: providerNames.get(item.prestadorId) ?? "Prestador",
        vehicleId: item.veiculoId,
        vehicleLabel: vehicle ? vehicleLabel(vehicle) : "Veículo removido",
        specialtyIds: [item.especialidadeId],
        specialtyNames: [specialtyNames.get(item.especialidadeId) ?? "Serviço"],
        slotId: item.horarioId,
        date: item.data,
        time: formatTime(item.horaInicio),
        description: "",
        status: toAppointmentStatus(item.status),
        createdAt: new Date(item.criadoEm),
        updatedAt: lastChangeOf(item),
      };
    })
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

async function loadMyVehicles(): Promise<ApiVehicle[]> {
  return apiRequest<ApiVehicle[]>("/veiculos/me").catch(() => []);
}

/**
 * Agendamentos do cliente logado. Garante antes o usuário na API (`GET /usuarios/me`, `POST /usuarios` se 404),
 * pois sem ele a rota responde 404. Do mais próximo para o mais distante no futuro e, depois, do mais recente
 * para o mais antigo no passado.
 */
export async function listClientAppointments(profile: ClientProfile | null, email: string | null): Promise<ClientAppointment[]> {
  await ensureApiUser(profile, email);
  const [appointments, vehicles] = await Promise.all([fetchApiAppointments(), loadMyVehicles()]);
  return toClientAppointments(appointments, vehicles);
}

/** `GET /api/v1/agendamentos/{id}`; `null` quando não existe ou não pertence ao usuário (a API responde 404). */
export async function getClientAppointment(id: string): Promise<ClientAppointment | null> {
  let appointment: ApiAppointment;
  try {
    appointment = await apiRequest<ApiAppointment>(`/agendamentos/${encodeURIComponent(id)}`);
  } catch (error) {
    // 400 = identificador que não é um UUID (ex.: link digitado à mão).
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
  const [item] = await toClientAppointments([appointment], await loadMyVehicles());
  return item ?? null;
}

export interface NewAppointmentInput {
  vehicleId: string;
  slotId: string;
  /** A API recebe uma única especialidade por agendamento. */
  specialtyId: number;
}

/**
 * `POST /api/v1/agendamentos` — o cliente é identificado pelo token. A reserva nasce PENDENTE. Duplicidade
 * (mesmo veículo e horário) e horário lotado voltam como 409 com a mensagem da API.
 */
export async function createAppointment(input: NewAppointmentInput): Promise<string> {
  const created = await apiRequest<ApiAppointment>("/agendamentos", {
    method: "POST",
    body: { veiculoId: input.vehicleId, horarioId: input.slotId, especialidadeId: input.specialtyId },
  });
  return created.id;
}

/**
 * `PATCH /api/v1/agendamentos/{id}/remarcar` — só o cliente dono, de um agendamento PENDENTE antes do início,
 * para outro horário aberto do mesmo prestador. O agendamento mantém o ID e continua PENDENTE.
 */
export async function rescheduleAppointment(id: string, slotId: string): Promise<void> {
  await apiRequest<ApiAppointment>(`/agendamentos/${encodeURIComponent(id)}/remarcar`, {
    method: "PATCH",
    body: { horarioId: slotId },
  });
}

/** `PATCH /api/v1/agendamentos/{id}/cancelar` — cliente ou prestador, pendente/confirmado antes do início. */
export async function cancelAppointment(id: string): Promise<void> {
  await changeAppointment(id, "cancelar");
}
