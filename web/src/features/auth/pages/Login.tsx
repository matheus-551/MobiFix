"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { AuthPage } from "@/shared/components/AuthCard";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { Button } from "@/shared/components/Button";
import { PasswordField, TextField } from "@/shared/components/FormControls";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import { compactErrors, required, validateEmail } from "@/shared/validators/fields";
import { GuestOnly } from "../components/RouteGuards";
import { signIn } from "../services/authService";

type Errors = Partial<Record<"email" | "password", string>>;

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const found = compactErrors({
      email: validateEmail(email),
      password: required(password, "sua senha"),
    });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await signIn(email, password, remember);
      // Em caso de sucesso o <GuestOnly> redireciona assim que o perfil for carregado.
    } catch (error) {
      setFormError(getErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <AuthPage>
      <div className="mb-2 text-center">
        <BrandLogo />
      </div>
      <h1 className="mb-7 text-center text-sm font-normal text-gray-500">Acesse sua conta para continuar</h1>

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
          error={errors.email}
          required
        />

        <PasswordField
          label="Senha"
          name="password"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          required
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
            Manter conectado
          </label>
          <Link href={routes.forgotPassword} className="text-sm text-orange-500 hover:underline">
            Esqueceu a senha?
          </Link>
        </div>

        <Button type="submit" loading={loading} loadingLabel="Entrando...">
          Entrar
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-gray-500">
        Não tem uma conta?{" "}
        <Link href={routes.signup} className="font-semibold text-orange-500 hover:underline">
          Criar conta
        </Link>
      </p>
      <p className="mt-5 text-center text-sm">
        <Link href={routes.home} className="text-gray-500 hover:text-orange-500">
          Voltar para a página inicial
        </Link>
      </p>
    </AuthPage>
  );
}

export default function Login() {
  return (
    <GuestOnly>
      <LoginForm />
    </GuestOnly>
  );
}