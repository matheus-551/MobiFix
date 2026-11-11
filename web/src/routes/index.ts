/**
 * Rotas explícitas da aplicação (cada uma corresponde a uma pasta em src/app).
 *
 * ROTAS PRIVADAS (exigem login): tudo que começa com `/cliente` (clientHome … clientVehicles) e com
 * `/prestador` (providerHome … providerProfile). A proteção NÃO é uma lista de caminhos: ela vem dos layouts
 * `src/app/cliente/layout.tsx` e `src/app/prestador/layout.tsx`, que envolvem as páginas em `<RequireAuth>`
 * (`src/features/auth/components/RouteGuards.tsx`). Uma página nova criada dentro dessas pastas já nasce protegida.
 * Chave para ligar/desligar: `src/features/auth/config/routeProtection.ts`.
 * Rotas públicas: home, login, signup, providerSignup, forgotPassword, verifyEmail, authAction, terms, privacy.
 */
export const routes = {
  home: "/",
  login: "/login",
  signup: "/cadastro",
  providerSignup: "/cadastro/prestador",
  forgotPassword: "/recuperar-senha",
  verifyEmail: "/verificar-email",
  authAction: "/auth/acao",
  clientHome: "/cliente",
  clientSearch: "/cliente/prestadores",
  clientResults: "/cliente/prestadores/resultados",
  clientProvider: "/cliente/prestadores/perfil",
  clientBooking: "/cliente/agendar",
  clientAppointments: "/cliente/agendamentos",
  clientReview: "/cliente/agendamentos/avaliar",
  clientVehicles: "/cliente/veiculos",
  providerHome: "/prestador",
  providerRequests: "/prestador/solicitacoes",
  providerSchedule: "/prestador/agenda",
  providerHistory: "/prestador/historico",
  providerReviews: "/prestador/avaliacoes",
  providerProfile: "/prestador/perfil",
  terms: "/termos",
  privacy: "/privacidade",
} as const;
