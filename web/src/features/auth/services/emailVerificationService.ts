/**
 * Cliente das rotas de servidor `/api/email-verification/*` (route handlers do próprio Next.js).
 * O navegador nunca recebe o código nem segredos: só envia o que o usuário digitou e recebe um
 * token de uso único depois que o servidor valida o código.
 */

export type VerificationFailure =
  | "invalid_input"
  | "email_in_use"
  | "rate_limited"
  | "send_failed"
  | "no_code"
  | "invalid_code"
  | "expired"
  | "too_many_attempts"
  | "already_used"
  | "invalid_token"
  | "not_configured"
  | "server_error"
  | "network";

export class EmailVerificationError extends Error {
  constructor(
    public readonly code: VerificationFailure,
    message: string,
    public readonly retryAfter?: number,
    public readonly attemptsLeft?: number,
  ) {
    super(message);
    this.name = "EmailVerificationError";
  }
}

const BASE = "/api/email-verification";

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new EmailVerificationError("network", "Falha de conexão. Verifique sua internet e tente novamente.");
  }

  const data = (await response.json().catch(() => null)) as
    | (T & { code?: VerificationFailure; message?: string; retryAfter?: number; attemptsLeft?: number })
    | null;

  if (!response.ok) {
    throw new EmailVerificationError(
      data?.code ?? "server_error",
      data?.message ?? "Não foi possível concluir a operação. Tente novamente.",
      data?.retryAfter,
      data?.attemptsLeft,
    );
  }
  return data as T;
}

export interface CodeRequestResult {
  resendAfterSeconds: number;
  expiresInSeconds: number;
}

/** Envia (ou reenvia) o código para o e-mail. */
export function requestVerificationCode(email: string): Promise<CodeRequestResult> {
  return post<CodeRequestResult>("/request", { email });
}

/** Valida o código; devolve o token de uso único que autoriza a criação da conta. */
export function confirmVerificationCode(email: string, code: string): Promise<{ token: string; expiresInSeconds: number }> {
  return post("/confirm", { email, code });
}

/** Cria a conta no Firebase Authentication já com e-mail verificado (só o servidor consegue fazer isso). */
export function createVerifiedAccount(input: {
  email: string;
  token: string;
  password: string;
  displayName: string;
}): Promise<{ uid: string }> {
  return post("/account", input);
}
