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

/** Agendamento do cliente (coleção `appointments` do Firestore, ver README). */
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
  description: string;
  status: AppointmentStatus;
  createdAt: Date | null;
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
