"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import type { UserRole } from "@/shared/types/domain";
import { useAuth } from "../hooks/useAuth";
import { signOutUser } from "../services/authService";
import { homeForRole } from "../utils/homeFor";

/**
 * Guardas de navegação (experiência de uso). A autorização real dos dados é feita pelas
 * regras do Firestore/Storage (firebase/*.rules), nunca apenas por estes redirecionamentos.
 */

/** Exige usuário autenticado e papel compatível. */
export function RequireAuth({ role, children }: { role: UserRole; children: ReactNode }) {
  const router = useRouter();
  const { status, user, emailVerified, account, error } = useAuth();

  let redirectTo: string | null = null;
  if (status === "ready" && !error) {
    if (!user) redirectTo = routes.login;
    // E-mail não verificado: nenhuma área protegida é liberada (as regras do Firestore também exigem).
    else if (!emailVerified) redirectTo = routes.verifyEmail;
    else if (account && account.role !== role) redirectTo = homeForRole(account.role);
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
 * Para páginas de visitante (login, cadastro): redireciona quem já está autenticado (verificado → painel; não verificado → verificação).
 * `hold` suspende o redirecionamento (usado pelos cadastros enquanto criam a conta e mostram a verificação).
 */
export function GuestOnly({ children, hold = false }: { children: ReactNode; hold?: boolean }) {
  const router = useRouter();
  const { status, user, emailVerified, account } = useAuth();

  let redirectTo: string | null = null;
  if (user && !hold) {
    // Sessão sem e-mail verificado: segue para a tela de verificação (que oferece reenvio e saída).
    if (!emailVerified) redirectTo = routes.verifyEmail;
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