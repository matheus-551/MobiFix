import type { Mailer } from "../emailVerification/types";
import type { ServerEnv } from "../google/serviceAccount";

/** Envio real via API HTTP da Resend (https://resend.com). Trocável: basta outra implementação de `Mailer`. */
export function createResendMailer(env: ServerEnv, fetchImpl: typeof fetch = fetch): Mailer {
  return {
    async sendVerificationCode(to, code, ttlMinutes) {
      const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
      const response = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: env.emailFrom,
          to: [to],
          subject: `${spaced} é o seu código de verificação MobiFix`,
          text:
            `Seu código de verificação MobiFix é ${code}.\n` +
            `Ele expira em ${ttlMinutes} minutos. Se você não solicitou, ignore este e-mail.`,
          html:
            `<div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#1f2937">` +
            `<h2 style="margin:0 0 8px;color:#f97316">MobiFix</h2>` +
            `<p>Use o código abaixo para verificar seu e-mail:</p>` +
            `<p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>` +
            `<p style="font-size:13px;color:#6b7280">O código expira em ${ttlMinutes} minutos. ` +
            `Se você não solicitou este cadastro, ignore este e-mail.</p></div>`,
        }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Resend ${response.status}`);
    },
  };
}
