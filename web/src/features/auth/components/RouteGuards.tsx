"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { isEmailAccessGranted } from "@/shared/config/features";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import type { UserRole } from "@/shared/types/domain";
import { ROUTE_PROTECTION_ENABLED } from "../config/routeProtection";
import { useAuth } from "../hooks/useAuth";
import { signOutUser } from "../services/authService";
import { homeForRole } from "../utils/homeFor";

// ================================================
// AUTENTICAÇÃO E PROTEÇÃO DE ROTAS
// ================================================
//
// MAPA RÁPIDO (onde está cada coisa):
//   1. Arquivo que controla a proteção das rotas ...... ESTE arquivo (`RequireAuth`, abaixo).
//   2. Função que verifica se há usuário autenticado .. `RequireAuth` / `ProtectedRoute` (abaixo), usando
//                                                       `useAuth()` (context/AuthProvider.tsx), que escuta
//                                                       o Firebase Authentication (`onIdTokenChanged`).
//   3. Onde as rotas privadas são declaradas .......... os caminhos estão em `src/routes/index.ts`; a
//                                                       proteção é aplicada pelos layouts
//                                                       `src/app/cliente/layout.tsx` → `ClientArea` e
//                                                       `src/app/prestador/layout.tsx` → `ProviderArea`
//                                                       (cada um envolve as páginas em <RequireAuth>).
//   4. Onde o token é validado ........................ NO NAVEGADOR: pelo SDK do Firebase (sessão
//                                                       assinada, renovada sozinha). NO SERVIDOR: pela API
//                                                       (`FirebaseAuthenticationFilter`, em api.zip), que
//                                                       valida o ID token a cada requisição.
//   5. Chave para ligar/desligar esta proteção ........ `src/features/auth/config/routeProtection.ts`.
//
// IMPORTANTE:
// Esta função controla o acesso às rotas privadas.
//
// Se quiser DESATIVAR temporariamente a proteção
// de autenticação das rotas, use a chave em
// `src/features/auth/config/routeProtection.ts`
// (NEXT_PUBLIC_ROUTE_PROTECTION_ENABLED=false no `.env.local`, só em desenvolvimento)
// ou, de forma manual, remova a aplicação deste guard nos layouts (`ClientArea`/`ProviderArea`).
//
// ATENÇÃO:
// Ao desativar esta proteção, será possível acessar
// páginas como /cliente, /cliente/veiculos e /prestador sem precisar estar autenticado.
//
// Isso NÃO desativa necessariamente a autenticação
// das requisições feitas à API: as rotas protegidas do backend continuam exigindo
// `Authorization: Bearer <ID token do Firebase>` (401 sem ele), e as regras do Firestore
// continuam valendo. Desligar a proteção de navegação do front-end NÃO libera endpoints
// protegidos no backend.
//
// ================================================

/**
 * Guardas de navegação (experiência de uso). A autorização real dos dados é feita pelas
 * regras do Firestore/Storage (firebase/*.rules) e pela validação do token na API, nunca apenas
 * por estes redirecionamentos.
 */

/**
 * GUARD DAS ROTAS PRIVADAS: exige usuário autenticado, e-mail verificado (se a verificação estiver ativa)
 * e papel compatível. Sem sessão → /login; e-mail não verificado → /verificar-email; papel errado → painel
 * do papel correto.
 *
 * Com `ROUTE_PROTECTION_ENABLED === false` (somente em desenvolvimento) este guard deixa passar tudo.
 * A chave fica em `../config/routeProtection.ts`; o padrão é ATIVADA.
 */
export function RequireAuth({ role, children }: { role: UserRole; children: ReactNode }) {
  // ↓↓↓ É AQUI que a proteção é desligada pela chave central. Não há hooks antes deste `if`. ↓↓↓
  if (!ROUTE_PROTECTION_ENABLED) return <>{children}</>;
  return <ProtectedRoute role={role}>{children}</ProtectedRoute>;
}

/** Implementação do guard (separada de `RequireAuth` para manter a ordem dos hooks estável). */
function ProtectedRoute({ role, children }: { role: UserRole; children: ReactNode }) {
  const router = useRouter();
  const { status, user, emailVerified, account, error } = useAuth();

  let redirectTo: string | null = null;
  if (status === "ready" && !error) {
    if (!user) redirectTo = routes.login;
    // E-mail não verificado (com a verificação ativa): nenhuma área protegida é liberada (as regras do Firestore também exigem).
    else if (!isEmailAccessGranted(emailVerified)) redirectTo = routes.verifyEmail;
    // Admin não tem painel no web: redirecionar criaria um laço infinito (ver bloco "admin" abaixo).
    else if (account && account.role !== role && account.role !== "admin") redirectTo = homeForRole(account.role);
  }

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (status === "loading" || redirectTo) return <LoadingScreen />;

  if (error || !account) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-sm">
          <Alert tone="error">
            {error ?? "Não encontramos o perfil desta conta. Entre em contato com o suporte."}
          </Alert>
          <Button variant="secondary" onClick={() => void signOutUser()}>
            Sair
          </Button>
        </div>
      </main>
    );
  }

  if (account.role === "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-sm">
          <Alert tone="info">Contas administrativas não possuem painel na versão web. Use uma conta de cliente ou de prestador.</Alert>
          <Button variant="secondary" onClick={() => void signOutUser()}>
            Sair
          </Button>
        </div>
      </main>
    );
  }

  if (account.status === "suspended") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-sm">
          <Alert tone="error">Esta conta está suspensa. Entre em contato com o suporte.</Alert>
          <Button variant="secondary" onClick={() => void signOutUser()}>
            Sair
          </Button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

/**
 * NÃO é proteção de rota privada: é o contrário. Serve às páginas públicas de visitante (login, cadastro) e
 * apenas evita mostrar o formulário a quem já está logado. Não é afetado pela chave `ROUTE_PROTECTION_ENABLED`.
 * Redireciona quem já está autenticado (verificado → painel; não verificado → verificação).
 * `hold` suspende o redirecionamento (usado pelos cadastros enquanto criam a conta e mostram a verificação).
 */
export function GuestOnly({ children, hold = false }: { children: ReactNode; hold?: boolean }) {
  const router = useRouter();
  const { status, user, emailVerified, account } = useAuth();

  let redirectTo: string | null = null;
  if (user && !hold) {
    // Sessão sem e-mail verificado (verificação ativa): segue para a tela de verificação (reenvio e saída).
    if (!isEmailAccessGranted(emailVerified)) redirectTo = routes.verifyEmail;
    // Sem `account` o perfil ainda está sendo gravado: não redirecionar.
    else if (status === "ready" && account) redirectTo = homeForRole(account.role);
  }

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (status === "loading" && user === null) return <LoadingScreen />;
  if (redirectTo) return <LoadingScreen />;
  return <>{children}</>;
}