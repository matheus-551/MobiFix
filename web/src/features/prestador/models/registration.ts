import type { ProviderDocumentKind } from "@/shared/types/domain";

export type TaxIdType = "cpf" | "cnpj";

export const DOCUMENT_ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;

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
  identityDocument: File | null;
  businessProof: File | null;
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
  identityDocument: null,
  businessProof: null,
  acceptedTerms: false,
};

export interface ProviderStep {
  id: "personal" | "company" | "specialties" | "documents" | "confirmation";
  label: string;
}

export const PROVIDER_STEPS: readonly ProviderStep[] = [
  { id: "personal", label: "Dados Pessoais" },
  { id: "company", label: "Dados da Empresa" },
  { id: "specialties", label: "Especialidades" },
  { id: "documents", label: "Documentos" },
  { id: "confirmation", label: "Confirmação" },
];

export type DocumentField = Extract<keyof ProviderFormValues, "identityDocument" | "businessProof">;

export const DOCUMENT_KIND_BY_FIELD: Record<DocumentField, ProviderDocumentKind> = {
  identityDocument: "identity",
  businessProof: "business_proof",
};
