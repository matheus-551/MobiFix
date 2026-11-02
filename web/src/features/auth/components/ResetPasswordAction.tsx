"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { CheckCircle2, Loader2 } from "lucide-react";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { PasswordField } from "@/shared/components/FormControls";
import { getFirebaseAuth } from "@/shared/lib/firebase/client";
import { getErrorCode, getErrorMessage } from "@/shared/utils/firebaseErrors";
import { compactErrors, validateNewPassword, validatePasswordConfirmation } from "@/shared/validators/fields";

type Phase =
  | { name: "checking" }
  | { name: "form"; email: string }
  | { name: "done" }
  | { name: "invalid"; message: string };

/**
 * Link "resetPassword" do Firebase: `verifyPasswordResetCode` valida o código e devolve o e-mail;
 * `confirmPasswordReset` grava a nova senha. A senha só trafega para o Firebase Authentication.
 */
export function ResetPasswordAction({ oobCode }: { oobCode: string }) {
  const [phase, setPhase] = useState<Phase>({ name: "checking" });
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"password" | "confirmation", string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    verifyPasswordResetCode(getFirebaseAuth(), oobCode)
      .then((email) => setPhase({ name: "form", email }))
      .catch((error) => setPhase({ name: "invalid", message: getErrorMessage(error) }));
  }, [oobCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || phase.name !== "form") return;

    const found = compactErrors({
      password: validateNewPassword(password),
      confirmation: validatePasswordConfirmation(password, confirmation),
    });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await confirmPasswordReset(getFirebaseAuth(), oobCode, password);
      setPassword("");
      setConfirmation("");
      setPhase({ name: "done" });
    } catch (error) {
      const message = getErrorMessage(error);
      // Código expirado/usado no meio do caminho: não adianta tentar de novo com o mesmo link.
      const code = getErrorCode(error);
      if (code === "auth/invalid-action-code" || code === "auth/expired-action-code") {
        setPhase({ name: "invalid", message });
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (phase.name === "checking") {
    return (
      <p role="status" className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 aria-hidden className="h-4 w-4 animate-spin text-orange-500" />
        Validando o link...
      </p>
    );
  }

  if (phase.name === "invalid") {
    return (
      <div className="space-y-5">
        <Alert tone="error">{phase.message}</Alert>
        <Link
          href={routes.forgotPassword}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  if (phase.name === "done") {
    return (
      <div className="space-y-5 text-center" role="status">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 aria-hidden className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Senha alterada!</h1>
          <p className="mt-1 text-sm text-gray-600">Já pode entrar com a nova senha.</p>
        </div>
        <Link
          href={routes.login}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-center text-xl font-bold text-gray-900">Criar nova senha</h1>
      <p className="mb-7 text-center text-sm text-gray-500">
        Defina a nova senha da conta <strong className="break-all text-gray-700">{phase.email}</strong>.
      </p>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}
        <PasswordField
          label="Nova senha"
          name="password"
          autoComplete="new-password"
          placeholder="Crie uma senha forte"
          hint="Mínimo de 8 caracteres, com letras e números."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          required
        />
        <PasswordField
          label="Confirmar nova senha"
          name="passwordConfirmation"
          autoComplete="new-password"
          placeholder="Repita a nova senha"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={errors.confirmation}
          required
        />
        <Button type="submit" loading={loading} loadingLabel="Salvando...">
          Salvar nova senha
        </Button>
      </form>
    </>
  );
}
