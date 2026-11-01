"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { RatingSummary } from "../types";

/** Cinco estrelas somente leitura (arredonda para a estrela inteira mais próxima). */
export function StarRow({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Nota ${value.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={`${className} ${n <= filled ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
      ))}
    </span>
  );
}

/** Nota média + quantidade, ou aviso de que ainda não há avaliações. */
export function RatingLine({ rating, loading }: { rating?: RatingSummary; loading?: boolean }) {
  if (loading) return <span className="h-4 w-28 animate-pulse rounded bg-gray-100" aria-hidden />;
  if (!rating) return <span className="text-xs text-gray-400">Sem avaliações ainda</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star aria-hidden className="h-4 w-4 fill-amber-400 text-amber-400" />
      <strong className="font-bold text-gray-900">{rating.average.toFixed(1)}</strong>
      <span className="text-xs text-gray-400">
        ({rating.count} {rating.count === 1 ? "avaliação" : "avaliações"})
      </span>
    </span>
  );
}

/** Seletor de 1 a 5 estrelas acessível (radio group). */
export function StarInput({ value, onChange, disabled }: { value: number; onChange: (value: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label="Avaliação de uma a cinco estrelas" className="flex justify-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
          disabled={disabled}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed"
        >
          <Star aria-hidden className={`h-8 w-8 transition ${n <= shown ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  );
}
