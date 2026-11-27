import type { AppointmentStatus } from "@/features/cliente/types";

/** Tipos das respostas da API MobiFix usadas pelo painel do prestador (espelham os DTOs do backend). */

export interface ApiAddress {
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

/** `GET /prestadores/me/perfil` */
export interface ApiProviderProfile {
  id: string;
  usuarioId: string;
  nomeFantasia: string | null;
  descricao: string | null;
  endereco: ApiAddress;
  tiposVeiculoIds: number[];
  especialidadeIds: number[];
}

/** Corpo de `POST` e `PUT /prestadores/me/perfil`. */
export interface ApiProviderProfileInput {
  nomeFantasia: string;
  descricao: string;
  endereco: ApiAddress;
  tiposVeiculoIds: number[];
  especialidadeIds: number[];
}

/** `GET /prestadores/me/horarios` */
export interface ApiSlot {
  id: string;
  prestadorId: string;
  data: string; // yyyy-MM-dd
  horaInicio: string; // HH:mm[:ss]
  capacidadeTotal: number;
  bloqueado: boolean;
}

/**
 * Agendamento recebido pelo prestador (`GET /agendamentos/me`). A API identifica o cliente apenas por ID e não
 * informa veículo, valor nem avaliação ao prestador.
 */
export interface ProviderAppointment {
  id: string;
  clientId: string;
  specialtyName: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  status: AppointmentStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
}
