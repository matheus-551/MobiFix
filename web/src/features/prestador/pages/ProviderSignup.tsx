"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { AuthPage } from "@/shared/components/AuthCard";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { Button } from "@/shared/components/Button";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import { GuestOnly } from "@/features/auth/components/RouteGuards";
import { RoleTabs } from "@/features/auth/components/RoleTabs";
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
};

function ProviderSignupForm() {
  const router = useRouter();
  const [values, setValues] = useState<ProviderFormValues>(INITIAL_PROVIDER_VALUES);
  const [errors, setErrors] = useState<ProviderErrors>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const step = PROVIDER_STEPS[stepIndex];
  const isLast = stepIndex === PROVIDER_STEPS.length - 1;

  // Move o foco para o título ao trocar de etapa (leitores de tela e navegação por teclado).
  useEffect(() => {
    headingRef.current?.focus();
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

    if (!isLast) {
      setStepIndex((index) => index + 1);
      return;
    }

    // Revalida tudo antes de criar a conta (defesa contra estados inconsistentes).
    for (let index = 0; index < PROVIDER_STEPS.length - 1; index++) {
      const stepErrors = validateProviderStep(PROVIDER_STEPS[index].id, values);
      if (Object.keys(stepErrors).length > 0) {
        setStepIndex(index);
        setErrors(stepErrors);
        setFormError("Há campos inválidos em uma etapa anterior. Corrija para concluir.");
        return;
      }
    }

    setLoading(true);
    try {
      await registerProvider(values);
      router.replace(routes.verifyEmail);
    } catch (error) {
      setFormError(getErrorMessage(error));
      setLoading(false);
    }
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
          <Button type="submit" loading={loading} loadingLabel="Enviando cadastro..." className="sm:w-auto">
            {isLast ? "Concluir Cadastro" : "Próximo Passo"}
          </Button>
        </div>
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

export default function ProviderSignup() {
  return (
    <GuestOnly>
      <ProviderSignupForm />
    </GuestOnly>
  );
}
