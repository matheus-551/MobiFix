"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { SelectField, TextField } from "@/shared/components/FormControls";
import { BRAZILIAN_STATES } from "@/shared/constants/catalog";
import { getFriendlyError } from "@/shared/lib/api/http";
import { useAsync } from "@/shared/hooks/useAsync";
import { onlyDigits } from "@/shared/utils/format";
import { ErrorState, LoadingBlock } from "@/features/cliente/components/StateViews";
import { listSpecialties, listVehicleTypes } from "@/features/cliente/services/catalogService";
import type { CatalogItem } from "@/features/cliente/types";
import type { ProviderProfile } from "@/shared/types/domain";
import { PageTitle } from "../components/ProviderUi";
import { useProvider } from "../context/ProviderContext";
import { ensureApiProviderUser, getMyApiProfile, saveMyApiProfile } from "../services/providerApiService";
import type { ApiProviderProfile } from "../types";

interface FormState {
  nomeFantasia: string;
  descricao: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  tiposVeiculoIds: number[];
  especialidadeIds: number[];
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function initialForm(api: ApiProviderProfile | null, profile: ProviderProfile): FormState {
  if (api) {
    return {
      nomeFantasia: api.nomeFantasia ?? "",
      descricao: api.descricao ?? "",
      logradouro: api.endereco.logradouro,
      numero: api.endereco.numero,
      complemento: api.endereco.complemento ?? "",
      bairro: api.endereco.bairro,
      cidade: api.endereco.cidade,
      uf: api.endereco.uf,
      cep: formatCep(api.endereco.cep),
      tiposVeiculoIds: api.tiposVeiculoIds,
      especialidadeIds: api.especialidadeIds,
    };
  }
  // Perfil ainda inexistente na API: pré-preenche com o que foi informado no cadastro.
  return {
    nomeFantasia: profile.displayName,
    descricao: "",
    logradouro: profile.address,
    numero: "",
    complemento: "",
    bairro: "",
    cidade: profile.city,
    uf: profile.state,
    cep: "",
    tiposVeiculoIds: [],
    especialidadeIds: [],
  };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.nomeFantasia.trim().length > 150) errors.nomeFantasia = "Use no máximo 150 caracteres.";
  if (form.descricao.trim().length > 2000) errors.descricao = "Use no máximo 2000 caracteres.";
  if (!form.logradouro.trim()) errors.logradouro = "Informe o logradouro.";
  else if (form.logradouro.trim().length > 200) errors.logradouro = "Use no máximo 200 caracteres.";
  if (!form.numero.trim()) errors.numero = "Informe o número.";
  else if (form.numero.trim().length > 20) errors.numero = "Use no máximo 20 caracteres.";
  if (form.complemento.trim().length > 100) errors.complemento = "Use no máximo 100 caracteres.";
  if (!form.bairro.trim()) errors.bairro = "Informe o bairro.";
  else if (form.bairro.trim().length > 100) errors.bairro = "Use no máximo 100 caracteres.";
  if (!form.cidade.trim()) errors.cidade = "Informe a cidade.";
  else if (form.cidade.trim().length > 100) errors.cidade = "Use no máximo 100 caracteres.";
  if (!(BRAZILIAN_STATES as readonly string[]).includes(form.uf)) errors.uf = "Selecione o estado.";
  if (onlyDigits(form.cep).length !== 8) errors.cep = "Informe o CEP com oito dígitos.";
  if (form.tiposVeiculoIds.length === 0) errors.tiposVeiculoIds = "Selecione pelo menos um tipo de veículo.";
  if (form.especialidadeIds.length === 0) errors.especialidadeIds = "Selecione pelo menos uma especialidade.";
  return errors;
}

function toggle(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function CheckGroup({
  legend,
  items,
  selected,
  error,
  onToggle,
}: {
  legend: string;
  items: CatalogItem[];
  selected: number[];
  error?: string;
  onToggle: (id: number) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold text-gray-700">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <label
            key={item.id}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              selected.includes(item.id) ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} className="h-3.5 w-3.5 accent-orange-500" />
            {item.nome}
          </label>
        ))}
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </fieldset>
  );
}

export default function ProviderProfileEditor() {
  const { uid, email, profile } = useProvider();
  const { data, error, loading, reload } = useAsync(
    async () => {
      if (!profile || !email) throw new Error("Perfil do prestador indisponível.");
      const [vehicleTypes, specialties] = await Promise.all([listVehicleTypes(), listSpecialties()]);
      await ensureApiProviderUser(profile, email);
      const apiProfile = await getMyApiProfile();
      return { vehicleTypes, specialties, apiProfile };
    },
    uid,
    Boolean(profile && email),
  );

  const [draft, setDraft] = useState<FormState | null>(null);
  const [created, setCreated] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  if (!profile) return <><PageTitle title="Editar Perfil do Prestador" /><LoadingBlock /></>;
  if (loading) return <><PageTitle title="Editar Perfil do Prestador" /><LoadingBlock label="Carregando perfil..." /></>;
  if (error || !data) {
    return (
      <>
        <PageTitle title="Editar Perfil do Prestador" />
        <ErrorState message={error ? getFriendlyError(error) : "Não foi possível carregar o perfil."} onRetry={reload} />
      </>
    );
  }

  const providerProfile: ProviderProfile = profile;
  const exists = created || data.apiProfile !== null;
  const form = draft ?? initialForm(data.apiProfile, providerProfile);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setDraft({ ...form, [key]: value });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const saved = await saveMyApiProfile(
        {
          nomeFantasia: form.nomeFantasia.trim(),
          descricao: form.descricao.trim(),
          endereco: {
            logradouro: form.logradouro.trim(),
            numero: form.numero.trim(),
            complemento: form.complemento.trim() || null,
            bairro: form.bairro.trim(),
            cidade: form.cidade.trim(),
            uf: form.uf,
            cep: onlyDigits(form.cep),
          },
          tiposVeiculoIds: form.tiposVeiculoIds,
          especialidadeIds: form.especialidadeIds,
        },
        exists,
      );
      setCreated(true);
      setDraft(initialForm(saved, providerProfile));
      setFeedback({ tone: "success", text: exists ? "Perfil atualizado com sucesso." : "Perfil cadastrado com sucesso." });
    } catch (failure) {
      setFeedback({ tone: "error", text: getFriendlyError(failure) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title="Editar Perfil do Prestador" />
      {!exists && (
        <Alert tone="info">
          Seu perfil profissional ainda não está cadastrado na API. Revise os dados abaixo e salve para que clientes possam encontrá-lo.
        </Alert>
      )}
      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="space-y-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <TextField label="Nome Fantasia da Oficina" value={form.nomeFantasia} error={errors.nomeFantasia} maxLength={150} onChange={(e) => setField("nomeFantasia", e.target.value)} />

        <div>
          <label htmlFor="descricao" className="mb-1.5 block text-xs font-semibold text-gray-700">Descrição da Oficina</label>
          <textarea
            id="descricao"
            rows={4}
            maxLength={2000}
            value={form.descricao}
            aria-invalid={errors.descricao ? true : undefined}
            onChange={(e) => setField("descricao", e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
          {errors.descricao && <p role="alert" className="mt-1 text-xs text-red-600">{errors.descricao}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Logradouro" required value={form.logradouro} error={errors.logradouro} maxLength={200} onChange={(e) => setField("logradouro", e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Número" required value={form.numero} error={errors.numero} maxLength={20} onChange={(e) => setField("numero", e.target.value)} />
            <TextField label="Complemento" value={form.complemento} error={errors.complemento} maxLength={100} onChange={(e) => setField("complemento", e.target.value)} />
          </div>
          <TextField label="Bairro" required value={form.bairro} error={errors.bairro} maxLength={100} onChange={(e) => setField("bairro", e.target.value)} />
          <TextField label="CEP" required inputMode="numeric" placeholder="00000-000" value={form.cep} error={errors.cep} onChange={(e) => setField("cep", formatCep(e.target.value))} />
          <TextField label="Cidade" required value={form.cidade} error={errors.cidade} maxLength={100} onChange={(e) => setField("cidade", e.target.value)} />
          <SelectField
            label="Estado"
            required
            placeholder="Selecione"
            value={form.uf}
            error={errors.uf}
            options={BRAZILIAN_STATES.map((state) => ({ value: state, label: state }))}
            onChange={(e) => setField("uf", e.target.value)}
          />
        </div>

        <CheckGroup
          legend="Nossas Especialidades"
          items={data.specialties}
          selected={form.especialidadeIds}
          error={errors.especialidadeIds}
          onToggle={(id) => setField("especialidadeIds", toggle(form.especialidadeIds, id))}
        />
        <CheckGroup
          legend="Tipos de Veículo Atendidos"
          items={data.vehicleTypes}
          selected={form.tiposVeiculoIds}
          error={errors.tiposVeiculoIds}
          onToggle={(id) => setField("tiposVeiculoIds", toggle(form.tiposVeiculoIds, id))}
        />

        <div className="max-w-48">
          <Button type="submit" loading={saving} loadingLabel="Salvando...">Salvar Perfil</Button>
        </div>
      </form>
    </>
  );
}
