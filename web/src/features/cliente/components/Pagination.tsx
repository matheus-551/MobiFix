/** Paginação controlada: `page` é zero-based, como na API. */
export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const first = Math.max(0, Math.min(page - 2, totalPages - 5));
  const last = Math.min(totalPages - 1, first + 4);
  const pages = Array.from({ length: last - first + 1 }, (_, index) => first + index);
  const base = "h-9 min-w-9 rounded-lg border px-3 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400";

  return (
    <nav aria-label="Paginação" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className={`${base} border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300`}
      >
        Anterior
      </button>
      {pages.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-current={value === page ? "page" : undefined}
          className={`${base} ${value === page ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
        >
          {value + 1}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className={`${base} border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300`}
      >
        Próximo
      </button>
    </nav>
  );
}
