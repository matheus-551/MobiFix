"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Alert } from "@/shared/components/Alert";
import { PasswordField } from "@/shared/components/FormControls";
import { getFriendlyError } from "@/shared/lib/api/http";
import { compactErrors, validateNewPassword, validatePasswordConfirmation } from "@/shared/validators/fields";
import { useToast } from "../feedback/ToastContext";
import { changePassword, WrongCurrentPasswordError } from "../../services/profileService";

interface Values {
  current: string;
  next: string;
  confirmation: string;
}

const EMPTY: Values = { current: "", next: "", confirmation: "" };

function validate(values: Values) {
  return compactErrors({
    current: values.current ? null : "Informe a senha atual.",
    next:
      validateNewPassword(values.next) ??
      (values.next && values.next === values.current ? "A nova senha deve ser diferente da atual." : null),
    confirmation: validatePasswordConfirmation(values.next, values.confirmation),
  });
}

export function PasswordForm() {
  const { showToast } = useToast();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  function update(key: keyof Values, value: string) {
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

    setSaving(true);
    setFeedback(null);
    try {
      await changePassword(values.current, values.next);
      setValues(EMPTY);
      showToast("Senha alterada com sucesso.");
    } catch (error) {
      if (error instanceof WrongCurrentPasswordError) setErrors({ current: error.message });
      else setFeedback({ tone: "error", message: getFriendlyError(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="password-title" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
      <h2 id="password-title" className="border-b border-gray-100 pb-4 text-base font-bold text-gray-900">
        Segurança (Alterar Senha)
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-6 max-w-md space-y-5">
        {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}
        <PasswordField
          label="Senha Atual"
          name="currentPassword"
          autoComplete="current-password"
          value={values.current}
          onChange={(event) => update("current", event.target.value)}
          error={errors.current}
          required
        />
        <PasswordField
          label="Nova Senha"
          name="newPassword"
          autoComplete="new-password"
          value={values.next}
          onChange={(event) => update("next", event.target.value)}
          error={errors.next}
          hint="Mínimo de 8 caracteres, com letras e números."
          required
        />
        <PasswordField
          label="Confirmar Nova Senha"
          name="confirmNewPassword"
          autoComplete="new-password"
          value={values.confirmation}
          onChange={(event) => update("confirmation", event.target.value)}
          error={errors.confirmation}
          required
        />
        <button
          type="submit"
          disabled={saving}
          aria-busy={saving || undefined}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-500"
        >
          {saving && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
          {saving ? "Alterando..." : "Alterar Senha"}
        </button>
      </form>
    </section>
  );
}
