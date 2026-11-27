"use client";

import { useAsync } from "@/shared/hooks/useAsync";
import { getFriendlyError } from "@/shared/lib/api/http";
import { StarRow } from "@/features/cliente/components/StarRating";
import { EmptyState, ErrorState, LoadingBlock } from "@/features/cliente/components/StateViews";
import { summarize } from "@/features/cliente/services/reviewService";
import { PageTitle } from "../components/ProviderUi";
import { useProvider } from "../context/ProviderContext";
import { listMyReviews } from "../services/providerReviewService";

const STARS = [5, 4, 3, 2, 1] as const;
const RECENT_COUNT = 20;

export default function ProviderReviews() {
  const { uid } = useProvider();
  const reviews = useAsync(listMyReviews, `provider-reviews:${uid}`, uid !== "");
  const list = reviews.data ?? [];
  const summary = summarize(list);
  const countOf = (stars: number) => list.filter((item) => item.rating === stars).length;

  return (
    <>
      <PageTitle title="Avaliações Recebidas da Oficina" />
      {reviews.error !== null && <ErrorState message={getFriendlyError(reviews.error)} onRetry={reviews.reload} />}

      <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm" aria-labelledby="nota-media">
          <h2 id="nota-media" className="text-xs font-semibold text-gray-500">Nota Média da Oficina</h2>
          <p className="mt-3 text-4xl font-bold text-gray-900">{summary ? summary.average.toFixed(1) : "—"}</p>
          {summary && (
            <div className="mt-2 flex flex-col items-center gap-1">
              <StarRow value={summary.average} />
              <span className="text-xs text-gray-400">
                {summary.count} {summary.count === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="distribuicao">
          <h2 id="distribuicao" className="mb-4 text-xs font-semibold text-gray-500">Distribuição de Avaliações</h2>
          <ul className="space-y-2">
            {STARS.map((stars) => {
              const total = countOf(stars);
              return (
                <li key={stars} className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="w-16">{stars} {stars === 1 ? "estrela" : "estrelas"}</span>
                  <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <span className="block h-full rounded-full bg-amber-400" style={{ width: `${list.length ? (total / list.length) * 100 : 0}%` }} />
                  </span>
                  <span className="w-6 text-right">{summary ? total : "—"}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="recentes">
        <h2 id="recentes" className="mb-4 text-sm font-bold text-gray-900">Avaliações Recentes dos Clientes</h2>
        {reviews.loading ? (
          <LoadingBlock label="Carregando avaliações..." />
        ) : list.length === 0 ? (
          <EmptyState title="Sem avaliações para exibir">Os comentários dos clientes aparecerão aqui.</EmptyState>
        ) : (
          <ul className="divide-y divide-gray-100">
            {list.slice(0, RECENT_COUNT).map((review) => (
              <li key={review.id} className="space-y-1 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{review.clientName}</p>
                  <span className="text-xs text-gray-400">{review.createdAt ? new Intl.DateTimeFormat("pt-BR").format(review.createdAt) : ""}</span>
                </div>
                <StarRow value={review.rating} className="h-3.5 w-3.5" />
                {review.comment && <p className="whitespace-pre-line text-sm text-gray-600">{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
