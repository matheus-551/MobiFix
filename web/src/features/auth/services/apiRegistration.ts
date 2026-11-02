import { ApiError, getFriendlyError, apiRequest } from "@/shared/lib/api/http";

/**
 * Cadastro do usuário na API MobiFix: `POST /api/v1/usuarios` (corpo = `CriarUsuarioRequest`:
 * nome, sobrenome, email, telefone só com dígitos (10–11), uf e tipo `CLIENTE` | `PRESTADOR`).
 *
 * A API ainda usa uma identidade simulada única no servidor (`app.mock.firebase-id`): só o primeiro
 * cadastro de cada instância é aceito; os demais recebem 409. Por isso o resultado é devolvido em vez
 * de lançado — o cadastro no Firebase não é desfeito por uma limitação do backend, e a tela informa
 * claramente quando a API não registrou o usuário.
 */
export interface ApiUserInput {
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  uf: string;
  tipo: "CLIENTE" | "PRESTADOR";
}

export type ApiSyncResult = { ok: true } | { ok: false; reason: string };

export async function registerUserInApi(input: ApiUserInput): Promise<ApiSyncResult> {
  try {
    await apiRequest("/usuarios", { method: "POST", body: input });
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        return {
          ok: false,
          reason:
            "a API recusou o cadastro por duplicidade (a API ainda usa uma identidade simulada única, então só aceita um usuário por instância)",
        };
      }
      if (error.status === 0) return { ok: false, reason: "a API está indisponível no momento" };
    }
    return { ok: false, reason: getFriendlyError(error).replace(/\.$/, "").toLowerCase() };
  }
}
