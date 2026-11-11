import { parseBooleanFlag } from "../utils/flags";

/**
 * ============================================================================================
 *  CONFIGURAÇÃO CENTRAL DE FUNCIONALIDADES
 * ============================================================================================
 *  VERIFICAÇÃO DE E-MAIL  →  variável de ambiente `NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED`
 *
 *    true  (padrão) → o cadastro envia o link de verificação do Firebase e o acesso às áreas
 *                     protegidas só é liberado depois que o e-mail for confirmado.
 *    false          → nenhum e-mail é enviado e nenhuma etapa de confirmação aparece: a conta
 *                     criada já entra normalmente no sistema.
 *
 *  Defina o valor em `.env.local` (modelo em `.env.example`) e reinicie o servidor (`npm run dev`)
 *  ou refaça o build: variáveis `NEXT_PUBLIC_*` são embutidas no código do navegador na compilação.
 *  O prefixo `NEXT_PUBLIC_` é exigido pelo Next.js para que o valor chegue ao front-end.
 *
 *  ATENÇÃO: as regras do Firestore (`firebase/firestore.rules`) também exigem `email_verified` em
 *  agendamentos, avaliações e edição de perfil. Ao mudar este valor, rode `npm run rules:email` e
 *  republique as regras (`firebase deploy --only firestore:rules`) para os dois lados ficarem iguais.
 * ============================================================================================
 */
export const EMAIL_VERIFICATION_ENABLED: boolean = parseBooleanFlag(
  // Referência literal: o Next.js só substitui `process.env.NEXT_PUBLIC_X` escrito desta forma.
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED,
  true,
);

/** Única regra de acesso ligada à verificação: com a verificação desligada, qualquer conta autenticada passa. */
export function isEmailAccessGranted(emailVerified: boolean): boolean {
  return !EMAIL_VERIFICATION_ENABLED || emailVerified;
}
