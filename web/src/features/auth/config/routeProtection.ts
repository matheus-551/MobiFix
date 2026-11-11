import { parseBooleanFlag } from "../../../shared/utils/flags";

/**
 * ================================================
 * AUTENTICAÇÃO E PROTEÇÃO DE ROTAS — CHAVE CENTRAL
 * ================================================
 *
 * ESTE É O ÚNICO LUGAR PARA LIGAR/DESLIGAR A PROTEÇÃO DE NAVEGAÇÃO DAS ROTAS PRIVADAS
 * (/cliente/**, /prestador/**).
 *
 * Quem consulta esta chave: `RequireAuth` em `src/features/auth/components/RouteGuards.tsx`.
 *
 * COMO DESATIVAR TEMPORARIAMENTE (somente em desenvolvimento, para testes):
 *   1. No `.env.local`, defina  NEXT_PUBLIC_ROUTE_PROTECTION_ENABLED=false
 *   2. Reinicie o `npm run dev` (variáveis NEXT_PUBLIC_* são embutidas na compilação).
 *
 * COMO ATIVAR DE NOVO:
 *   Remova a linha do `.env.local` ou defina NEXT_PUBLIC_ROUTE_PROTECTION_ENABLED=true e reinicie.
 *
 * PADRÃO: ATIVADA. Sem a variável, ou com qualquer valor irreconhecível, a proteção fica ligada.
 * Em build de produção (`next build` / `next start`, NODE_ENV=production) a proteção é SEMPRE ligada,
 * mesmo que a variável diga o contrário, para que um esquecimento não exponha as páginas.
 *
 * ATENÇÃO:
 *   Ao desativar, páginas como /cliente abrem sem o usuário estar autenticado.
 *
 * IMPORTANTE — isto NÃO libera a API:
 *   Esta chave só controla a NAVEGAÇÃO no front-end. As rotas protegidas do backend continuam exigindo
 *   `Authorization: Bearer <ID token do Firebase>` e respondem 401 sem ele (ver `SecurityConfiguration`
 *   em api.zip). As regras do Firestore também continuam valendo. Sem sessão, as telas privadas abrem,
 *   mas as chamadas que dependem de login falham com erro.
 */

/** Interpretação pura (testável): em produção é sempre `true`; fora dela, `raw` decide (padrão `true`). */
export function resolveRouteProtection(raw: string | undefined, nodeEnv: string | undefined): boolean {
  if (nodeEnv === "production") return true;
  return parseBooleanFlag(raw, true);
}

export const ROUTE_PROTECTION_ENABLED: boolean = resolveRouteProtection(
  // Referência literal: o Next.js só substitui `process.env.NEXT_PUBLIC_X` escrito desta forma.
  process.env.NEXT_PUBLIC_ROUTE_PROTECTION_ENABLED,
  process.env.NODE_ENV,
);
