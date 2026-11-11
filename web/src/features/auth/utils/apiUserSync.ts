import { ApiError } from "../../../shared/lib/api/ApiError";
import type { ApiUser } from "../../cliente/types";

/**
 * Sincronização do usuário na API (`/usuarios`), espelhando `concluirCadastro` do aplicativo mobile
 * (mobile/src/services/authService.ts):
 *   1. `GET /usuarios/me`;
 *   2. 404 → `POST /usuarios` (nome, sobrenome, email, telefone só com dígitos, uf, tipo);
 *   3. 409 no POST (resposta perdida ou criação concorrente) → só é sucesso se `GET /usuarios/me` existir;
 *   4. conta desativada (`ativo=false`) ou de outro tipo → erro.
 * Não depende do Firebase: recebe a função de requisição por parâmetro (usada nos testes).
 */

export type ApiUserType = "CLIENTE" | "PRESTADOR";

/** Dados de cadastro enviados em `POST /usuarios` (o `tipo` vai à parte). */
export interface ApiUserCreateData {
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  uf: string;
}

export type ApiCall = <T>(path: string, options?: { method?: "POST"; body?: unknown }) => Promise<T>;

function hasStatus(error: unknown, status: number): boolean {
  return typeof error === "object" && error !== null && (error as { status?: number }).status === status;
}

/** "Maria da Silva" → { nome: "Maria", sobrenome: "da Silva" }; nome único repete-se como sobrenome (a API exige ambos). */
export function splitFullName(fullName: string): { nome: string; sobrenome: string } {
  const [nome = "", ...rest] = fullName.trim().split(/\s+/);
  return { nome, sobrenome: rest.join(" ") || nome };
}

/**
 * Garante que o usuário autenticado exista na API e devolve o registro.
 * `create === null`: apenas consulta (se não existir, 404; não há dados para criar).
 */
export async function syncApiUser(
  request: ApiCall,
  tipo: ApiUserType,
  create: ApiUserCreateData | null,
): Promise<ApiUser> {
  let user: ApiUser;
  try {
    user = await request<ApiUser>("/usuarios/me");
  } catch (error) {
    if (!hasStatus(error, 404)) throw error;
    if (!create) {
      throw new ApiError(404, "Seu cadastro ainda não existe na API e o perfil local está incompleto.");
    }
    try {
      user = await request<ApiUser>("/usuarios", {
        method: "POST",
        body: {
          nome: create.nome.trim(),
          sobrenome: create.sobrenome.trim(),
          email: create.email,
          telefone: create.telefone.replace(/\D/g, ""),
          uf: create.uf,
          tipo,
        },
      });
    } catch (creation) {
      if (!hasStatus(creation, 409)) throw creation;
      try {
        user = await request<ApiUser>("/usuarios/me");
      } catch {
        throw creation;
      }
    }
  }
  if (!user.ativo) throw new ApiError(403, "Sua conta está desativada.");
  if (user.tipo !== tipo) throw new ApiError(409, "A conta já possui outro tipo de cadastro.");
  return user;
}
