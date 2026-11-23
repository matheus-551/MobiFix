"use client";

import { useState, type FormEvent } from "react";
import { Camera } from "lucide-react";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { SelectField, TextField } from "@/shared/components/FormControls";
import { BRAZILIAN_STATES } from "@/shared/constants/catalog";
import { getFriendlyError } from "@/shared/lib/api/http";
import type { ClientProfile } from "@/shared/types/domain";
import { formatPhone, onlyDigits } from "@/shared/utils/format";
import { compactErrors, validateName, validatePhone, validateState } from "@/shared/validators/fields";
import { useClient } from "../../context/ClientContext";
import { useToast } from "../feedback/ToastContext";
import { updateClientProfile } from "../../services/profileService";

const STATE_OPTIONS = BRAZILIAN_STATES.map((uf) => ({ value: uf, label: uf }));

interface Values {
  fullName: string;
  phone: string;
  state: string;
}

function toValues(profile: ClientProfile): Values {
  return { fullName: `${profile.firstName} ${profile.lastName}`.trim(), phone: formatPhone(profile.phone), state: profile.state };
}

/** "Maria da Silva" → nome "Maria", sobrenome "da Silva" (a API guarda os dois separados). */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

function validate(values: Values) {
  const { firstName, lastName } = splitName(values.fullName);
  return compactErrors({
    fullName: !firstName
      ? "Informe seu nome completo."
      : !lastName
        ? "Informe nome e sobrenome."
        : (validateName(firstName, "o nome") ?? validateName(lastName, "o sobrenome")),
    phone: validatePhone(values.phone),
    state: validateState(values.state),
  });
}

export function ProfileInfoForm({ initial }: { initial: ClientProfile }) {
  const { uid, email, reloadProfile } = useClient();
  const { showToast } = useToast();
  const [saved, setSaved] = useState<Values>(() => toValues(initial));
  const [values, setValues] = useState<Values>(saved);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const dirty =
    values.fullName.trim().replace(/\s+/g, " ") !== saved.fullName ||
    onlyDigits(values.phone) !== onlyDigits(saved.phone) ||
    values.state !== saved.state;

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFeedback(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const { firstName, lastName } = splitName(values.fullName);
    setSaving(true);
    setFeedback(null);
    try {
      await updateClientProfile({ uid, email, currentProfile: initial, firstName, lastName, phone: values.phone, state: values.state });
      const next = { fullName: `${firstName} ${lastName}`, phone: formatPhone(values.phone), state: values.state };
      setSaved(next);
      setValues(next);
      reloadProfile();
      showToast("Alterações salvas com sucesso.");
    } catch (error) {
      setFeedback({ tone: "error", message: getFriendlyError(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="profile-info-title" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
      <h2 id="profile-info-title" className="border-b border-gray-100 pb-4 text-base font-bold text-gray-900">
        Informações do Perfil
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-100 text-2xl font-bold text-orange-600"
          >
            {(splitName(saved.fullName).firstName || "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <button
              type="button"
              disabled
              title="Indisponível: a API ainda não permite enviar foto de perfil."
              className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-md bg-orange-200 px-3 text-xs font-semibold text-white"
            >
              <Camera aria-hidden className="h-3.5 w-3.5" />
              Alterar Foto
            </button>
            <p className="mt-1 text-[11px] text-gray-500">PNG ou JPG até 5MB · indisponível no momento</p>
          </div>
        </div>

        {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Nome Completo"
            name="fullName"
            autoComplete="name"
            value={values.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            error={errors.fullName}
            maxLength={120}
            required
          />
          <TextField
            label="E-mail"
            type="email"
            name="email"
            value={email ?? ""}
            readOnly
            disabled
            hint="O e-mail é a identidade da conta e não pode ser alterado aqui."
          />
          <TextField
            label="Telefone"
            type="tel"
            name="phone"
            autoComplete="tel-national"
            inputMode="tel"
            placeholder="(51) 99999-9999"
            value={values.phone}
            onChange={(event) => update("phone", formatPhone(event.target.value))}
            error={errors.phone}
            required
          />
          <SelectField
            label="Estado (UF)"
            name="state"
            placeholder="Selecione"
            options={STATE_OPTIONS}
            value={values.state}
            onChange={(event) => update("state", event.target.value)}
            error={errors.state}
            required
          />
        </div>

        <TextField
          label="Endereço Completo"
          name="address"
          value=""
          readOnly
          disabled
          placeholder="Indisponível no momento"
          hint="A API ainda não possui o campo de endereço."
        />

        <div className="flex justify-end">
          <div className="w-full sm:w-44">
            <Button type="submit" loading={saving} loadingLabel="Salvando..." disabled={!dirty}>
              Salvar Alterações
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
