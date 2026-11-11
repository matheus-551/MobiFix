import { EMAIL_VERIFICATION_ENABLED } from "@/shared/config/features";

export type TaxIdType = "cpf" | "cnpj";

/** Estado completo do formulário em etapas (preservado ao navegar entre elas). */
export interface ProviderFormValues {
  responsibleName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
  companyName: string;
  taxIdType: TaxIdType;
  taxId: string;
  address: string;
  city: string;
  state: string;
  vehicleTypeIds: string[];
  specialtyIds: string[];
  acceptedTerms: boolean;
}

export const INITIAL_PROVIDER_VALUES: ProviderFormValues = {
  responsibleName: "",
  email: "",
  phone: "",
  password: "",
  passwordConfirmation: "",
  companyName: "",
  taxIdType: "cnpj",
  taxId: "",
  address: "",
  city: "",
  state: "",
  vehicleTypeIds: [],
  specialtyIds: [],
  acceptedTerms: false,
};

export interface ProviderStep {
  id: "personal" | "company" | "specialties" | "confirmation" | "verification";
  label: string;
}

/**
 * Etapas do cadastro. A etapa final "Verificação" (e-mail) só existe com a verificação de e-mail ativa
 * (NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED, ver `src/shared/config/features.ts`).
 */
export const PROVIDER_STEPS: readonly ProviderStep[] = [
  { id: "personal", label: "Dados Pessoais" },
  { id: "company", label: "Dados da Empresa" },
  { id: "specialties", label: "Especialidades" },
  { id: "confirmation", label: "Confirmação" },
  ...(EMAIL_VERIFICATION_ENABLED ? ([{ id: "verification", label: "Verificação" }] as const) : []),
];
