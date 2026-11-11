"use client";

import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/routes";
import { BRAZILIAN_STATES } from "@/shared/constants/catalog";
import { EMAIL_VERIFICATION_ENABLED } from "@/shared/config/features";
import { Alert } from "@/shared/components/Alert";
import { AuthPage } from "@/shared/components/AuthCard";
import { Button } from "@/shared/components/Button";
import { PasswordField, SelectField, TextField } from "@/shared/components/FormControls";
import { formatPhone } from "@/shared/utils/format";
import { getErrorCode, getErrorMessage } from "@/shared/utils/firebaseErrors";
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
import { GuestOnly } from "../components/RouteGuards";
import { RegistrationSuccess } from "../components/RegistrationSuccess";
import { RoleTabs } from "../components/RoleTabs";
import { TermsCheckbox } from "../components/TermsCheckbox";
import { VerifyEmailPanel } from "../components/VerifyEmailPanel";
import { registerClient } from "../services/authService";

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
  const [emailDispatch, setEmailDispatch] = useState<Promise<boolean>>();
  const goToDashboard = useCallback(() => router.replace(routes.clientHome), [router]);
  const handleVerified = useCallback(() => setStage("done"), []);
  const handleLeave = useCallback(() => {
    onHold(false);
    setStage("form");
  }, [onHold]);

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  /** Valida o formulário, cria a conta no Firebase Authentication e (se a verificação estiver ativa) envia o link. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const found = validate(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    // Impede que o GuestOnly redirecione enquanto a conta e o perfil estão sendo criados.
    onHold(true);
    try {
      const result = await registerClient(values);
      if (result.verificationRequired) {
        setEmailDispatch(result.verificationEmail);
        setStage("verify");
      } else {
        // Verificação desativada: nenhuma confirmação é exigida, a conta já está pronta para uso.
        setStage("done");
      }
    } catch (error) {
      onHold(false);
      if (getErrorCode(error) === "auth/email-already-in-use") {
        setErrors({ email: getErrorMessage(error) });
      } else {
        setFormError(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }

  if (stage === "done") {
    return (
      <AuthPage width="max-w-lg">
        <RegistrationSuccess
          title="Cadastro concluído!"
          message={
            EMAIL_VERIFICATION_ENABLED
              ? "Seu e-mail foi verificado e sua conta de cliente está pronta."
              : "Sua conta de cliente foi criada e já está pronta para uso."
          }
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
        <VerifyEmailPanel onVerified={handleVerified} onLeave={handleLeave} emailDispatch={emailDispatch} />
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

        <Button type="submit" loading={loading} loadingLabel="Criando conta...">
          {EMAIL_VERIFICATION_ENABLED ? "Criar conta e verificar e-mail" : "Criar conta"}
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