"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { AuthPage } from "@/shared/components/AuthCard";
import { Button } from "@/shared/components/Button";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import { useAuth } from "../hooks/useAuth";
import { confirmEmailVerification, sendVerificationEmail, signOutUser } from "../services/authService";
import { homeForRole } from "../utils/homeFor";

const RESEND_COOLDOWN_SECONDS = 60;

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-500">
      {children}
    </div>
  );
}

/** Link do e-mail (modelo de e-mail com URL de ação personalizada): mode=verifyEmail&oobCode=... */
function ActionCodeResult({ oobCode }: { oobCode: string }) {
  const router = useRouter();
  const { account, user, refreshUser } = useAuth();
  const started = useRef(false);
  const [state, setState] = useState<{ status: "verifying" | "success" | "error"; message?: string }>({
    status: "verifying",
  });

  useEffect(() => {
    if (started.current) return; // o código é de uso único; evita a dupla execução do StrictMode
    started.current = true;
    confirmEmailVerification(oobCode)
      .then(async () => {
        await refreshUser();
        setState({ status: "success" });
      })
      .catch((error: unknown) => setState({ status: "error", message: getErrorMessage(error) }));
  }, [oobCode, refreshUser]);

  if (state.status === "verifying") {
    return (
      <div className="text-center" role="status">
        <IconBadge>
          <Loader2 className="h-6 w-6 animate-spin" />
        </IconBadge>
        <h1 className="text-xl font-bold text-gray-900">Confirmando seu e-mail...</h1>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-5 text-center">
        <div aria-hidden className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
          <XCircle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Não foi possível verificar</h1>
        <Alert tone="error">{state.message}</Alert>
        <Button onClick={() => router.replace(user ? routes.verifyEmail : routes.login)}>
          {user ? "Solicitar novo e-mail" : "Ir para o login"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-center">
      <div aria-hidden className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">E-mail verificado!</h1>
      <p className="text-sm text-gray-500">Sua conta foi confirmada com sucesso.</p>
      <Button onClick={() => router.replace(user && account ? homeForRole(account.role) : routes.login)}>
        {user && account ? "Continuar" : "Entrar na minha conta"}
      </Button>
    </div>
  );
}

/** Usuário autenticado e ainda não verificado: orienta, permite reenviar e confirmar. */
function PendingVerification() {
  const router = useRouter();
  const { status, user, account, emailVerified, refreshUser } = useAuth();
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);

  const redirectTo =
    status === "ready" ? (!user ? routes.login : emailVerified && account ? homeForRole(account.role) : null) : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  const cooldownActive = cooldown > 0;
  useEffect(() => {
    if (!cooldownActive) return;
    const timer = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldownActive]);

  // Ao voltar para a aba depois de clicar no link do e-mail, atualiza o estado automaticamente.
  useEffect(() => {
    const onFocus = () => void refreshUser().catch(() => undefined);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUser]);

  if (status === "loading" || redirectTo || !user) return <LoadingScreen />;

  async function handleResend() {
    if (!user || resending || cooldown > 0) return;
    setResending(true);
    setFeedback(null);
    try {
      await sendVerificationEmail(user);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setFeedback({ tone: "success", message: "Enviamos um novo e-mail de verificação. Confira também o spam." });
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setResending(false);
    }
  }

  async function handleCheck() {
    setChecking(true);
    setFeedback(null);
    try {
      await refreshUser();
      // Se verificado, o efeito de redirecionamento acima assume; senão avisamos.
      if (!user?.emailVerified) {
        setFeedback({ tone: "info", message: "Ainda não identificamos a confirmação. Clique no link do e-mail e tente novamente." });
      }
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-5 text-center">
      <div>
        <IconBadge>
          <Mail className="h-6 w-6" />
        </IconBadge>
        <h1 className="text-xl font-bold text-gray-900">Verifique seu e-mail</h1>
        <p className="mt-2 text-sm text-gray-500">
          Enviamos um link de verificação para <strong className="text-gray-700">{user.email}</strong>.
          Abra o e-mail e clique no link para ativar sua conta.
        </p>
      </div>

      {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}

      <Button onClick={handleCheck} loading={checking} loadingLabel="Verificando...">
        Já confirmei meu e-mail
      </Button>

      <p className="text-xs text-gray-500">
        Não recebeu o e-mail?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="font-semibold text-orange-500 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
        >
          {cooldown > 0 ? `Reenviar em ${cooldown}s` : resending ? "Enviando..." : "Reenviar e-mail"}
        </button>
      </p>

      <p className="text-xs text-gray-500">
        E-mail errado?{" "}
        <button type="button" onClick={() => void signOutUser()} className="font-semibold text-gray-700 hover:underline">
          Sair e usar outra conta
        </button>
      </p>
    </div>
  );
}

export default function VerifyEmail() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  return (
    <AuthPage>
      {mode === "verifyEmail" && oobCode ? <ActionCodeResult oobCode={oobCode} /> : <PendingVerification />}
      <p className="mt-8 text-center text-xs">
        <Link href={routes.home} className="text-gray-500 hover:text-orange-500">
          Voltar para a página inicial
        </Link>
      </p>
    </AuthPage>
  );
}