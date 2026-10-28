"use client";

import { BRAZILIAN_STATES, SPECIALTIES, VEHICLE_TYPES } from "@/shared/constants/catalog";
import { PasswordField, SelectField, TextField } from "@/shared/components/FormControls";
import { formatCpfCnpj, formatPhone } from "@/shared/utils/format";
import { TermsCheckbox } from "@/features/auth/components/TermsCheckbox";
import type { ProviderFormValues, TaxIdType } from "../models/registration";
import type { ProviderErrors } from "./providerValidation";
import { CheckboxGroup, FileField } from "./ProviderFormFields";

export interface StepProps {
  values: ProviderFormValues;
  errors: ProviderErrors;
  update: <K extends keyof ProviderFormValues>(key: K, value: ProviderFormValues[K]) => void;
}

const STATE_OPTIONS = BRAZILIAN_STATES.map((uf) => ({ value: uf, label: uf }));
const ACTIVE_SPECIALTIES = SPECIALTIES.filter((specialty) => specialty.active);

export function PersonalStep({ values, errors, update }: StepProps) {
  return (
    <div className="space-y-4">
      <TextField label="Nome Completo" name="responsibleName" autoComplete="name" placeholder="Ex: Roberto Carlos da Silva"
        value={values.responsibleName} onChange={(e) => update("responsibleName", e.target.value)} error={errors.responsibleName} required />
      <TextField label="E-mail de Trabalho" type="email" name="email" autoComplete="email" placeholder="roberto@autotech.com"
        value={values.email} onChange={(e) => update("email", e.target.value)} error={errors.email} required />
      <TextField label="Telefone" type="tel" name="phone" autoComplete="tel-national" inputMode="tel" placeholder="(51) 99999-9999"
        value={values.phone} onChange={(e) => update("phone", formatPhone(e.target.value))} error={errors.phone} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField label="Senha" name="password" autoComplete="new-password" placeholder="Mínimo de 8 caracteres"
          hint="Use letras e números."
          value={values.password} onChange={(e) => update("password", e.target.value)} error={errors.password} required />
        <PasswordField label="Confirmar Senha" name="passwordConfirmation" autoComplete="new-password" placeholder="Repita a senha"
          value={values.passwordConfirmation} onChange={(e) => update("passwordConfirmation", e.target.value)} error={errors.passwordConfirmation} required />
      </div>
    </div>
  );
}

export function CompanyStep({ values, errors, update }: StepProps) {
  function changeTaxIdType(type: TaxIdType) {
    update("taxIdType", type);
    update("taxId", "");
  }

  return (
    <div className="space-y-4">
      <TextField label="Nome da Empresa / Oficina" name="companyName" autoComplete="organization" placeholder="Ex: AutoTech Solutions"
        value={values.companyName} onChange={(e) => update("companyName", e.target.value)} error={errors.companyName} required />

      <fieldset>
        <legend className="mb-1.5 text-xs font-semibold text-gray-700">Tipo de cadastro</legend>
        <div className="flex gap-4 text-sm text-gray-700">
          {(["cnpj", "cpf"] as const).map((type) => (
            <label key={type} className="flex items-center gap-2">
              <input type="radio" name="taxIdType" value={type} checked={values.taxIdType === type}
                onChange={() => changeTaxIdType(type)} className="h-4 w-4 accent-orange-500" />
              {type === "cnpj" ? "Empresa (CNPJ)" : "Autônomo (CPF)"}
            </label>
          ))}
        </div>
      </fieldset>

      <TextField label={values.taxIdType === "cnpj" ? "CNPJ" : "CPF"} name="taxId" inputMode="numeric"
        placeholder={values.taxIdType === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
        value={values.taxId} onChange={(e) => update("taxId", formatCpfCnpj(e.target.value))} error={errors.taxId} required />

      <TextField label="Endereço Completo" name="address" autoComplete="street-address" placeholder="Rua Júlio de Castilhos, 1234 - Bairro Floresta"
        value={values.address} onChange={(e) => update("address", e.target.value)} error={errors.address} required />

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <TextField label="Cidade" name="city" autoComplete="address-level2" placeholder="Ex: Porto Alegre"
          value={values.city} onChange={(e) => update("city", e.target.value)} error={errors.city} required />
        <SelectField label="Estado" name="state" autoComplete="address-level1" placeholder="UF" options={STATE_OPTIONS}
          value={values.state} onChange={(e) => update("state", e.target.value)} error={errors.state} required />
      </div>
    </div>
  );
}

export function SpecialtiesStep({ values, errors, update }: StepProps) {
  return (
    <div className="space-y-6">
      <CheckboxGroup legend="Tipos de veículo atendidos" options={VEHICLE_TYPES}
        selected={values.vehicleTypeIds} onChange={(ids) => update("vehicleTypeIds", ids)} error={errors.vehicleTypeIds} />
      <CheckboxGroup legend="Especialidades e tipos de serviço" options={ACTIVE_SPECIALTIES}
        selected={values.specialtyIds} onChange={(ids) => update("specialtyIds", ids)} error={errors.specialtyIds} />
    </div>
  );
}

export function DocumentsStep({ values, errors, update }: StepProps) {
  const proofLabel = values.taxIdType === "cnpj" ? "Cartão CNPJ ou alvará de funcionamento" : "Comprovante de endereço profissional";
  return (
    <div className="space-y-5">
      <FileField label="Documento de identificação do responsável" required
        description="RG ou CNH (frente e verso em um único arquivo)."
        file={values.identityDocument} onChange={(file) => update("identityDocument", file)} error={errors.identityDocument} />
      <FileField label={proofLabel}
        description="Opcional, mas acelera a análise do seu cadastro."
        file={values.businessProof} onChange={(file) => update("businessProof", file)} error={errors.businessProof} />
    </div>
  );
}

export function ConfirmationStep({ values, errors, update }: StepProps) {
  const vehicleNames = VEHICLE_TYPES.filter((v) => values.vehicleTypeIds.includes(v.id)).map((v) => v.name).join(", ");
  const specialtyNames = SPECIALTIES.filter((s) => values.specialtyIds.includes(s.id)).map((s) => s.name).join(", ");
  const rows: [string, string][] = [
    ["Responsável", values.responsibleName],
    ["E-mail", values.email],
    ["Telefone", values.phone],
    ["Empresa / Oficina", values.companyName],
    [values.taxIdType === "cnpj" ? "CNPJ" : "CPF", values.taxId],
    ["Endereço", `${values.address}, ${values.city} - ${values.state}`],
    ["Veículos", vehicleNames],
    ["Especialidades", specialtyNames],
    ["Documentos", [values.identityDocument?.name, values.businessProof?.name].filter(Boolean).join(", ")],
  ];

  return (
    <div className="space-y-5">
      <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-gray-50 text-sm">
        {rows.map(([term, description]) => (
          <div key={term} className="grid gap-0.5 px-4 py-2.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
            <dt className="text-xs font-semibold text-gray-500">{term}</dt>
            <dd className="break-words text-gray-800">{description}</dd>
          </div>
        ))}
      </dl>
      <p className="rounded-lg bg-orange-50 px-4 py-3 text-xs text-orange-900">
        Depois de enviar, você receberá um e-mail para confirmar seu endereço. Seu perfil só aparecerá para clientes
        depois da análise dos documentos pela equipe MobiFix.
      </p>
      <TermsCheckbox checked={values.acceptedTerms} onChange={(checked) => update("acceptedTerms", checked)} error={errors.acceptedTerms} />
    </div>
  );
}
