import { ApiError, apiRequest } from "@/shared/lib/api/http";
import type { ClientProfile } from "@/shared/types/domain";
import { onlyDigits } from "@/shared/utils/format";
import type { ApiUser, ApiVehicle, NewVehicleInput } from "../types";

/**
 * Garante que o cliente exista na API (`GET /usuarios/me`; se 404, `POST /usuarios` com os dados do perfil).
 * Necessário porque o cadastro do web grava apenas no Firebase. Observação: a API ainda usa uma identidade
 * simulada no servidor (app.mock.firebase-id), então todos os logins compartilham o mesmo usuário da API.
 */
export async function ensureApiUser(profile: ClientProfile | null, email: string | null): Promise<ApiUser> {
  try {
    return await apiRequest<ApiUser>("/usuarios/me");
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    if (!profile || !email) {
      throw new ApiError(404, "Seu cadastro ainda não existe na API e o perfil local está incompleto.");
    }
    return apiRequest<ApiUser>("/usuarios", {
      method: "POST",
      body: {
        nome: profile.firstName,
        sobrenome: profile.lastName,
        email,
        telefone: onlyDigits(profile.phone),
        uf: profile.state,
        tipo: "CLIENTE",
      },
    });
  }
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
