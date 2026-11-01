"use client";

import { EmptyState } from "@/features/cliente/components/StateViews";
import { FeatureUnavailable, PageTitle, StatCard } from "../components/ProviderUi";

const COLUMNS = ["Cliente", "Veículo", "Serviço", "Data", "Valor", "Status", "Avaliação"] as const;

export default function ProviderHistory() {
  return (
    <>
      <PageTitle title="Histórico de Atendimentos" />
      <FeatureUnavailable feature="histórico de atendimentos" />

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Atendimentos" />
        <StatCard label="Receita do Mês" />
        <StatCard label="Taxa de Satisfação" />
        <StatCard label="Clientes Atendidos" />
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6" aria-label="Atendimentos">
        <div className="flex flex-wrap gap-3">
          <select disabled aria-label="Período" className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
            <option>Período: últimos 30 dias</option>
          </select>
          <select disabled aria-label="Status" className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
            <option>Status: todos</option>
          </select>
          <input
            disabled
            type="search"
            aria-label="Buscar no histórico"
            placeholder="Buscar..."
            className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500">
                {COLUMNS.map((column) => (
                  <th key={column} scope="col" className="px-3 py-2">{column}</th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
        <EmptyState title="Nenhum atendimento para exibir">Os atendimentos concluídos aparecerão aqui.</EmptyState>
      </section>
    </>
  );
}
