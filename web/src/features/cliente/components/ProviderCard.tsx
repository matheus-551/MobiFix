import Link from "next/link";
import { MapPin, Wrench } from "lucide-react";
import { routes } from "@/routes";
import type { PublicProvider, RatingSummary } from "../types";
import { RatingLine } from "./StarRating";

/** A API não fornece fotos: a capa é um painel neutro com ícone. */
export function ProviderCover({ className = "h-36" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 ${className}`}>
      <Wrench className="h-10 w-10 text-orange-400/80" />
    </div>
  );
}

const MAX_CHIPS = 2;

export function ProviderCard({
  provider,
  rating,
  ratingLoading,
  actionLabel = "Ver Perfil & Agendar",
}: {
  provider: PublicProvider;
  rating?: RatingSummary;
  ratingLoading?: boolean;
  actionLabel?: string;
}) {
  const extra = provider.especialidades.length - MAX_CHIPS;
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <ProviderCover />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="text-sm font-bold text-gray-900">{provider.nome}</h3>
        <ul className="flex flex-wrap gap-1.5" aria-label="Especialidades">
          {provider.especialidades.slice(0, MAX_CHIPS).map((item) => (
            <li key={item.id} className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
              {item.nome}
            </li>
          ))}
          {extra > 0 && <li className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">+{extra}</li>}
        </ul>
        <RatingLine rating={rating} loading={ratingLoading} />
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin aria-hidden className="h-3.5 w-3.5" />
          {provider.cidade}, {provider.uf}
        </p>
        <Link
          href={`${routes.clientProvider}?id=${encodeURIComponent(provider.id)}`}
          className="mt-auto inline-flex h-10 w-full items-center justify-center rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
        >
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}

export function ProviderCardSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="h-36 animate-pulse bg-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
        <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}
