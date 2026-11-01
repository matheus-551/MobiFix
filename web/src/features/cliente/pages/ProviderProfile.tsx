"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { routes } from "@/routes";
import { useAsync } from "@/shared/hooks/useAsync";
import { ApiError, getFriendlyError } from "@/shared/lib/api/http";
import { ProviderCover } from "../components/ProviderCard";
import { StarRow } from "../components/StarRating";
import { EmptyState, ErrorState, LINK_BUTTON, LINK_BUTTON_SECONDARY, LoadingBlock } from "../components/StateViews";
import { getProvider } from "../services/providerService";
import { listProviderReviews, summarize } from "../services/reviewService";
import type { PublicProvider } from "../types";
import { VehicleTypeIcon } from "../utils/vehicleIcons";

type Tab = "servicos" | "avaliacoes" | "sobre";
const TABS: { id: Tab; label: string }[] = [
  { id: "servicos", label: "Serviços" },
  { id: "avaliacoes", label: "Avaliações" },
  { id: "sobre", label: "Sobre" },
];

function bookingHref(providerId: string, specialtyIds: number[]): string {
  const params = new URLSearchParams({ prestador: providerId });
  if (specialtyIds.length > 0) params.set("esp", specialtyIds.join(","));
  return `${routes.clientBooking}?${params.toString()}`;
}

function ProfileContent({ provider }: { provider: PublicProvider }) {
  const [tab, setTab] = useState<Tab>("servicos");
  const [selected, setSelected] = useState<number[]>([]);
  const reviews = useAsync(() => listProviderReviews(provider.id), `reviews:${provider.id}`);
  const rating = reviews.data ? (summarize(reviews.data) ?? undefined) : undefined;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${provider.nome}, ${provider.cidade}, ${provider.uf}`)}`;

  function toggle(id: number) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="space-y-6">
      <Link href={routes.clientSearch} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-500">
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
        Voltar à busca
      </Link>

      <header className="overflow-hidden rounded-xl bg-gray-900">
        <ProviderCover className="h-32 sm:h-40" />
        <div className="space-y-2 bg-gray-900 px-5 pb-5 text-white">
          <h1 className="text-2xl font-bold">{provider.nome}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-200">
            {rating ? (
              <span className="inline-flex items-center gap-2">
                <StarRow value={rating.average} />
                <strong>{rating.average.toFixed(1)}</strong>
                <span className="text-gray-400">
                  ({rating.count} {rating.count === 1 ? "avaliação" : "avaliações"})
                </span>
              </span>
            ) : (
              <span className="text-gray-400">{reviews.loading ? "Carregando avaliações..." : "Sem avaliações ainda"}</span>
            )}
            <span className="inline-flex items-center gap-1 text-gray-300">
              <MapPin aria-hidden className="h-3.5 w-3.5" />
              {provider.cidade}, {provider.uf}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section aria-label="Detalhes do prestador">
          <div role="tablist" aria-label="Seções do perfil" className="mb-4 flex gap-6 border-b border-gray-200">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={`-mb-px border-b-2 pb-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                  tab === id ? "border-orange-500 text-orange-500" : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "servicos" && (
            <div role="tabpanel" id="panel-servicos" aria-labelledby="tab-servicos" className="space-y-3">
              {provider.especialidades.length === 0 ? (
                <EmptyState title="Este prestador ainda não informou serviços" />
              ) : (
                provider.especialidades.map((item) => {
                  const added = selected.includes(item.id);
                  return (
                    <article key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{item.nome}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">Valor e duração a combinar com a oficina.</p>
                      </div>
                      <button
                        type="button"
                        aria-pressed={added}
                        onClick={() => toggle(item.id)}
                        className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                          added ? "border-orange-500 bg-orange-500 text-white" : "border-orange-400 text-orange-500 hover:bg-orange-50"
                        }`}
                      >
                        {added ? "Adicionado" : "Adicionar"}
                      </button>
                    </article>
                  );
                })
              )}
              <p className="text-xs text-gray-400">
                A API ainda não publica preço nem duração por serviço; os serviços listados são as especialidades cadastradas pelo prestador.
              </p>
            </div>
          )}

          {tab === "avaliacoes" && (
            <div role="tabpanel" id="panel-avaliacoes" aria-labelledby="tab-avaliacoes" className="space-y-3">
              {reviews.loading ? (
                <LoadingBlock />
              ) : reviews.error !== null ? (
                <ErrorState message={getFriendlyError(reviews.error)} onRetry={reviews.reload} />
              ) : !reviews.data || reviews.data.length === 0 ? (
                <EmptyState title="Ainda não há avaliações">Seja o primeiro a avaliar depois de um atendimento concluído.</EmptyState>
              ) : (
                reviews.data.map((review) => (
                  <article key={review.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <StarRow value={review.rating} />
                        <span className="text-xs font-semibold text-gray-800">{review.clientName}</span>
                      </div>
                      {review.createdAt && (
                        <time className="text-xs text-gray-400" dateTime={review.createdAt.toISOString()}>
                          {review.createdAt.toLocaleDateString("pt-BR")}
                        </time>
                      )}
                    </div>
                    {review.comment && <p className="mt-2 text-sm text-gray-600">{review.comment}</p>}
                  </article>
                ))
              )}
            </div>
          )}

          {tab === "sobre" && (
            <div role="tabpanel" id="panel-sobre" aria-labelledby="tab-sobre" className="space-y-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Sobre a oficina</h3>
                <p className="mt-1 text-sm text-gray-700">{provider.descricao?.trim() || "O prestador ainda não adicionou uma descrição."}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Localização</h3>
                <p className="mt-1 text-sm text-gray-700">
                  {provider.cidade}, {provider.uf}
                </p>
                <p className="text-xs text-gray-400">O endereço completo não é exposto pela API pública.</p>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Especialidades</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {provider.especialidades.map((item) => (
                    <li key={item.id} className="rounded bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                      {item.nome}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Tipos de veículos atendidos</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {provider.tiposVeiculo.map((item) => (
                    <li key={item.id} className="inline-flex items-center gap-1.5 rounded bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                      <VehicleTypeIcon name={item.nome} className="h-3.5 w-3.5" />
                      {item.nome}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4" aria-label="Agendamento">
          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900">Pronto para agendar?</h2>
            <p className="mt-1 text-xs text-gray-500">
              Solicite o agendamento em poucos minutos escolhendo o melhor dia e horário para você.
            </p>
            {selected.length > 0 && (
              <p className="mt-2 text-xs font-semibold text-orange-600">
                {selected.length} {selected.length === 1 ? "serviço selecionado" : "serviços selecionados"}
              </p>
            )}
            <Link href={bookingHref(provider.id, selected)} className={`${LINK_BUTTON} mt-4 w-full`}>
              Solicitar Agendamento
            </Link>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Veículos atendidos</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {provider.tiposVeiculo.map((item) => (
                <li key={item.id} title={item.nome} className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600">
                  <VehicleTypeIcon name={item.nome} />
                  {item.nome}
                </li>
              ))}
            </ul>
            <h2 className="mt-5 text-[11px] font-bold uppercase tracking-wide text-gray-500">Localização</h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-700">
              <MapPin aria-hidden className="h-4 w-4 text-orange-500" />
              {provider.cidade}, {provider.uf}
            </p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={`${LINK_BUTTON_SECONDARY} mt-3 w-full`}>
              Ver no mapa
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function ProviderProfile() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const provider = useAsync(() => getProvider(id), `provider:${id}`, id !== "");

  if (!id) {
    return (
      <EmptyState title="Prestador não informado" action={<Link href={routes.clientSearch} className={LINK_BUTTON}>Buscar prestadores</Link>} />
    );
  }
  if (provider.loading) return <LoadingBlock label="Carregando perfil..." />;
  if (provider.error !== null) {
    const notFound = provider.error instanceof ApiError && (provider.error.status === 404 || provider.error.status === 400);
    return notFound ? (
      <EmptyState title="Prestador não encontrado" action={<Link href={routes.clientSearch} className={LINK_BUTTON}>Voltar à busca</Link>}>
        Este perfil não existe ou não está mais disponível.
      </EmptyState>
    ) : (
      <ErrorState message={getFriendlyError(provider.error)} onRetry={provider.reload} />
    );
  }
  return provider.data ? <ProfileContent provider={provider.data} /> : null;
}
