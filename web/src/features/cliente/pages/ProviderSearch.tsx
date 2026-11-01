"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { routes } from "@/routes";
import { Button } from "@/shared/components/Button";
import { useAsync } from "@/shared/hooks/useAsync";
import { getFriendlyError } from "@/shared/lib/api/http";
import { useClient } from "../context/ClientContext";
import { EMPTY_FILTERS, ProviderFiltersForm, filtersToParams, type FilterValues } from "../components/ProviderFiltersForm";
import { ProviderCard, ProviderCardSkeleton } from "../components/ProviderCard";
import { EmptyState, ErrorState } from "../components/StateViews";
import { listSpecialties, listVehicleTypes } from "../services/catalogService";
import { searchProviders } from "../services/providerService";
import { getProviderRatings } from "../services/reviewService";

const NEARBY_COUNT = 3;

export default function ProviderSearch() {
  const router = useRouter();
  const { profile } = useClient();
  const [edited, setEdited] = useState<FilterValues | null>(null);
  // Enquanto o cliente não mexe nos filtros, a UF do cadastro é a sugestão de localização.
  const filters: FilterValues = edited ?? { ...EMPTY_FILTERS, uf: profile?.state ?? "" };

  const catalogs = useAsync(() => Promise.all([listVehicleTypes(), listSpecialties()]), "catalogs");
  const [vehicleTypes, specialties] = catalogs.data ?? [[], []];

  // "Prestadores perto de você": primeiros resultados da UF do cliente (a API filtra por UF/cidade, não por distância).
  const uf = profile?.state ?? "";
  const nearby = useAsync(
    async () => {
      const page = await searchProviders({ uf: uf || undefined }, 0, NEARBY_COUNT);
      const ratings = await getProviderRatings(page.content.map((item) => item.id)).catch(() => ({}));
      return { page, ratings };
    },
    `nearby:${uf}`,
    profile !== null,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`${routes.clientResults}?${filtersToParams(filters).toString()}`);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Buscar Prestadores</h1>
        <p className="mt-1 text-sm text-gray-500">Filtre os melhores profissionais para seu atendimento.</p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        {catalogs.error !== null && (
          <div className="mb-4">
            <ErrorState message={getFriendlyError(catalogs.error)} onRetry={catalogs.reload} />
          </div>
        )}
        <ProviderFiltersForm
          values={filters}
          onChange={setEdited}
          vehicleTypes={vehicleTypes}
          specialties={specialties}
          disabled={catalogs.loading}
        />
        <p className="mt-3 text-xs text-gray-400">
          A API filtra por tipo de veículo, especialidade, estado e cidade. Avaliação mínima ainda não está disponível.
        </p>
        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <div className="sm:w-40">
            <Button variant="secondary" onClick={() => setEdited(EMPTY_FILTERS)}>
              Limpar Filtros
            </Button>
          </div>
          <div className="sm:w-56">
            <Button type="submit">
              <Search aria-hidden className="h-4 w-4" />
              Buscar Prestadores
            </Button>
          </div>
        </div>
      </form>

      <section aria-labelledby="perto">
        <h2 id="perto" className="mb-4 text-base font-bold text-gray-900">
          {uf ? `Prestadores em ${uf}` : "Prestadores"}
        </h2>
        {nearby.error !== null ? (
          <ErrorState message={getFriendlyError(nearby.error)} onRetry={nearby.reload} />
        ) : nearby.loading || !nearby.data ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: NEARBY_COUNT }, (_, index) => (
              <ProviderCardSkeleton key={index} />
            ))}
          </div>
        ) : nearby.data.page.content.length === 0 ? (
          <EmptyState title="Nenhum prestador cadastrado nesta região">
            Use os filtros acima para ampliar a busca.
          </EmptyState>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {nearby.data.page.content.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} rating={nearby.data?.ratings[provider.id]} />
              ))}
            </div>
            {nearby.data.page.totalElements > NEARBY_COUNT && (
              <p className="mt-4 text-sm">
                <Link href={`${routes.clientResults}?${uf ? `uf=${uf}` : ""}`} className="font-semibold text-orange-500 hover:underline">
                  Ver todos os {nearby.data.page.totalElements} prestadores
                </Link>
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
