/**
 * Tipos e contratos da verificação de e-mail por código (somente servidor).
 * O serviço não conhece Firebase nem provedor de e-mail: depende destas interfaces,
 * o que permite testá-lo sem rede (veja `service.test.ts`).
 */

export type VerificationStatus = "pending" | "verified" | "consumed" | "locked";

/** Documento `emailVerifications/{sha256(email)}` — inacessível ao navegador (regras: negar tudo). */
export interface VerificationRecord {
  email: string;
  /** HMAC do código; o código em claro nunca é gravado. */
  codeHash: string;
  salt: string;
  /** Epoch (ms) em que o código expira. */
  expiresAt: number;
  attempts: number;
  /** Envios dentro da janela atual (`windowStart`). */
  sendCount: number;
  windowStart: number;
  lastSentAt: number;
  status: VerificationStatus;
  /** SHA-256 do token entregue após a confirmação (uso único). */
  tokenHash: string;
  verifiedAt: number;
}

export interface LimitRecord {
  count: number;
  windowStart: number;
}

export type StoredData = VerificationRecord | LimitRecord;

export interface StoredDoc<T> {
  data: T;
  /** Token opaco de concorrência otimista (no Firestore, `updateTime`). */
  version: string;
}

/** Lançado por `save` quando o documento mudou desde a leitura (ou já existe). */
export class ConflictError extends Error {
  constructor() {
    super("Conflito de escrita.");
    this.name = "ConflictError";
  }
}

export interface DocStore {
  get<T extends StoredData>(collection: string, id: string): Promise<StoredDoc<T> | null>;
  /** `expectedVersion === null` exige que o documento ainda não exista. */
  save(collection: string, id: string, data: StoredData, expectedVersion: string | null): Promise<void>;
}

export interface Mailer {
  sendVerificationCode(to: string, code: string, ttlMinutes: number): Promise<void>;
}

export interface IdentityAdmin {
  emailExists(email: string): Promise<boolean>;
  /** Cria o usuário já com `emailVerified: true`. Lança `EmailAlreadyExistsError` se o e-mail já tem conta. */
  createVerifiedUser(input: { email: string; password: string; displayName: string }): Promise<{ uid: string }>;
}

export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("E-mail já cadastrado.");
    this.name = "EmailAlreadyExistsError";
  }
}

export type VerificationErrorCode =
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
  | "server_error";

export class VerificationError extends Error {
  constructor(
    public readonly code: VerificationErrorCode,
    message: string,
    public readonly extra: { retryAfter?: number; attemptsLeft?: number } = {},
  ) {
    super(message);
    this.name = "VerificationError";
  }
}
