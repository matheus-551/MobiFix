"use client";

import { EmptyState } from "@/features/cliente/components/StateViews";
import { FeatureUnavailable, PageTitle } from "../components/ProviderUi";

const TABS = ["Pendentes", "Aprovadas", "Recusadas"] as const;

export default function ProviderRequests() {
  return (
    <>
      <PageTitle title="Solicitações de Agendamento" />
      <FeatureUnavailable feature="solicitações de agendamento (listar, aprovar e recusar)" />
      <div role="group" aria-label="Situação das solicitações" className="flex flex-wrap gap-2">
        {TABS.map((tab, index) => (
          <button
            key={tab}
            type="button"
            aria-pressed={index === 0}
            disabled
            className={`rounded-full px-4 py-1.5 text-xs font-semibold disabled:cursor-not-allowed ${
              index === 0 ? "bg-orange-500 text-white opacity-60" : "bg-white text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <EmptyState title="Nenhuma solicitação para exibir">As solicitações dos clientes aparecerão aqui para aprovação ou recusa.</EmptyState>
    </>
  );
}
