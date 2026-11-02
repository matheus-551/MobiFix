import { getFirebaseAuth } from "@/shared/lib/firebase/client";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";

/**
 * Cliente HTTP único da API MobiFix (Spring Boot). As rotas são relativas a `/api/v1` e chegam à
 * API pelo rewrite definido em `next.config.ts`. A API ainda não valida tokens (usa uma identidade
 * simulada no servidor), por isso nenhum cabeçalho de autenticação é enviado.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1").replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: { field: string; message: string }[];

  constructor(status: number, message: string, fieldErrors: { field: string; message: string }[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

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

async function toApiError(response: Response): Promise<ApiError> {
  let message = `A API respondeu com erro ${response.status}.`;
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
    await auth.authStateReady();
    return (await auth.currentUser?.getIdToken(forceRefresh)) ?? null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, signal } = options;

  async function send(token: string | null): Promise<Response> {
    return fetch(buildUrl(path, query), {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  }

  let response: Response;
  try {
    const token = await getIdToken(false);
    response = await send(token);
    // 401 com sessão ativa: o token pode ter expirado/sido revogado. Renova uma vez e tenta de novo.
    if (response.status === 401 && token) {
      const fresh = await getIdToken(true);
      if (fresh) response = await send(fresh);
    }
  } catch (error) {
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
