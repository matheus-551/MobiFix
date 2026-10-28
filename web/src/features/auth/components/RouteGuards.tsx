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

/** Exige usuário autenticado, e-mail verificado e papel compatível. */
export function RequireAuth({ role, children }: { role: UserRole; children: ReactNode }) {
  const router = useRouter();
  const { status, user, account, emailVerified, error } = useAuth();

  let redirectTo: string | null = null;
  if (status === "ready" && !error) {
    if (!user) redirectTo = routes.login;
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

/** Para páginas de visitante (login, cadastro): redireciona quem já está autenticado. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user, account, emailVerified } = useAuth();

  let redirectTo: string | null = null;
  // Sem `account` o perfil ainda está sendo gravado (cadastro em andamento): não redirecionar.
  if (status === "ready" && user && account) {
    redirectTo = emailVerified ? homeForRole(account.role) : routes.verifyEmail;
  }

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (status === "loading" && user === null) return <LoadingScreen />;
  if (redirectTo) return <LoadingScreen />;
  return <>{children}</>;
}