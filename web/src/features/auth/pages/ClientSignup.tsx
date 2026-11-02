"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/routes";
import { BRAZILIAN_STATES } from "@/shared/constants/catalog";
import { Alert } from "@/shared/components/Alert";
import { AuthPage } from "@/shared/components/AuthCard";
import { Button } from "@/shared/components/Button";
import { PasswordField, SelectField, TextField } from "@/shared/components/FormControls";
import { formatPhone } from "@/shared/utils/format";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import {
  compactErrors,
  validateAccepted,
  validateEmail,
  validateName,
  validateNewPassword,
  validatePasswordConfirmation,
  validatePhone,
  validateState,
} from "@/shared/validators/fields";
import { EmailVerificationStep } from "../components/EmailVerificationStep";
import { GuestOnly } from "../components/RouteGuards";
import { RegistrationSuccess } from "../components/RegistrationSuccess";
import { RoleTabs } from "../components/RoleTabs";
import { TermsCheckbox } from "../components/TermsCheckbox";
import type { ApiSyncResult } from "../services/apiRegistration";
import { registerClient } from "../services/authService";
import { EmailVerificationError, requestVerificationCode } from "../services/emailVerificationService";

interface Values {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  password: string;
  passwordConfirmation: string;
  acceptedTerms: boolean;
}

type Errors = Partial<Record<keyof Values, string>>;

const INITIAL: Values = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  state: "",
  password: "",
  passwordConfirmation: "",
  acceptedTerms: false,
};

const STATE_OPTIONS = BRAZILIAN_STATES.map((uf) => ({ value: uf, label: uf }));

function validate(values: Values): Errors {
  return compactErrors({
    firstName: validateName(values.firstName, "o primeiro nome"),
    lastName: validateName(values.lastName, "o sobrenome"),
    email: validateEmail(values.email),
    phone: validatePhone(values.phone),
    state: validateState(values.state),
    password: validateNewPassword(values.password),
    passwordConfirmation: validatePasswordConfirmation(values.password, values.passwordConfirmation),
    acceptedTerms: validateAccepted(values.acceptedTerms),
  });
}

type Stage = "form" | "verify" | "done";

function ClientSignupForm({ onHold }: { onHold: (hold: boolean) => void }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>("form");
  const [resendSeconds, setResendSeconds] = useState(60);
  const [apiResult, setApiResult] = useState<ApiSyncResult>({ ok: true });
  /** Último e-mail para o qual um código foi enviado (evita novo envio ao voltar e avançar sem mudar o e-mail). */
  const sent = useRef<{ email: string; at: number; resendSeconds: number } | null>(null);
  const goToDashboard = useCallback(() => router.replace(routes.clientHome), [router]);

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  /** ETAPAS 1 e 2: valida o formulário e solicita o código de verificação ao servidor. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const found = validate(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    const email = values.email.trim().toLowerCase();
    const previous = sent.current;
    if (previous && previous.email === email) {
      const elapsed = Math.floor((Date.now() - previous.at) / 1000);
      setResendSeconds(Math.max(0, previous.resendSeconds - elapsed));
      setStage("verify");
      return;
    }

    setLoading(true);
    try {
      const result = await requestVerificationCode(email);
      sent.current = { email, at: Date.now(), resendSeconds: result.resendAfterSeconds };
      setResendSeconds(result.resendAfterSeconds);
      setStage("verify");
    } catch (error) {
      if (error instanceof EmailVerificationError && error.code === "email_in_use") {
        setErrors({ email: error.message });
      } else {
        setFormError(error instanceof EmailVerificationError ? error.message : getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }

  /** ETAPAS 5 e 6: com o e-mail verificado, cria a conta, grava o perfil e cadastra na API. */
  async function finalize(verificationToken: string) {
    onHold(true);
    try {
      const result = await registerClient({ ...values, verificationToken });
      setApiResult(result.api);
      setStage("done");
    } catch (error) {
      onHold(false);
      throw error;
    }
  }

  if (stage === "done") {
    return (
      <AuthPage width="max-w-lg">
        <RegistrationSuccess
          title="Cadastro concluído!"
          message="Seu e-mail foi verificado e sua conta de cliente está pronta."
          api={apiResult}
          onContinue={goToDashboard}
          continueLabel="Ir para o painel"
        />
      </AuthPage>
    );
  }

  if (stage === "verify") {
    return (
      <AuthPage width="max-w-lg">
        <RoleTabs active="client" />
        <EmailVerificationStep
          email={values.email.trim().toLowerCase()}
          initialResendSeconds={resendSeconds}
          onVerified={finalize}
          onBack={() => setStage("form")}
          backLabel="Voltar e editar dados"
        />
      </AuthPage>
    );
  }

  return (
    <AuthPage width="max-w-lg">
      <RoleTabs active="client" />
      <h1 className="text-xl font-bold text-gray-900">Crie sua conta de Cliente</h1>
      <p className="mb-6 mt-1 text-xs text-gray-500">Encontre mecânicos qualificados rapidamente.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <TextField label="Primeiro nome" name="firstName" autoComplete="given-name" placeholder="Seu nome"
          value={values.firstName} onChange={(e) => update("firstName", e.target.value)} error={errors.firstName} required />
        <TextField label="Sobrenome" name="lastName" autoComplete="family-name" placeholder="Seu sobrenome"
          value={values.lastName} onChange={(e) => update("lastName", e.target.value)} error={errors.lastName} required />
        <TextField label="E-mail" type="email" name="email" autoComplete="email" placeholder="exemplo@e-mail.com"
          value={values.email} onChange={(e) => update("email", e.target.value)} error={errors.email} required />
        <TextField label="Telefone" type="tel" name="phone" autoComplete="tel-national" inputMode="tel" placeholder="(51) 99999-9999"
          value={values.phone} onChange={(e) => update("phone", formatPhone(e.target.value))} error={errors.phone} required />
        <SelectField label="Estado" name="state" autoComplete="address-level1" placeholder="UF" options={STATE_OPTIONS}
          value={values.state} onChange={(e) => update("state", e.target.value)} error={errors.state} required />
        <PasswordField label="Senha" name="password" autoComplete="new-password" placeholder="Crie uma senha forte"
          hint="Mínimo de 8 caracteres, com letras e números."
          value={values.password} onChange={(e) => update("password", e.target.value)} error={errors.password} required />
        <PasswordField label="Confirmar Senha" name="passwordConfirmation" autoComplete="new-password" placeholder="Repita a senha criada"
          value={values.passwordConfirmation} onChange={(e) => update("passwordConfirmation", e.target.value)} error={errors.passwordConfirmation} required />

        <TermsCheckbox checked={values.acceptedTerms} onChange={(checked) => update("acceptedTerms", checked)} error={errors.acceptedTerms} />

        <Button type="submit" loading={loading} loadingLabel="Enviando código...">
          Continuar e verificar e-mail
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500">
        Já possui uma conta?{" "}
        <Link href={routes.login} className="font-semibold text-orange-500 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthPage>
  );
}

export default function ClientSignup() {
  const [hold, setHold] = useState(false);
  return (
    <GuestOnly hold={hold}>
      <ClientSignupForm onHold={setHold} />
    </GuestOnly>
  );
}