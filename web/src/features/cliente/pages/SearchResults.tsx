"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { routes } from "@/routes";
import { Button } from "@/shared/components/Button";
import { useAsync } from "@/shared/hooks/useAsync";
import { getFriendlyError } from "@/shared/lib/api/http";
import { ProviderFiltersForm, filtersToParams, paramsToFilters, type FilterValues } from "../components/ProviderFiltersForm";
import { Pagination } from "../components/Pagination";
import { ProviderCard, ProviderCardSkeleton } from "../components/ProviderCard";
import { EmptyState, ErrorState, LINK_BUTTON_SECONDARY } from "../components/StateViews";
import { listSpecialties, listVehicleTypes } from "../services/catalogService";
import { searchProviders } from "../services/providerService";
import { getProviderRatings } from "../services/reviewService";
import type { ProviderFilters, ProviderPage, PublicProvider } from "../types";

const PAGE_SIZE = 12;
/** Máximo aceito pela API em `size`; usado na busca por texto, que é filtrada no navegador. */
const TEXT_SEARCH_SIZE = 100;

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function matchesText(provider: PublicProvider, text: string): boolean {
  const haystack = normalize(
    [provider.nome, provider.descricao ?? "", provider.cidade, ...provider.especialidades.map((item) => item.nome)].join(" "),
  );
  return normalize(text)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export default function SearchResults() {
  const router = useRouter();
  const params = useSearchParams();
  const queryString = params.toString();
  const text = params.get("q")?.trim() ?? "";
  const page = Math.max(0, Number.parseInt(params.get("page") ?? "0", 10) || 0);

  const [edited, setEdited] = useState<{ source: string; values: FilterValues } | null>(null);
  const filterValues = edited?.source === queryString ? edited.values : paramsToFilters(params);

  const catalogs = useAsync(() => Promise.all([listVehicleTypes(), listSpecialties()]), "catalogs");
  const [vehicleTypes, specialties] = catalogs.data ?? [[], []];

  const apiFilters = useMemo<ProviderFilters>(() => {
    const filters = paramsToFilters(new URLSearchParams(queryString));
    return {
      tipoVeiculoId: filters.tipoVeiculoId ? Number(filters.tipoVeiculoId) : undefined,
      especialidadeId: filters.especialidadeId ? Number(filters.especialidadeId) : undefined,
      uf: filters.uf || undefined,
      cidade: filters.cidade || undefined,
    };
  }, [queryString]);

  // Sem texto: paginação real na API. Com texto (a API não tem busca textual): traz até 100 e filtra localmente.
  const results = useAsync(
    async (): Promise<ProviderPage> => {
      if (!text) return searchProviders(apiFilters, page, PAGE_SIZE);
      const all = await searchProviders(apiFilters, 0, TEXT_SEARCH_SIZE);
      const matches = all.content.filter((provider) => matchesText(provider, text));
      return {
        content: matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
        page,
        size: PAGE_SIZE,
        totalElements: matches.length,
        totalPages: Math.max(1, Math.ceil(matches.length / PAGE_SIZE)),
      };
    },
    queryString,
  );

  const ratings = useAsync(
    () => getProviderRatings((results.data?.content ?? []).map((provider) => provider.id)),
    `ratings:${queryString}:${results.data?.content.length ?? "x"}`,
    results.data !== null,
  );

  function goTo(nextPage: number) {
    const next = new URLSearchParams(queryString);
    if (nextPage > 0) next.set("page", String(nextPage));
    else next.delete("page");
    router.push(`${routes.clientResults}?${next.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRefine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`${routes.clientResults}?${filtersToParams(filterValues, text).toString()}`);
  }

  const total = results.data?.totalElements ?? 0;
  const locationLabel = [params.get("cidade"), params.get("uf")].filter(Boolean).join(", ");
  const summary = [
    text && `“${text}”`,
    vehicleTypes.find((item) => String(item.id) === params.get("tipoVeiculoId"))?.nome,
    specialties.find((item) => String(item.id) === params.get("especialidadeId"))?.nome,
    locationLabel,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Resultados da Busca</h1>
        <p className="mt-1 text-sm text-gray-500" role="status">
          {results.loading
            ? "Buscando oficinas..."
            : results.error !== null
              ? "Não foi possível carregar os resultados."
              : total === 0
                ? "Nenhuma oficina encontrada"
                : `Mostrando ${results.data?.content.length} de ${total} ${total === 1 ? "oficina" : "oficinas"}${locationLabel ? ` em ${locationLabel}` : ""}`}
          {summary.length > 0 && !results.loading && <span className="text-gray-400"> · Filtros: {summary.join(" • ")}</span>}
        </p>
      </header>

      <details className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-gray-700">Refinar busca</summary>
        <form onSubmit={handleRefine} className="mt-4">
          <ProviderFiltersForm
            values={filterValues}
            onChange={(values) => setEdited({ source: queryString, values })}
            vehicleTypes={vehicleTypes}
            specialties={specialties}
          />
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <div className="sm:w-40">
              <Button variant="secondary" onClick={() => router.push(routes.clientResults)}>
                Limpar Filtros
              </Button>
            </div>
            <div className="sm:w-48">
              <Button type="submit">Aplicar</Button>
            </div>
          </div>
        </form>
      </details>

      {results.error !== null ? (
        <ErrorState message={getFriendlyError(results.error)} onRetry={results.reload} />
      ) : results.loading || !results.data ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <ProviderCardSkeleton key={index} />
          ))}
        </div>
      ) : results.data.content.length === 0 ? (
        <EmptyState
          title="Nenhum prestador encontrado"
          action={
            <Link href={routes.clientSearch} className={LINK_BUTTON_SECONDARY}>
              Alterar filtros
            </Link>
          }
        >
          Tente remover algum filtro ou buscar em outra cidade.
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {results.data.content.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                rating={ratings.data?.[provider.id]}
                ratingLoading={ratings.loading}
              />
            ))}
          </div>
          <Pagination page={results.data.page} totalPages={results.data.totalPages} onChange={goTo} />
        </>
      )}
    </div>
  );
}
