import { ApiError, apiRequest } from "@/shared/lib/api/http";
import { ensureApiUserFor } from "@/features/auth/services/apiAccountService";
import { splitFullName } from "@/features/auth/utils/apiUserSync";
import type { ProviderProfile } from "@/shared/types/domain";
import type { ApiUser } from "@/features/cliente/types";
import type { ApiProviderProfile, ApiProviderProfileInput, ApiSlot } from "../types";

/**
 * Garante que o prestador exista na API: `GET /usuarios/me` e, se 404, `POST /usuarios` com tipo PRESTADOR
 * (mesma regra do mobile; ver `features/auth/utils/apiUserSync.ts`). Se a conta existir com outro tipo, ou
 * estiver desativada, devolve erro. O perfil profissional (`/prestadores/me/perfil`) é criado/atualizado
 * depois, no editor de perfil, porque exige endereço completo (CEP, número, bairro) que o cadastro web não coleta.
 */
export function ensureApiProviderUser(profile: ProviderProfile, email: string): Promise<ApiUser> {
  return ensureApiUserFor("PRESTADOR", {
    ...splitFullName(profile.responsibleName),
    email,
    telefone: profile.phone,
    uf: profile.state,
  });
}

/** `GET /api/v1/prestadores/me/perfil`; `null` quando o perfil ainda não foi cadastrado na API. */
export async function getMyApiProfile(): Promise<ApiProviderProfile | null> {
  try {
    return await apiRequest<ApiProviderProfile>("/prestadores/me/perfil");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** `POST` (cadastro) ou `PUT` (atualização) em `/api/v1/prestadores/me/perfil`. */
export function saveMyApiProfile(input: ApiProviderProfileInput, exists: boolean): Promise<ApiProviderProfile> {
  return apiRequest<ApiProviderProfile>("/prestadores/me/perfil", { method: exists ? "PUT" : "POST", body: input });
}

/** `GET /api/v1/prestadores/me/horarios?inicio&fim` (período máximo de 366 dias). */
export function listMySlots(inicio: string, fim: string): Promise<ApiSlot[]> {
  return apiRequest<ApiSlot[]>("/prestadores/me/horarios", { query: { inicio, fim } });
}

/** `POST /api/v1/prestadores/me/horarios` */
export function createSlot(data: string, horaInicio: string, capacidadeTotal: number): Promise<ApiSlot> {
  return apiRequest<ApiSlot>("/prestadores/me/horarios", { method: "POST", body: { data, horaInicio, capacidadeTotal } });
}

/** `PUT /api/v1/prestadores/me/horarios/{id}` */
export function updateSlot(id: string, capacidadeTotal: number, bloqueado: boolean): Promise<ApiSlot> {
  return apiRequest<ApiSlot>(`/prestadores/me/horarios/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: { capacidadeTotal, bloqueado },
  });
}
