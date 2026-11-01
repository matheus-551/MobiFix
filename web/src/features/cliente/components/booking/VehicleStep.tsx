"use client";

import { useState, type FormEvent } from "react";
import { Check, Plus } from "lucide-react";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { SelectField, TextField } from "@/shared/components/FormControls";
import { getFriendlyError } from "@/shared/lib/api/http";
import { createVehicle } from "../../services/vehicleService";
import type { ApiVehicle, CatalogItem } from "../../types";
import { VehicleTypeIcon } from "../../utils/vehicleIcons";
import { ErrorState, LoadingBlock } from "../StateViews";

interface VehicleListState {
  data: ApiVehicle[] | null;
  loading: boolean;
  error: unknown;
  reload: () => void;
}

/** Formulário de cadastro de veículo (`POST /veiculos`), reutilizado pela página "Meus Veículos". */
export function NewVehicleForm({
  vehicleTypes,
  onCreated,
  onCancel,
}: {
  vehicleTypes: CatalogItem[];
  onCreated: (vehicle: ApiVehicle) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState({ tipoVeiculoId: "", marca: "", modelo: "", ano: "", placa: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const maxYear = new Date().getFullYear() + 1;
    const year = Number(values.ano);
    const found: typeof errors = {};
    if (!values.tipoVeiculoId) found.tipoVeiculoId = "Selecione o tipo de veículo.";
    if (!values.marca.trim()) found.marca = "Informe a marca.";
    else if (values.marca.trim().length > 100) found.marca = "Use no máximo 100 caracteres.";
    if (!values.modelo.trim()) found.modelo = "Informe o modelo.";
    else if (values.modelo.trim().length > 100) found.modelo = "Use no máximo 100 caracteres.";
    if (!/^\d{4}$/.test(values.ano) || year < 1886 || year > maxYear) found.ano = `Informe um ano entre 1886 e ${maxYear}.`;
    if (values.placa.trim().length > 8) found.placa = "A placa deve ter no máximo 8 caracteres.";
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const vehicle = await createVehicle({
        tipoVeiculoId: Number(values.tipoVeiculoId),
        marca: values.marca,
        modelo: values.modelo,
        ano: year,
        placa: values.placa,
      });
      onCreated(vehicle);
    } catch (error) {
      setFormError(getFriendlyError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/40 p-4">
      <h3 className="text-sm font-bold text-gray-900">Cadastrar novo veículo</h3>
      {formError && <Alert tone="error">{formError}</Alert>}
      <SelectField
        label="Tipo de veículo"
        placeholder="Selecione"
        required
        options={vehicleTypes.map((item) => ({ value: String(item.id), label: item.nome }))}
        value={values.tipoVeiculoId}
        onChange={(event) => set("tipoVeiculoId", event.target.value)}
        error={errors.tipoVeiculoId}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Marca" required value={values.marca} onChange={(e) => set("marca", e.target.value)} error={errors.marca} placeholder="Honda" />
        <TextField label="Modelo" required value={values.modelo} onChange={(e) => set("modelo", e.target.value)} error={errors.modelo} placeholder="Civic" />
        <TextField label="Ano" required inputMode="numeric" maxLength={4} value={values.ano} onChange={(e) => set("ano", e.target.value.replace(/\D/g, ""))} error={errors.ano} placeholder="2022" />
        <TextField label="Placa (opcional)" maxLength={8} value={values.placa} onChange={(e) => set("placa", e.target.value.toUpperCase())} error={errors.placa} placeholder="ABC1D23" />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <div className="sm:w-32">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        </div>
        <div className="sm:w-40">
          <Button type="submit" loading={saving} loadingLabel="Salvando...">
            Salvar veículo
          </Button>
        </div>
      </div>
    </form>
  );
}

export function VehicleStep({
  vehicles,
  vehicleTypes,
  servedTypeIds,
  selectedId,
  onSelect,
  error,
}: {
  vehicles: VehicleListState;
  vehicleTypes: CatalogItem[];
  /** Tipos de veículo atendidos pelo prestador (a API não aceita agendar outros tipos de forma útil). */
  servedTypeIds: number[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  error?: string;
}) {
  const [adding, setAdding] = useState(false);
  const typeName = (id: number) => vehicleTypes.find((item) => item.id === id)?.nome ?? "Veículo";

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm" aria-labelledby="etapa-veiculo">
      <h2 id="etapa-veiculo" className="mb-4 text-base font-bold text-gray-900">
        1. Selecione o Veículo
      </h2>

      {vehicles.loading ? (
        <LoadingBlock label="Carregando seus veículos..." />
      ) : vehicles.error !== null ? (
        <ErrorState message={getFriendlyError(vehicles.error)} onRetry={vehicles.reload} />
      ) : (
        <div className="space-y-3">
          {(vehicles.data ?? []).length === 0 && !adding && (
            <p className="text-sm text-gray-500">Você ainda não tem veículos cadastrados. Cadastre o primeiro para continuar.</p>
          )}
          <div role="radiogroup" aria-label="Veículos cadastrados" className="space-y-3">
            {(vehicles.data ?? []).map((vehicle) => {
              const compatible = servedTypeIds.includes(vehicle.tipoVeiculoId);
              const selected = vehicle.id === selectedId;
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!compatible}
                  onClick={() => onSelect(vehicle.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:opacity-60 ${
                    selected ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <VehicleTypeIcon name={typeName(vehicle.tipoVeiculoId)} className="h-5 w-5 text-orange-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {vehicle.marca} {vehicle.modelo} ({vehicle.ano})
                    </span>
                    <span className="block text-xs text-gray-500">
                      Placa: {vehicle.placa || "não informada"}
                      {!compatible && " • Tipo não atendido por esta oficina"}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      selected ? "border-orange-500 bg-orange-500 text-white" : "border-gray-300"
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </span>
                </button>
              );
            })}
          </div>

          {adding ? (
            <NewVehicleForm
              vehicleTypes={vehicleTypes}
              onCancel={() => setAdding(false)}
              onCreated={(vehicle) => {
                setAdding(false);
                vehicles.reload();
                if (servedTypeIds.includes(vehicle.tipoVeiculoId)) onSelect(vehicle.id);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-orange-300 py-3 text-xs font-semibold text-orange-500 hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <Plus aria-hidden className="h-4 w-4" />
              Cadastrar Novo Veículo
            </button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
