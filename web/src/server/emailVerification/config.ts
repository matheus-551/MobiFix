/** Parâmetros de segurança da verificação de e-mail. Ajuste aqui, em um único lugar. */
export const VERIFICATION_LIMITS = {
  codeLength: 6,
  /** Validade do código. */
  codeTtlMs: 10 * 60 * 1000,
  /** Tentativas erradas permitidas por código; ao esgotar, o código é bloqueado. */
  maxAttempts: 5,
  /** Intervalo mínimo entre dois envios para o mesmo e-mail. */
  resendCooldownMs: 60 * 1000,
  /** Envios por e-mail na janela de 1 hora. */
  maxSendsPerHour: 5,
  hourMs: 60 * 60 * 1000,
  /** Pedidos de código por IP na janela de 1 hora (barra disparo em massa para e-mails diferentes). */
  maxRequestsPerIpPerHour: 20,
  /** Confirmações por IP na janela de 1 hora. */
  maxConfirmsPerIpPerHour: 60,
  /** Tempo para concluir a criação da conta depois de confirmar o código. */
  tokenTtlMs: 15 * 60 * 1000,
} as const;

export const COLLECTIONS = {
  verifications: "emailVerifications",
  limits: "emailVerificationLimits",
} as const;
