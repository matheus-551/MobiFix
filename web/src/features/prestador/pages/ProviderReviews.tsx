"use client";

import { EmptyState } from "@/features/cliente/components/StateViews";
import { FeatureUnavailable, PageTitle } from "../components/ProviderUi";

const STARS = [5, 4, 3, 2, 1] as const;

export default function ProviderReviews() {
  return (
    <>
      <PageTitle title="Avaliações Recebidas da Oficina" />
      <FeatureUnavailable feature="avaliações" />

      <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm" aria-labelledby="nota-media">
          <h2 id="nota-media" className="text-xs font-semibold text-gray-500">Nota Média da Oficina</h2>
          <p className="mt-3 text-4xl font-bold text-gray-900">—</p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="distribuicao">
          <h2 id="distribuicao" className="mb-4 text-xs font-semibold text-gray-500">Distribuição de Avaliações</h2>
          <ul className="space-y-2">
            {STARS.map((stars) => (
              <li key={stars} className="flex items-center gap-3 text-xs text-gray-500">
                <span className="w-16">{stars} {stars === 1 ? "estrela" : "estrelas"}</span>
                <span aria-hidden className="h-2 flex-1 rounded-full bg-gray-100" />
                <span className="w-6 text-right">—</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="recentes">
        <h2 id="recentes" className="mb-4 text-sm font-bold text-gray-900">Avaliações Recentes dos Clientes</h2>
        <EmptyState title="Sem avaliações para exibir">Os comentários dos clientes aparecerão aqui.</EmptyState>
      </section>
    </>
  );
}
