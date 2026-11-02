"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { AuthPage } from "@/shared/components/AuthCard";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { Button } from "@/shared/components/Button";
import { getErrorCode, getErrorMessage } from "@/shared/utils/firebaseErrors";
import { GuestOnly } from "@/features/auth/components/RouteGuards";
import { RegistrationSuccess } from "@/features/auth/components/RegistrationSuccess";
import { RoleTabs } from "@/features/auth/components/RoleTabs";
import { VerifyEmailPanel } from "@/features/auth/components/VerifyEmailPanel";
import { INITIAL_PROVIDER_VALUES, PROVIDER_STEPS, type ProviderFormValues } from "../models/registration";
import { validateProviderStep, type ProviderErrors } from "../forms/providerValidation";
import { ProviderStepper } from "../forms/ProviderStepper";
import {
  CompanyStep,
  ConfirmationStep,
  DocumentsStep,
  PersonalStep,
  SpecialtiesStep,
  type StepProps,
} from "../forms/ProviderSteps";
import { registerProvider } from "../services/providerRegistration";

const STEP_TITLES: Record<(typeof PROVIDER_STEPS)[number]["id"], string> = {
  personal: "Passo 1: Seus Dados Pessoais",
  company: "Passo 2: Dados da Empresa/Oficina",
  specialties: "Passo 3: Especialidades e Serviços",
  documents: "Passo 4: Documentos",
  confirmation: "Passo 5: Confirmação",
  verification: "Passo 6: Verificação de E-mail",
};

function ProviderSignupForm({ onHold }: { onHold: (hold: boolean) => void }) {
  const router = useRouter();
  const [values, setValues] = useState<ProviderFormValues>(INITIAL_PROVIDER_VALUES);
  const [errors, setErrors] = useState<ProviderErrors>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailDispatch, setEmailDispatch] = useState<Promise<boolean>>();
  const [done, setDone] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const goToDashboard = useCallback(() => router.replace(routes.providerHome), [router]);

  const step = PROVIDER_STEPS[stepIndex];
  /** Último passo do formulário: ao avançar daqui a conta é criada, o link é enviado e a verificação começa. */
  const isLastFormStep = step.id === "confirmation";

  // Move o foco para o título ao trocar de etapa (leitores de tela e navegação por teclado).
  useEffect(() => {
    // Na verificação o foco fica no painel (VerifyEmailPanel), não no título.
    if (PROVIDER_STEPS[stepIndex].id !== "verification") headingRef.current?.focus();
  }, [stepIndex]);

  function update<K extends keyof ProviderFormValues>(key: K, value: ProviderFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  const stepProps: StepProps = { values, errors, update };

  function goBack() {
    setErrors({});
    setFormError(null);
    setStepIndex((index) => Math.max(0, index - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    // Não avança nem envia enquanto houver campos obrigatórios inválidos na etapa atual.
    const found = validateProviderStep(step.id, values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      setFormError("Corrija os campos destacados para continuar.");
      return;
    }

    if (!isLastFormStep) {
      setStepIndex((index) => index + 1);
      return;
    }

    // Revalida tudo antes de criar a conta (defesa contra estados inconsistentes).
    const formSteps = PROVIDER_STEPS.filter((item) => item.id !== "verification");
    for (let index = 0; index < formSteps.length - 1; index++) {
      const stepErrors = validateProviderStep(formSteps[index].id, values);
      if (Object.keys(stepErrors).length > 0) {
        setStepIndex(index);
        setErrors(stepErrors);
        setFormError("Há campos inválidos em uma etapa anterior. Corrija para concluir.");
        return;
      }
    }

    setLoading(true);
    // Impede que o GuestOnly redirecione enquanto a conta, os documentos e o perfil estão sendo criados.
    onHold(true);
    try {
      const result = await registerProvider(values);
      setEmailDispatch(result.verificationEmail);
      setStepIndex((index) => index + 1);
    } catch (error) {
      onHold(false);
      if (getErrorCode(error) === "auth/email-already-in-use") {
        // Leva o usuário ao campo de e-mail (passo 1) com a mensagem no próprio campo.
        setStepIndex(0);
        setErrors({ email: getErrorMessage(error) });
        setFormError("Este e-mail já está cadastrado.");
      } else {
        setFormError(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }

  const handleVerified = useCallback(() => setDone(true), []);
  const handleLeave = useCallback(() => {
    onHold(false);
    setStepIndex(0);
  }, [onHold]);

  if (done) {
    return (
      <AuthPage width="max-w-2xl">
        <RegistrationSuccess
          title="Cadastro enviado!"
          message="Seu e-mail foi verificado e seu cadastro de prestador foi criado. Nossa equipe vai analisar seus documentos."
          onContinue={goToDashboard}
          continueLabel="Ir para o painel"
        />
      </AuthPage>
    );
  }

  return (
    <AuthPage width="max-w-2xl">
      <div className="mb-5 text-center">
        <BrandLogo size="lg" />
        <h1 className="mt-3 text-lg font-bold text-gray-900">Seja um Prestador Parceiro MobiFix</h1>
        <p className="mt-1 text-xs text-gray-500">
          Alcance novos clientes, gerencie seus serviços e impulsione sua oficina.
        </p>
      </div>

      <RoleTabs active="provider" />
      <ProviderStepper currentIndex={stepIndex} />

      {step.id === "verification" ? (
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="mb-5 text-sm font-bold text-orange-500 outline-none">
            {STEP_TITLES[step.id]}
          </h2>
          <VerifyEmailPanel onVerified={handleVerified} onLeave={handleLeave} emailDispatch={emailDispatch} />
        </div>
      ) : (
      <form onSubmit={handleSubmit} noValidate>
        <h2 ref={headingRef} tabIndex={-1} className="mb-5 text-sm font-bold text-orange-500 outline-none">
          {STEP_TITLES[step.id]}
        </h2>

        {formError && (
          <div className="mb-4">
            <Alert tone="error">{formError}</Alert>
          </div>
        )}

        {step.id === "personal" && <PersonalStep {...stepProps} />}
        {step.id === "company" && <CompanyStep {...stepProps} />}
        {step.id === "specialties" && <SpecialtiesStep {...stepProps} />}
        {step.id === "documents" && <DocumentsStep {...stepProps} />}
        {step.id === "confirmation" && <ConfirmationStep {...stepProps} />}

        <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          {stepIndex === 0 ? (
            <Link href={routes.home} className="text-center text-xs text-gray-500 underline hover:text-orange-500 sm:text-left">
              Voltar ao Início
            </Link>
          ) : (
            <Button variant="secondary" onClick={goBack} disabled={loading} className="sm:w-auto">
              Voltar
            </Button>
          )}
          <Button type="submit" loading={loading} loadingLabel={isLastFormStep ? "Criando conta..." : "Aguarde..."} className="sm:w-auto">
            {isLastFormStep ? "Criar conta e verificar e-mail" : "Próximo Passo"}
          </Button>
        </div>
      </form>
      )}

      <p className="mt-6 text-center text-xs text-gray-500">
        Já possui uma conta?{" "}
        <Link href={routes.login} className="font-semibold text-orange-500 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthPage>
  );
}

export default function ProviderSignup() {
  const [hold, setHold] = useState(false);
  return (
    <GuestOnly hold={hold}>
      <ProviderSignupForm onHold={setHold} />
    </GuestOnly>
  );
}
