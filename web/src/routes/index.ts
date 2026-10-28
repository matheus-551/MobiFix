/** Rotas explícitas da aplicação (cada uma corresponde a uma pasta em src/app). */
export const routes = {
  home: "/",
  login: "/login",
  signup: "/cadastro",
  providerSignup: "/cadastro/prestador",
  verifyEmail: "/verificar-email",
  forgotPassword: "/recuperar-senha",
  clientHome: "/cliente",
  providerHome: "/prestador",
  terms: "/termos",
  privacy: "/privacidade",
} as const;
