import { apiRequest } from "@/shared/lib/api/http";
import type { ApiUser } from "@/features/cliente/types";
import { syncApiUser, type ApiUserCreateData, type ApiUserType } from "../utils/apiUserSync";

/**
 * Garante o usuário na API (`/usuarios`) com o ID token do usuário logado. Mesma regra do mobile
 * (`concluirCadastro`); a lógica está em `utils/apiUserSync.ts`.
 */
export function ensureApiUserFor(tipo: ApiUserType, create: ApiUserCreateData | null): Promise<ApiUser> {
  return syncApiUser(apiRequest, tipo, create);
}

/**
 * Chamado logo após o cadastro no Firebase, como o mobile faz. Não bloqueia a tela nem apaga a conta
 * Firebase se falhar (a API pode estar fora do ar): o usuário é criado de novo, sob demanda, no primeiro
 * acesso às telas que usam a API (`ensureApiUserFor`).
 */
export function syncApiUserAfterSignup(tipo: ApiUserType, create: ApiUserCreateData): void {
  void ensureApiUserFor(tipo, create).catch(() => undefined);
}
