import { ApiError, apiRequest } from "@/shared/lib/api/http";
import { onlyDigits } from "@/shared/utils/format";
import type { ProviderProfile } from "@/shared/types/domain";
import type { ApiUser } from "@/features/cliente/types";
import type { ApiProviderProfile, ApiProviderProfileInput, ApiSlot } from "../types";

/**
 * Garante que o prestador exista na API (`GET /usuarios/me`; se 404, `POST /usuarios` com tipo PRESTADOR).
 * O cadastro do web grava apenas no Firebase. A API ainda usa uma identidade simulada no servidor
 * (app.mock.firebase-id): se essa identidade já for de um cliente, a criação do perfil profissional é recusada.
 */
export async function ensureApiProviderUser(profile: ProviderProfile, email: string): Promise<ApiUser> {
  let user: ApiUser;
  try {
    user = await apiRequest<ApiUser>("/usuarios/me");
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    const [nome, ...rest] = profile.responsibleName.trim().split(/\s+/);
    user = await apiRequest<ApiUser>("/usuarios", {
      method: "POST",
      body: {
        nome,
        sobrenome: rest.join(" ") || nome,
        email,
        telefone: onlyDigits(profile.phone),
        uf: profile.state,
        tipo: "PRESTADOR",
      },
    });
  }
  if (user.tipo !== "PRESTADOR") {
    throw new ApiError(409, "A identidade atual da API pertence a uma conta de cliente e não pode ter perfil de prestador.");
  }
  return user;
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
