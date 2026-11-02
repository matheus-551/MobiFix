import { createResendMailer } from "../email/resendMailer";
import { createFirestoreStore } from "../google/firestoreStore";
import { createIdentityAdmin } from "../google/identityAdmin";
import { readServerEnv } from "../google/serviceAccount";
import { createVerificationService, type VerificationService } from "./service";
import { VerificationError } from "./types";

const STATUS: Record<string, number> = {
  invalid_input: 400,
  invalid_code: 400,
  invalid_token: 400,
  no_code: 404,
  expired: 410,
  email_in_use: 409,
  already_used: 409,
  rate_limited: 429,
  too_many_attempts: 429,
  send_failed: 502,
  not_configured: 503,
  server_error: 500,
};

export function getVerificationService(): VerificationService {
  const env = readServerEnv();
  return createVerificationService({
    store: createFirestoreStore(env),
    mailer: createResendMailer(env),
    identity: createIdentityAdmin(env),
    secret: env.secret,
  });
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as unknown;
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    /* corpo ausente ou inválido */
  }
  throw new VerificationError("invalid_input", "Requisição inválida.");
}

/** Converte qualquer erro em resposta JSON padronizada: `{ code, message, retryAfter?, attemptsLeft? }`. */
export function errorResponse(error: unknown): Response {
  if (error instanceof VerificationError) {
    const headers: Record<string, string> = { "Cache-Control": "no-store" };
    if (error.extra.retryAfter) headers["Retry-After"] = String(error.extra.retryAfter);
    return Response.json(
      { code: error.code, message: error.message, ...error.extra },
      { status: STATUS[error.code] ?? 500, headers },
    );
  }
  console.error("[email-verification] erro inesperado:", error instanceof Error ? error.message : error);
  return Response.json(
    { code: "server_error", message: "Não foi possível concluir a operação. Tente novamente." },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

export const noStore = { "Cache-Control": "no-store" } as const;
