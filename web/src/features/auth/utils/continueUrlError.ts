/**
 * Códigos do Firebase Authentication que indicam problema na URL de retorno (`continueUrl`) enviada junto
 * com o e-mail de verificação/redefinição — tipicamente o domínio do site ainda não está em
 * Authentication → Configurações → Domínios autorizados.
 */
const CONTINUE_URL_ERROR_CODES: readonly string[] = [
  "auth/unauthorized-continue-uri",
  "auth/invalid-continue-uri",
  "auth/missing-continue-uri",
];

/**
 * `true` quando vale tentar de novo SEM URL de retorno (é como o aplicativo mobile envia o e-mail de
 * verificação). Assim um domínio ainda não autorizado não impede o usuário de receber o link.
 */
export function isContinueUrlError(code: string | null | undefined): boolean {
  return !!code && CONTINUE_URL_ERROR_CODES.includes(code);
}
