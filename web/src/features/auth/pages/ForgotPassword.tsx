"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { AuthPage } from "@/shared/components/AuthCard";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { Button } from "@/shared/components/Button";
import { TextField } from "@/shared/components/FormControls";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import { validateEmail } from "@/shared/validators/fields";
import { GuestOnly } from "../components/RouteGuards";
import { requestPasswordReset } from "../services/authService";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const emailError = validateEmail(email);
    setError(emailError ?? undefined);
    setFormError(null);
    if (emailError) return;

    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email.trim());
    } catch (failure) {
      setFormError(getErrorMessage(failure));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPage>
      <div className="mb-2 text-center">
        <BrandLogo />
      </div>
      <h1 className="mb-2 text-center text-xl font-bold text-gray-900">Recuperar senha</h1>
      <p className="mb-7 text-center text-sm text-gray-500">
        Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.
      </p>

      {sentTo ? (
        <div className="space-y-5">
          <Alert tone="success">
            Se existir uma conta para <strong>{sentTo}</strong>, você receberá um e-mail com as instruções.
            Confira também a caixa de spam.
          </Alert>
          <Button variant="secondary" onClick={() => setSentTo(null)}>
            Enviar para outro e-mail
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <Alert tone="error">{formError}</Alert>}
          <TextField
            label="E-mail"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="nome@exemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={error}
            required
          />
          <Button type="submit" loading={loading} loadingLabel="Enviando...">
            Enviar link de recuperação
          </Button>
        </form>
      )}

      <p className="mt-7 text-center text-sm text-gray-500">
        Lembrou a senha?{" "}
        <Link href={routes.login} className="font-semibold text-orange-500 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </AuthPage>
  );
}

export default function ForgotPassword() {
  return (
    <GuestOnly>
      <ForgotPasswordForm />
    </GuestOnly>
  );
}