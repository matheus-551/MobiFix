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
} from "@/shared/validators/fields";
import type { ProviderFormValues, ProviderStep } from "../models/registration";

export type ProviderErrors = Partial<Record<keyof ProviderFormValues, string>>;

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
    case "confirmation":
      return compactErrors({ acceptedTerms: validateAccepted(values.acceptedTerms) });
    case "verification":
      // A verificação (quando ativa) é feita pelo link nativo do Firebase (VerifyEmailPanel); não há campo do formulário aqui.
      return {};
  }
}
