"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { TextField } from "@/shared/components/FormControls";
import { getFriendlyError } from "@/shared/lib/api/http";
import {
  confirmVerificationCode,
  EmailVerificationError,
  requestVerificationCode,
} from "../services/emailVerificationService";

const CODE_LENGTH = 6;

interface EmailVerificationStepProps {
  email: string;
  /** Segundos até liberar o primeiro reenvio (resposta do envio inicial). */
  initialResendSeconds: number;
  /**
   * Conclui o cadastro depois que o código foi aceito. Deve lançar erro se falhar; o texto do erro
   * é exibido aqui. O token é de uso único e só existe depois da verificação bem-sucedida.
   */
  onVerified: (token: string) => Promise<void>;
  /** Volta ao formulário (os dados preenchidos são preservados pelo pai). */
  onBack: () => void;
  backLabel?: string;
}

type Feedback = { tone: "error" | "success" | "info"; text: string } | null;

export function EmailVerificationStep({ email, initialResendSeconds, onVerified, onBack, backLabel = "Voltar" }: EmailVerificationStepProps) {
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(initialResendSeconds);
  /** Token da verificação já aceita: permite "tentar novamente" sem pedir outro código. */
  const [token, setToken] = useState<string | null>(null);
  // Guarda síncrona contra clique duplo (o estado do React só atualiza no próximo render).
  const busy = useRef(false);
  const inputWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    inputWrapper.current?.querySelector("input")?.focus();
  }, []);

  const finish = useCallback(
    async (verificationToken: string) => {
      try {
        await onVerified(verificationToken);
      } catch (error) {
        if (error instanceof EmailVerificationError && (error.code === "invalid_token" || error.code === "expired")) {
          setToken(null);
          setCode("");
          setFeedback({ tone: "error", text: "A verificação expirou ou já foi usada. Solicite um novo código para continuar." });
        } else {
          setFeedback({ tone: "error", text: getFriendlyError(error) });
        }
      }
    },
    [onVerified],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;

    if (token) {
      busy.current = true;
      setVerifying(true);
      setFeedback(null);
      await finish(token);
      busy.current = false;
      setVerifying(false);
      return;
    }

    if (code.length !== CODE_LENGTH) {
      setCodeError(`Digite os ${CODE_LENGTH} dígitos do código.`);
      return;
    }

    busy.current = true;
    setVerifying(true);
    setCodeError(undefined);
    setFeedback(null);
    try {
      const result = await confirmVerificationCode(email, code);
      setToken(result.token);
      setFeedback({ tone: "success", text: "E-mail verificado! Finalizando seu cadastro..." });
      await finish(result.token);
    } catch (error) {
      if (error instanceof EmailVerificationError) {
        if (error.code === "invalid_code") {
          const left = error.attemptsLeft;
          setCodeError(left ? `Código incorreto. ${left === 1 ? "Resta 1 tentativa" : `Restam ${left} tentativas`}.` : "Código incorreto.");
        } else if (error.code === "expired") {
          setCodeError("Código expirado. Solicite um novo código.");
        } else if (error.code === "too_many_attempts" || error.code === "already_used" || error.code === "no_code") {
          setCodeError(error.message);
          setCode("");
        } else {
          setFeedback({ tone: "error", text: error.message });
        }
        if (error.code === "rate_limited" && error.retryAfter) setCooldown(error.retryAfter);
      } else {
        setFeedback({ tone: "error", text: getFriendlyError(error) });
      }
    } finally {
      busy.current = false;
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (busy.current || cooldown > 0) return;
    busy.current = true;
    setResending(true);
    setCodeError(undefined);
    setFeedback(null);
    try {
      const result = await requestVerificationCode(email);
      setCode("");
      setToken(null);
      setCooldown(result.resendAfterSeconds);
      setFeedback({ tone: "success", text: "Enviamos um novo código. O anterior deixou de valer." });
    } catch (error) {
      if (error instanceof EmailVerificationError && error.code === "rate_limited" && error.retryAfter) {
        setCooldown(error.retryAfter);
      }
      setFeedback({ tone: "error", text: getFriendlyError(error) });
    } finally {
      busy.current = false;
      setResending(false);
    }
  }

  const disabled = verifying || resending;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
          <MailCheck aria-hidden className="h-6 w-6" />
        </span>
        <h2 className="text-base font-bold text-gray-900">Verifique seu e-mail</h2>
        <p className="mt-1 text-xs text-gray-500">
          Enviamos um código de {CODE_LENGTH} dígitos para <strong className="break-all text-gray-700">{email}</strong>. Ele vale por 10 minutos.
          Confira também a caixa de spam.
        </p>
      </div>

      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

      <div ref={inputWrapper}>
        <TextField
          label="Código de verificação"
          name="verificationCode"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={CODE_LENGTH}
          className="text-center text-lg font-semibold tracking-[0.5em]"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH));
            setCodeError(undefined);
          }}
          error={codeError}
          disabled={disabled || token !== null}
          required
        />
      </div>

      <Button
        type="submit"
        loading={verifying}
        loadingLabel={token ? "Finalizando cadastro..." : "Verificando..."}
        disabled={resending || (!token && code.length !== CODE_LENGTH)}
      >
        {token ? "Tentar finalizar novamente" : "Confirmar e finalizar cadastro"}
      </Button>

      <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onBack} disabled={disabled} className="sm:w-auto">
          {backLabel}
        </Button>
        <Button
          variant="secondary"
          onClick={handleResend}
          loading={resending}
          loadingLabel="Enviando..."
          disabled={verifying || cooldown > 0}
          className="sm:w-auto"
        >
          {cooldown > 0 ? `Reenviar código (${cooldown}s)` : "Reenviar código"}
        </Button>
      </div>
    </form>
  );
}
