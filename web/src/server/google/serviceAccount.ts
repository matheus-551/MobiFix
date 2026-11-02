import { createSign } from "node:crypto";
import { VerificationError } from "../emailVerification/types";

/**
 * Credenciais de serviço do Firebase lidas SOMENTE de variáveis de ambiente do servidor
 * (sem prefixo NEXT_PUBLIC_, portanto nunca entram no bundle do navegador).
 */
export interface ServerEnv {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  secret: string;
  resendApiKey: string;
  emailFrom: string;
}

const REQUIRED = [
  ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", "projectId"],
  ["FIREBASE_ADMIN_CLIENT_EMAIL", "clientEmail"],
  ["FIREBASE_ADMIN_PRIVATE_KEY", "privateKey"],
  ["EMAIL_VERIFICATION_SECRET", "secret"],
  ["RESEND_API_KEY", "resendApiKey"],
  ["EMAIL_FROM", "emailFrom"],
] as const;

export function readServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  const missing = REQUIRED.filter(([name]) => !env[name]?.trim()).map(([name]) => name);
  if (missing.length > 0) {
    console.error(`[email-verification] Variáveis de ambiente ausentes: ${missing.join(", ")}`);
    throw new VerificationError(
      "not_configured",
      "A verificação de e-mail não está configurada no servidor. Contate o suporte.",
    );
  }
  const secret = env.EMAIL_VERIFICATION_SECRET!.trim();
  if (secret.length < 32) {
    console.error("[email-verification] EMAIL_VERIFICATION_SECRET precisa ter ao menos 32 caracteres.");
    throw new VerificationError("not_configured", "A verificação de e-mail não está configurada no servidor. Contate o suporte.");
  }
  return {
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!.trim(),
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL!.trim(),
    // Painéis de hospedagem costumam guardar a chave com "\n" literal.
    privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    secret,
    resendApiKey: env.RESEND_API_KEY!.trim(),
    emailFrom: env.EMAIL_FROM!.trim(),
  };
}

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/datastore";

const b64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

let cached: { token: string; expiresAt: number; key: string } | null = null;

/** Token OAuth2 da conta de serviço (JWT RS256 assinado localmente, sem dependências). Em cache até 1 min antes de expirar. */
export async function getAccessToken(env: ServerEnv, fetchImpl: typeof fetch = fetch): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  if (cached && cached.key === env.clientEmail && cached.expiresAt - 60 > nowSec) return cached.token;

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: env.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: nowSec, exp: nowSec + 3600 }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(env.privateKey);
  const assertion = `${header}.${claims}.${b64url(signature)}`;

  const response = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error(`[email-verification] Falha ao obter token OAuth (${response.status}).`);
    throw new VerificationError("server_error", "Serviço de verificação indisponível. Tente novamente em instantes.");
  }
  const body = (await response.json()) as { access_token: string; expires_in: number };
  cached = { token: body.access_token, expiresAt: nowSec + body.expires_in, key: env.clientEmail };
  return body.access_token;
}
