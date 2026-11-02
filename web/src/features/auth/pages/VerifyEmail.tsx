"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/routes";
import { AuthPage } from "@/shared/components/AuthCard";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import { RegistrationSuccess } from "../components/RegistrationSuccess";
import { VerifyEmailPanel } from "../components/VerifyEmailPanel";
import { useAuth } from "../hooks/useAuth";
import { homeForRole } from "../utils/homeFor";

/**
 * Destino de quem está logado sem e-mail verificado (login, recarga da página, guardas de rota).
 * Sem sessão, volta ao login; já verificado, segue para o painel.
 */
export default function VerifyEmail() {
  const router = useRouter();
  const { authReady, user, account } = useAuth();
  const [done, setDone] = useState(false);

  const home = homeForRole(account?.role ?? "client");
  const goHome = useCallback(() => router.replace(home), [router, home]);
  const goLogin = useCallback(() => router.replace(routes.login), [router]);

  useEffect(() => {
    if (authReady && !user && !done) router.replace(routes.login);
  }, [authReady, user, done, router]);

  if (done) {
    return (
      <AuthPage>
        <RegistrationSuccess
          title="E-mail verificado!"
          message="Tudo certo: sua conta está liberada."
          onContinue={goHome}
          continueLabel="Continuar"
        />
      </AuthPage>
    );
  }

  // Só precisa do usuário do Authentication; o perfil do Firestore pode chegar depois.
  if (!authReady || !user) return <LoadingScreen />;

  return (
    <AuthPage>
      <VerifyEmailPanel onVerified={() => setDone(true)} onLeave={goLogin} />
    </AuthPage>
  );
}
