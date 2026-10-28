/**
 * Modelos de negócio derivados do diagrama relacional, adaptados ao Firestore.
 * - O UID do Firebase Authentication é o identificador de USER (não há hash de
 *   senha: as credenciais ficam exclusivamente no Authentication).
 * - Documentos de perfil usam o mesmo UID como ID (1:1 com USER).
 * - PROVIDER_VEHICLE_TYPE e PROVIDER_SPECIALTY (N:N) viram arrays de IDs no
 *   perfil do prestador, pois são sempre lidos junto com ele.
 */

export type UserRole = "client" | "provider" | "admin";
export type UserStatus = "active" | "pending" | "suspended";

/** Coleção `users/{uid}` — papel e status só podem ser alterados por privilégio administrativo. */
export interface UserAccount {
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Coleção `clientProfiles/{uid}` (CLIENT_PROFILE). */
export interface ClientProfile {
  firstName: string;
  lastName: string;
  phone: string;
  state: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Cadastro → e-mail verificado → análise documental → aprovação são etapas distintas. */
export type ProviderApprovalStatus =
  | "under_review"
  | "approved"
  | "rejected"
  | "changes_requested";

export type ProviderDocumentKind = "identity" | "business_proof";

export interface ProviderDocument {
  kind: ProviderDocumentKind;
  fileName: string;
  contentType: string;
  size: number;
  storagePath: string;
}

/** Coleção `providerProfiles/{uid}` (PROVIDER_PROFILE + PROVIDER_VEHICLE_TYPE + PROVIDER_SPECIALTY). */
export interface ProviderProfile {
  responsibleName: string;
  displayName: string;
  phone: string;
  taxIdType: "cpf" | "cnpj";
  taxId: string;
  address: string;
  city: string;
  state: string;
  vehicleTypeIds: string[];
  specialtyIds: string[];
  documents: ProviderDocument[];
  approvalStatus: ProviderApprovalStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/* Entidades do diagrama ainda sem tela: tipadas para uso futuro. */

export interface VehicleType {
  id: string;
  name: string;
}

export interface Specialty {
  id: string;
  name: string;
  active: boolean;
}

export interface Vehicle {
  id: string;
  clientId: string;
  vehicleTypeId: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
}

export interface AvailabilitySlot {
  id: string;
  providerId: string;
  startsAt: Date;
  endsAt: Date;
  status: "open" | "booked" | "blocked";
}

export interface Appointment {
  id: string;
  clientId: string;
  providerId: string;
  vehicleId: string;
  specialtyId: string;
  requestedStart: Date;
  requestedEnd: Date;
  status: "requested" | "confirmed" | "completed" | "cancelled";
  description: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  appointmentId: string;
  clientId: string;
  providerId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: Date;
}
