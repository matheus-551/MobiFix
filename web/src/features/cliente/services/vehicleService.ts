import { apiRequest } from "@/shared/lib/api/http";
import { ensureApiUserFor } from "@/features/auth/services/apiAccountService";
import type { ClientProfile } from "@/shared/types/domain";
import type { ApiUser, ApiVehicle, NewVehicleInput } from "../types";

/**
 * Garante que o cliente exista na API: `GET /usuarios/me` e, se 404, `POST /usuarios` com os dados do perfil
 * (mesma regra do mobile; ver `features/auth/utils/apiUserSync.ts`). O usuário também é criado logo após o
 * cadastro; esta chamada repara os casos em que a API estava fora do ar nesse momento. A identidade na API é o
 * UID do Firebase validado pelo ID token (cada conta tem o seu usuário).
 */
export function ensureApiUser(profile: ClientProfile | null, email: string | null): Promise<ApiUser> {
  const create =
    profile && email
      ? { nome: profile.firstName, sobrenome: profile.lastName, email, telefone: profile.phone, uf: profile.state }
      : null;
  return ensureApiUserFor("CLIENTE", create);
}

/** `GET /api/v1/veiculos/me` */
export async function listMyVehicles(profile: ClientProfile | null, email: string | null): Promise<ApiVehicle[]> {
  await ensureApiUser(profile, email);
  return apiRequest<ApiVehicle[]>("/veiculos/me");
}

/** `POST /api/v1/veiculos` */
export function createVehicle(input: NewVehicleInput): Promise<ApiVehicle> {
  return apiRequest<ApiVehicle>("/veiculos", {
    method: "POST",
    body: {
      tipoVeiculoId: input.tipoVeiculoId,
      marca: input.marca.trim(),
      modelo: input.modelo.trim(),
      ano: input.ano,
      placa: input.placa?.trim() ? input.placa.trim().toUpperCase() : undefined,
    },
  });
}

/** `DELETE /api/v1/veiculos/{id}` (desativa o veículo). */
export function deactivateVehicle(id: string): Promise<void> {
  return apiRequest<void>(`/veiculos/${encodeURIComponent(id)}`, { method: "DELETE" });
}
