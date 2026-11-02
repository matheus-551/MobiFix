/**
 * Política de reenvio de e-mails do Firebase (verificação e redefinição de senha).
 * Lógica pura (sem navegador/Firebase) para ser testável. O Firebase também limita envios no
 * servidor (`auth/too-many-requests`); esta política evita cliques repetidos antes disso.
 */
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_SENDS_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

export type ResendBlock = "cooldown" | "hourly" | null;

export interface ResendDecision {
  allowed: boolean;
  /** Segundos até o próximo envio ser permitido (0 quando permitido). */
  waitSeconds: number;
  reason: ResendBlock;
}

/** Mantém só os envios da última hora. */
export function pruneHistory(history: number[], now: number): number[] {
  return history.filter((at) => Number.isFinite(at) && at <= now && now - at < HOUR_MS);
}

export function evaluateResend(history: number[], now: number): ResendDecision {
  const recent = pruneHistory(history, now);
  if (recent.length === 0) return { allowed: true, waitSeconds: 0, reason: null };

  const last = Math.max(...recent);
  const cooldownLeft = Math.ceil((last + RESEND_COOLDOWN_SECONDS * 1000 - now) / 1000);
  if (cooldownLeft > 0) return { allowed: false, waitSeconds: cooldownLeft, reason: "cooldown" };

  if (recent.length >= MAX_SENDS_PER_HOUR) {
    const oldest = Math.min(...recent);
    return { allowed: false, waitSeconds: Math.ceil((oldest + HOUR_MS - now) / 1000), reason: "hourly" };
  }
  return { allowed: true, waitSeconds: 0, reason: null };
}

export function recordSend(history: number[], now: number): number[] {
  return [...pruneHistory(history, now), now];
}

/* ---------- persistência (localStorage), tolerante a falhas ---------- */

const PREFIX = "mobifix:emailSends:";

export function readHistory(key: string): number[] {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is number => typeof item === "number") : [];
  } catch {
    return [];
  }
}

export function markSent(key: string, now = Date.now()): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(recordSend(readHistory(key), now)));
  } catch {
    /* armazenamento indisponível: o limite do Firebase continua valendo */
  }
}

export function checkResend(key: string, now = Date.now()): ResendDecision {
  return evaluateResend(readHistory(key), now);
}

export function describeBlock(decision: ResendDecision): string {
  if (decision.reason === "hourly") {
    const minutes = Math.max(1, Math.ceil(decision.waitSeconds / 60));
    return `Você atingiu o limite de reenvios por hora. Tente novamente em ${minutes} min.`;
  }
  return `Aguarde ${decision.waitSeconds}s para reenviar.`;
}
