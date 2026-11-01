"use client";

import { SelectField, TextField } from "@/shared/components/FormControls";
import { BRAZILIAN_STATES } from "@/shared/constants/catalog";
import type { CatalogItem } from "../types";

export interface FilterValues {
  tipoVeiculoId: string;
  especialidadeId: string;
  uf: string;
  cidade: string;
}

export const EMPTY_FILTERS: FilterValues = { tipoVeiculoId: "", especialidadeId: "", uf: "", cidade: "" };

const toOptions = (items: CatalogItem[]) => items.map((item) => ({ value: String(item.id), label: item.nome }));

/** Campos de filtro suportados pela API: tipo de veículo, especialidade, UF e cidade. */
export function ProviderFiltersForm({
  values,
  onChange,
  vehicleTypes,
  specialties,
  disabled,
}: {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  vehicleTypes: CatalogItem[];
  specialties: CatalogItem[];
  disabled?: boolean;
}) {
  const set = (key: keyof FilterValues, value: string) => onChange({ ...values, [key]: value });
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SelectField
        label="Tipo de veículo"
        placeholder="Todos os tipos"
        options={toOptions(vehicleTypes)}
        value={values.tipoVeiculoId}
        onChange={(event) => set("tipoVeiculoId", event.target.value)}
        disabled={disabled}
      />
      <SelectField
        label="Especialidade"
        placeholder="Todas as especialidades"
        options={toOptions(specialties)}
        value={values.especialidadeId}
        onChange={(event) => set("especialidadeId", event.target.value)}
        disabled={disabled}
      />
      <SelectField
        label="Estado (UF)"
        placeholder="Todos os estados"
        options={BRAZILIAN_STATES.map((uf) => ({ value: uf, label: uf }))}
        value={values.uf}
        onChange={(event) => set("uf", event.target.value)}
        disabled={disabled}
      />
      <TextField
        label="Cidade"
        placeholder="Ex.: Recife"
        maxLength={100}
        value={values.cidade}
        onChange={(event) => set("cidade", event.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

/** Converte os valores do formulário em parâmetros de URL (somente os preenchidos). */
export function filtersToParams(values: FilterValues, text?: string): URLSearchParams {
  const params = new URLSearchParams();
  if (values.tipoVeiculoId) params.set("tipoVeiculoId", values.tipoVeiculoId);
  if (values.especialidadeId) params.set("especialidadeId", values.especialidadeId);
  if (values.uf) params.set("uf", values.uf);
  if (values.cidade.trim()) params.set("cidade", values.cidade.trim());
  if (text) params.set("q", text);
  return params;
}

export function paramsToFilters(params: URLSearchParams): FilterValues {
  return {
    tipoVeiculoId: params.get("tipoVeiculoId") ?? "",
    especialidadeId: params.get("especialidadeId") ?? "",
    uf: params.get("uf") ?? "",
    cidade: params.get("cidade") ?? "",
  };
}
