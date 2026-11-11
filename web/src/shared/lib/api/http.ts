import { getFirebaseAuth } from "@/shared/lib/firebase/client";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import { createTimeoutSignal, withTimeout } from "@/shared/utils/timeout";
import { ApiError } from "./ApiError";
import { isPublicApiRequest } from "./publicRoutes";

/**
 * Cliente HTTP único da API MobiFix (Spring Boot). As rotas são relativas a `/api/v1` e chegam à
 * API pelo rewrite definido em `next.config.ts`. A API valida o ID Token do Firebase (Admin SDK):
 * rotas protegidas recebem `Authorization: Bearer <token>`; as rotas públicas (catálogos, busca e
 * agenda pública de prestadores) são chamadas SEM token, pois a API devolve 401/503 a qualquer
 * requisição que traga um token que ela não consiga validar, mesmo em rota pública.
 * Toda requisição tem limite de tempo: nenhuma tela fica em "carregando" para sempre.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1").replace(/\/+$/, "");

/** Tempo máximo (ms) esperando a API responder por completo (cabeçalho + corpo). */
export const API_TIMEOUT_MS = 20_000;
/** Tempo máximo (ms) para obter/renovar o ID Token antes de enviar a requisição. */
const TOKEN_TIMEOUT_MS = 10_000;

const TIMEOUT_MESSAGE = "A API demorou demais para responder. Tente novamente em instantes.";

// A classe vive em ./ApiError (sem dependências); é reexportada aqui para os imports existentes.
export { ApiError };

type Query = Record<string, string | number | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const search = params.toString();
  return `${API_BASE}${path}${search ? `?${search}` : ""}`;
}

/** Mensagem padrão por status HTTP, usada quando a API não envia `detail`/`title` (ProblemDetail). */
function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return "Os dados enviados são inválidos. Revise os campos e tente novamente.";
    case 403:
      return "Você não tem permissão para realizar esta operação.";
    case 404:
      return "O recurso solicitado não foi encontrado.";
    case 409:
      return "Esta operação conflita com um registro já existente.";
    case 422:
      return "Não foi possível processar os dados informados.";
    case 503:
      return "O serviço de autenticação da API está indisponível no momento. Tente novamente em instantes.";
    default:
      return status >= 500
        ? "A API está indisponível ou com problemas no momento. Tente novamente em instantes."
        : `A API respondeu com erro ${status}.`;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let message = defaultMessageFor(response.status);
  let fieldErrors: { field: string; message: string }[] = [];
  try {
    // Erros da API seguem o formato ProblemDetail (RFC 9457): { status, title, detail, errors? }.
    const problem = (await response.json()) as { detail?: string; title?: string; errors?: typeof fieldErrors };
    if (problem.detail) message = problem.detail;
    else if (problem.title) message = problem.title;
    if (Array.isArray(problem.errors)) fieldErrors = problem.errors;
  } catch {
    /* corpo vazio ou não JSON: mantém a mensagem padrão */
  }
  return new ApiError(response.status, message, fieldErrors);
}

/** ID Token do usuário logado (o SDK renova sozinho quando está perto de expirar). `null` sem sessão. */
async function getIdToken(forceRefresh: boolean): Promise<string | null> {
  try {
    const auth = getFirebaseAuth();
    return await withTimeout(
      (async () => {
        await auth.authStateReady();
        return (await auth.currentUser?.getIdToken(forceRefresh)) ?? null;
      })(),
      TOKEN_TIMEOUT_MS,
    );
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, signal } = options;
  const isPublic = isPublicApiRequest(method, path);
  const timeout = createTimeoutSignal(API_TIMEOUT_MS, signal);

  async function send(token: string | null): Promise<Response> {
    return fetch(buildUrl(path, query), {
      method,
      signal: timeout.signal,
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  }

  try {
    let response: Response;
    try {
      const token = isPublic ? null : await getIdToken(false);
      response = await send(token);
      // 401 com sessão ativa: o token pode ter expirado/sido revogado. Renova uma vez e tenta de novo.
      if (response.status === 401 && token) {
        const fresh = await getIdToken(true);
        if (fresh) response = await send(fresh);
      }
    } catch (error) {
      if (timeout.timedOut) throw new ApiError(0, TIMEOUT_MESSAGE);
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new ApiError(0, "Não foi possível conectar à API. Verifique se o servidor está em execução.");
    }

    if (response.status === 401) {
      throw new ApiError(401, "Sua sessão expirou. Entre novamente para continuar.");
    }
    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  } catch (error) {
    // O limite também vale para a leitura do corpo: se estourou durante ela, vira o mesmo erro amigável.
    if (timeout.timedOut && !(error instanceof ApiError)) throw new ApiError(0, TIMEOUT_MESSAGE);
    throw error;
  } finally {
    timeout.clear();
  }
}

/** Mensagem amigável para qualquer erro da tela (API, Firebase ou inesperado). */
export function getFriendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.fieldErrors.length > 0) {
      return `${error.message} ${error.fieldErrors.map((item) => item.message).join(" ")}`.trim();
    }
    return error.message;
  }
  return getErrorMessage(error);
}
