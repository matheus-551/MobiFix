import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { COLLECTIONS, VERIFICATION_LIMITS as L } from "./config";
import {
  ConflictError,
  EmailAlreadyExistsError,
  VerificationError,
  type DocStore,
  type IdentityAdmin,
  type LimitRecord,
  type Mailer,
  type VerificationRecord,
} from "./types";

export interface VerificationDeps {
  store: DocStore;
  mailer: Mailer;
  identity: IdentityAdmin;
  /** Segredo do servidor (HMAC dos códigos e dos IPs). Nunca vai para o navegador. */
  secret: string;
  now?: () => number;
  /** Injetável para testes; em produção usa `crypto.randomInt`. */
  generateCode?: () => string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_WRITE_RETRIES = 5;

export function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") throw new VerificationError("invalid_input", "Informe um e-mail válido.");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new VerificationError("invalid_input", "Informe um e-mail válido.");
  }
  return email;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

function defaultGenerateCode(): string {
  return randomInt(0, 10 ** L.codeLength).toString().padStart(L.codeLength, "0");
}

export function createVerificationService(deps: VerificationDeps) {
  const { store, mailer, identity, secret } = deps;
  const now = deps.now ?? Date.now;
  const generateCode = deps.generateCode ?? defaultGenerateCode;

  const docId = (email: string) => sha256(email);
  const hashCode = (id: string, salt: string, code: string) =>
    createHmac("sha256", secret).update(`${id}:${salt}:${code}`).digest("hex");

  /**
   * Limite por janela fixa (usado por IP). Guarda só um HMAC do IP.
   * Retorna os segundos até liberar quando o limite foi excedido; `0` quando permitido.
   */
  async function hit(scope: string, subject: string, limit: number): Promise<number> {
    const id = createHmac("sha256", secret).update(`${scope}:${subject}`).digest("hex");
    for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt++) {
      const current = await store.get<LimitRecord>(COLLECTIONS.limits, id);
      const t = now();
      const fresh = !current || t - current.data.windowStart >= L.hourMs;
      const record: LimitRecord = fresh
        ? { count: 1, windowStart: t }
        : { count: current.data.count + 1, windowStart: current.data.windowStart };
      if (!fresh && current && current.data.count >= limit) {
        return Math.max(1, Math.ceil((current.data.windowStart + L.hourMs - t) / 1000));
      }
      try {
        await store.save(COLLECTIONS.limits, id, record, current?.version ?? null);
        return 0;
      } catch (error) {
        if (!(error instanceof ConflictError)) throw error;
      }
    }
    throw new VerificationError("server_error", "Serviço ocupado. Tente novamente em instantes.");
  }

  async function guardIp(scope: string, ip: string, limit: number) {
    const wait = await hit(scope, ip, limit);
    if (wait > 0) {
      throw new VerificationError("rate_limited", "Muitas solicitações. Aguarde antes de tentar novamente.", {
        retryAfter: wait,
      });
    }
  }

  /** Aplica `mutate` ao registro e grava com controle de concorrência, repetindo em caso de conflito. */
  async function updateRecord(
    id: string,
    mutate: (current: VerificationRecord | null) => VerificationRecord | VerificationError,
  ): Promise<VerificationRecord> {
    for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt++) {
      const current = await store.get<VerificationRecord>(COLLECTIONS.verifications, id);
      const next = mutate(current?.data ?? null);
      if (next instanceof VerificationError) throw next;
      try {
        await store.save(COLLECTIONS.verifications, id, next, current?.version ?? null);
        return next;
      } catch (error) {
        if (!(error instanceof ConflictError)) throw error;
      }
    }
    throw new VerificationError("server_error", "Serviço ocupado. Tente novamente em instantes.");
  }

  return {
    /** ETAPAS 2 e 3: gera o código, grava apenas o hash e envia o e-mail. */
    async requestCode(emailInput: unknown, ip: string): Promise<{ resendAfterSeconds: number; expiresInSeconds: number }> {
      const email = normalizeEmail(emailInput);
      await guardIp("request", ip, L.maxRequestsPerIpPerHour);

      if (await identity.emailExists(email)) {
        throw new VerificationError("email_in_use", "Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.");
      }

      const id = docId(email);
      const code = generateCode();
      const salt = randomBytes(16).toString("hex");
      let previous: VerificationRecord | null = null;

      const saved = await updateRecord(id, (current) => {
        previous = current;
        const t = now();
        if (current && t - current.lastSentAt < L.resendCooldownMs) {
          return new VerificationError("rate_limited", "Aguarde para solicitar um novo código.", {
            retryAfter: Math.ceil((current.lastSentAt + L.resendCooldownMs - t) / 1000),
          });
        }
        const inWindow = current && t - current.windowStart < L.hourMs;
        if (inWindow && current.sendCount >= L.maxSendsPerHour) {
          return new VerificationError("rate_limited", "Limite de envios atingido. Tente novamente mais tarde.", {
            retryAfter: Math.ceil((current.windowStart + L.hourMs - t) / 1000),
          });
        }
        return {
          email,
          salt,
          codeHash: hashCode(id, salt, code),
          expiresAt: t + L.codeTtlMs,
          attempts: 0,
          sendCount: inWindow ? current.sendCount + 1 : 1,
          windowStart: inWindow ? current.windowStart : t,
          lastSentAt: t,
          status: "pending",
          tokenHash: "",
          verifiedAt: 0,
        };
      });

      try {
        await mailer.sendVerificationCode(email, code, Math.round(L.codeTtlMs / 60000));
      } catch {
        // Invalida o código que não chegou ao usuário e devolve o contador de envios.
        const before = previous as VerificationRecord | null;
        await updateRecord(id, () => ({
          ...saved,
          expiresAt: 0,
          status: "locked",
          lastSentAt: before?.lastSentAt ?? 0,
          sendCount: before?.sendCount ?? 0,
          windowStart: before?.windowStart ?? saved.windowStart,
        })).catch(() => undefined);
        throw new VerificationError("send_failed", "Não foi possível enviar o e-mail agora. Tente novamente em instantes.");
      }

      return { resendAfterSeconds: Math.ceil(L.resendCooldownMs / 1000), expiresInSeconds: Math.round(L.codeTtlMs / 1000) };
    },

    /** ETAPA 5: valida o código; sucesso devolve um token de uso único para criar a conta. */
    async confirmCode(emailInput: unknown, codeInput: unknown, ip: string): Promise<{ token: string; expiresInSeconds: number }> {
      const email = normalizeEmail(emailInput);
      if (typeof codeInput !== "string" || !new RegExp(`^\\d{${L.codeLength}}$`).test(codeInput.trim())) {
        throw new VerificationError("invalid_input", `Informe o código de ${L.codeLength} dígitos.`);
      }
      const code = codeInput.trim();
      await guardIp("confirm", ip, L.maxConfirmsPerIpPerHour);

      const id = docId(email);
      const token = randomBytes(32).toString("base64url");
      let failure: VerificationError | null = null;

      await updateRecord(id, (current) => {
        failure = null;
        if (!current) return new VerificationError("no_code", "Solicite um código de verificação.");
        if (current.status === "consumed" || current.status === "verified") {
          return new VerificationError("already_used", "Este código já foi utilizado. Solicite um novo.");
        }
        if (current.status === "locked" || current.attempts >= L.maxAttempts) {
          return new VerificationError("too_many_attempts", "Muitas tentativas incorretas. Solicite um novo código.");
        }
        if (now() > current.expiresAt) {
          return new VerificationError("expired", "O código expirou. Solicite um novo.");
        }
        if (safeEqualHex(hashCode(id, current.salt, code), current.codeHash)) {
          return { ...current, status: "verified", tokenHash: sha256(token), verifiedAt: now(), codeHash: "", attempts: current.attempts };
        }
        const attempts = current.attempts + 1;
        const locked = attempts >= L.maxAttempts;
        // A falha precisa ser persistida (contador), então devolvemos o registro e lançamos depois.
        failure = locked
          ? new VerificationError("too_many_attempts", "Muitas tentativas incorretas. Solicite um novo código.")
          : new VerificationError("invalid_code", "Código incorreto.", { attemptsLeft: L.maxAttempts - attempts });
        return { ...current, attempts, status: locked ? "locked" : "pending" };
      });

      if (failure) throw failure;
      return { token, expiresInSeconds: Math.round(L.tokenTtlMs / 1000) };
    },

    /**
     * ETAPA 6 (parte servidor): cria a conta no Firebase Authentication com `emailVerified: true`.
     * Exige o token da confirmação, que só serve uma vez e só para o e-mail que recebeu o código.
     */
    async createVerifiedAccount(input: { email: unknown; token: unknown; password: unknown; displayName: unknown }): Promise<{ uid: string }> {
      const email = normalizeEmail(input.email);
      if (typeof input.token !== "string" || input.token.length < 20 || input.token.length > 200) {
        throw new VerificationError("invalid_token", "Verificação inválida. Confirme seu e-mail novamente.");
      }
      const password = input.password;
      if (typeof password !== "string" || password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        throw new VerificationError("invalid_input", "A senha deve ter de 8 a 128 caracteres, com letras e números.");
      }
      const displayName = typeof input.displayName === "string" ? input.displayName.trim().slice(0, 120) : "";
      if (displayName.length < 2) throw new VerificationError("invalid_input", "Informe o nome.");

      const id = docId(email);
      const tokenHash = sha256(input.token);

      // Consome o token ANTES de criar a conta: duas requisições simultâneas não passam juntas.
      await updateRecord(id, (current) => {
        if (!current || current.status !== "verified" || !current.tokenHash || !safeEqualHex(current.tokenHash, tokenHash)) {
          return new VerificationError("invalid_token", "Verificação inválida ou já utilizada. Confirme seu e-mail novamente.");
        }
        if (now() - current.verifiedAt > L.tokenTtlMs) {
          return new VerificationError("expired", "A verificação expirou. Solicite um novo código.");
        }
        return { ...current, status: "consumed", tokenHash: "" };
      });

      try {
        return await identity.createVerifiedUser({ email, password, displayName });
      } catch (error) {
        if (error instanceof EmailAlreadyExistsError) {
          throw new VerificationError("email_in_use", "Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.");
        }
        // Falha transitória: devolve o token ao usuário para ele tentar de novo sem novo código.
        await updateRecord(id, (current) =>
          current && current.status === "consumed" ? { ...current, status: "verified", tokenHash } : (current as VerificationRecord),
        ).catch(() => undefined);
        throw new VerificationError("server_error", "Não foi possível criar a conta agora. Tente novamente.");
      }
    },
  };
}

export type VerificationService = ReturnType<typeof createVerificationService>;
