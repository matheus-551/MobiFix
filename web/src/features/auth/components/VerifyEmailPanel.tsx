"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MailCheck } from "lucide-react";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import { useAuth } from "../hooks/useAuth";
import { ResendBlockedError, resendVerificationEmail, signOutUser, verificationKey } from "../services/authService";
import { checkResend } from "../utils/resendPolicy";

/** Intervalo da checagem automática enquanto a aba está visível. */
const POLL_MS = 5000;

type Feedback = { tone: "error" | "success" | "info"; text: string } | null;

interface VerifyEmailPanelProps {
  /** Chamado uma única vez quando o Firebase confirma `emailVerified` (já com o ID Token renovado). */
  onVerified: () => void;
  /** Chamado depois de encerrar a sessão ("Sair / usar outra conta"). */
  onLeave: () => void;
  /** `false` quando o envio automático logo após o cadastro falhou: orienta a reenviar. */
  initialSendFailed?: boolean;
}

/**
 * Tela "Verifique seu e-mail": informa o envio, reenvia o link (com intervalo), atualiza o status
 * manualmente e acompanha a verificação automaticamente (polling + retorno de foco à aba).
 */
export function VerifyEmailPanel({ onVerified, onLeave, initialSendFailed = false }: VerifyEmailPanelProps) {
  const { user, emailVerified, refresh } = useAuth();
  const uid = user?.uid ?? "";
  const email = user?.email ?? "";

  const [feedback, setFeedback] = useState<Feedback>(
    initialSendFailed
      ? { tone: "error", text: "Sua conta foi criada, mas não conseguimos enviar o e-mail agora. Toque em “Reenviar e-mail”." }
      : null,
  );
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const busy = useRef(false);
  const notified = useRef(false);

  // Contagem regressiva do reenvio (fonte da verdade: histórico persistido, que sobrevive a recarregamentos).
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const decision = uid ? checkResend(verificationKey(uid), now) : { allowed: false, waitSeconds: 0, reason: null };

  useEffect(() => {
    if (emailVerified && !notified.current) {
      notified.current = true;
      onVerified();
    }
  }, [emailVerified, onVerified]);

  const silentCheck = useCallback(async () => {
    if (busy.current || !uid) return;
    busy.current = true;
    try {
      await refresh();
    } catch {
      /* falhas transitórias (rede) são ignoradas; o botão manual mostra o erro */
    } finally {
      busy.current = false;
    }
  }, [refresh, uid]);

  useEffect(() => {
    if (!uid || emailVerified) return;
    const tick = () => {
      if (document.visibilityState === "visible") void silentCheck();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [uid, emailVerified, silentCheck]);

  async function handleCheck() {
    if (busy.current) return;
    busy.current = true;
    setChecking(true);
    setFeedback(null);
    try {
      const verified = await refresh();
      if (!verified) {
        setFeedback({
          tone: "info",
          text: "Ainda não identificamos a confirmação. Abra o link que enviamos ao seu e-mail e tente novamente.",
        });
      }
    } catch (error) {
      setFeedback({ tone: "error", text: getErrorMessage(error) });
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }

  async function handleResend() {
    if (busy.current || !decision.allowed) return;
    busy.current = true;
    setResending(true);
    setFeedback(null);
    try {
      await resendVerificationEmail();
      setNow(Date.now());
      setFeedback({ tone: "success", text: "Enviamos um novo link. Confira também a caixa de spam." });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof ResendBlockedError ? error.message : getErrorMessage(error),
      });
    } finally {
      busy.current = false;
      setResending(false);
    }
  }

  async function handleLeave() {
    await signOutUser().catch(() => undefined);
    onLeave();
  }

  const disabled = checking || resending;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
          <MailCheck aria-hidden className="h-6 w-6" />
        </span>
        <h2 className="text-base font-bold text-gray-900">Verifique seu e-mail</h2>
        <p className="mt-1 text-xs text-gray-500">
          Seu e-mail ainda precisa ser verificado para acessar o MobiFix. Abra sua caixa de entrada
          {email && (
            <>
              {" "}
              (<strong className="break-all text-gray-700">{email}</strong>)
            </>
          )}{" "}
          e clique no link que enviamos. Confira também a caixa de spam.
        </p>
      </div>

      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

      <Button onClick={handleCheck} loading={checking} loadingLabel="Verificando..." disabled={resending || !uid}>
        Já confirmei meu e-mail
      </Button>

      <Button
        variant="secondary"
        onClick={handleResend}
        loading={resending}
        loadingLabel="Enviando..."
        disabled={checking || !decision.allowed}
      >
        {decision.reason === "cooldown"
          ? `Reenviar e-mail (${decision.waitSeconds}s)`
          : decision.reason === "hourly"
            ? "Limite de reenvios atingido"
            : "Reenviar e-mail"}
      </Button>
      {decision.reason === "hourly" && (
        <p className="text-center text-xs text-gray-500">Tente novamente em alguns minutos.</p>
      )}

      <Button variant="ghost" onClick={handleLeave} disabled={disabled}>
        Sair / usar outra conta
      </Button>
    </div>
  );
}
