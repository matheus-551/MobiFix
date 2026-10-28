import {
  compactErrors,
  required,
  validateAccepted,
  validateEmail,
  validateName,
  validatePasswordConfirmation,
  validateNewPassword,
  validatePhone,
  validateState,
  validateTaxId,
  type FieldError,
} from "@/shared/validators/fields";
import {
  DOCUMENT_ACCEPTED_TYPES,
  DOCUMENT_MAX_BYTES,
  type ProviderFormValues,
  type ProviderStep,
} from "../models/registration";

export type ProviderErrors = Partial<Record<keyof ProviderFormValues, string>>;

function validateDocument(file: File | null, label: string, mandatory: boolean): FieldError {
  if (!file) return mandatory ? `Anexe ${label}.` : null;
  if (!(DOCUMENT_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return "Formato não aceito. Envie PDF, JPG ou PNG.";
  }
  if (file.size > DOCUMENT_MAX_BYTES) return "O arquivo excede o limite de 5 MB.";
  if (file.size === 0) return "O arquivo está vazio.";
  return null;
}

/** Valida somente os campos da etapa informada. Objeto vazio = etapa válida. */
export function validateProviderStep(step: ProviderStep["id"], values: ProviderFormValues): ProviderErrors {
  switch (step) {
    case "personal":
      return compactErrors({
        responsibleName: validateName(values.responsibleName, "o nome completo"),
        email: validateEmail(values.email),
        phone: validatePhone(values.phone),
        password: validateNewPassword(values.password),
        passwordConfirmation: validatePasswordConfirmation(values.password, values.passwordConfirmation),
      });
    case "company":
      return compactErrors({
        companyName: validateName(values.companyName, "o nome da empresa ou oficina"),
        taxId: validateTaxId(values.taxId, values.taxIdType),
        address: values.address.trim().length >= 5 ? null : "Informe o endereço completo.",
        city: required(values.city, "a cidade"),
        state: validateState(values.state),
      });
    case "specialties":
      return compactErrors({
        vehicleTypeIds: values.vehicleTypeIds.length ? null : "Selecione ao menos um tipo de veículo.",
        specialtyIds: values.specialtyIds.length ? null : "Selecione ao menos uma especialidade.",
      });
    case "documents":
      return compactErrors({
        identityDocument: validateDocument(values.identityDocument, "um documento de identificação", true),
        businessProof: validateDocument(values.businessProof, "o comprovante", false),
      });
    case "confirmation":
      return compactErrors({ acceptedTerms: validateAccepted(values.acceptedTerms) });
  }
}
