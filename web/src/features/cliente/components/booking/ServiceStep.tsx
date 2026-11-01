import { Check } from "lucide-react";
import type { CatalogItem } from "../../types";

/**
 * A API não possui serviços com preço/duração: as "especialidades" do prestador são os serviços
 * selecionáveis, e o valor é combinado diretamente com a oficina.
 */
export function ServiceStep({
  services,
  selectedIds,
  onToggle,
  error,
}: {
  services: CatalogItem[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  error?: string;
}) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm" aria-labelledby="etapa-servico">
      <h2 id="etapa-servico" className="mb-4 text-base font-bold text-gray-900">
        2. Selecione os Serviços
      </h2>
      {services.length === 0 ? (
        <p className="text-sm text-gray-500">Este prestador ainda não cadastrou serviços.</p>
      ) : (
        <ul className="space-y-3">
          {services.map((service) => {
            const checked = selectedIds.includes(service.id);
            return (
              <li key={service.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition focus-within:ring-2 focus-within:ring-orange-400 ${
                    checked ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => onToggle(service.id)} />
                  <span
                    aria-hidden
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      checked ? "border-orange-500 bg-orange-500 text-white" : "border-gray-300 bg-white"
                    }`}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900">{service.nome}</span>
                    <span className="block text-xs text-gray-500">Duração e valor a combinar com a oficina</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
        <span className="text-gray-500">Valor estimado</span>
        <span className="font-semibold text-gray-900">A combinar</span>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
