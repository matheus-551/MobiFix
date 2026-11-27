/** Tipos das respostas da API MobiFix usadas pelo painel do cliente (espelham os DTOs do backend). */

export interface CatalogItem {
  id: number;
  nome: string;
}

export interface PublicProvider {
  id: string;
  nome: string;
  descricao: string | null;
  cidade: string;
  uf: string;
  tiposVeiculo: CatalogItem[];
  especialidades: CatalogItem[];
}

export interface ProviderPage {
  content: PublicProvider[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ProviderFilters {
  tipoVeiculoId?: number;
  especialidadeId?: number;
  uf?: string;
  cidade?: string;
}

/** Horário aberto na agenda do prestador (`GET /prestadores/{id}/horarios`). */
export interface AvailableSlot {
  id: string;
  data: string; // yyyy-MM-dd
  horaInicio: string; // HH:mm[:ss]
  vagasDisponiveis: number;
}

export interface ApiVehicle {
  id: string;
  clienteId: string;
  tipoVeiculoId: number;
  marca: string;
  modelo: string;
  ano: number;
  placa: string | null;
}

export interface NewVehicleInput {
  tipoVeiculoId: number;
  marca: string;
  modelo: string;
  ano: number;
  placa?: string;
}

export interface ApiUser {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  uf: string;
  tipo: string;
  ativo: boolean;
}

/** Status devolvido pela API em `/agendamentos`. */
export type ApiAppointmentStatus = "PENDENTE" | "CONFIRMADO" | "CANCELADO" | "CONCLUIDO";

/** Resposta de `/agendamentos` (DTO `AgendamentoResponse`). */
export interface ApiAppointment {
  id: string;
  clienteId: string;
  prestadorId: string;
  veiculoId: string;
  horarioId: string;
  especialidadeId: number;
  data: string; // yyyy-MM-dd
  horaInicio: string; // HH:mm[:ss]
  status: ApiAppointmentStatus;
  criadoEm: string; // instante UTC (ISO-8601)
  confirmadoEm: string | null;
  canceladoEm: string | null;
  concluidoEm: string | null;
  remarcadoEm: string | null;
}

/** Resposta de `GET /agendamentos/me`. */
export interface ApiAppointmentPage {
  content: ApiAppointment[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Agendamento do cliente (API `/agendamentos`, com nomes obtidos dos demais recursos da API). */
export type AppointmentStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface ClientAppointment {
  id: string;
  clientId: string;
  providerId: string;
  providerName: string;
  vehicleId: string;
  vehicleLabel: string;
  specialtyIds: number[];
  specialtyNames: string[];
  slotId: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  /** A API não possui descrição do problema: fica sempre vazia. */
  description: string;
  status: AppointmentStatus;
  createdAt: Date | null;
  /** Última alteração (mudança de status); ausente em documentos antigos. */
  updatedAt?: Date | null;
}

export interface ProviderReview {
  id: string;
  appointmentId: string;
  providerId: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: Date | null;
}

export interface RatingSummary {
  average: number;
  count: number;
}
