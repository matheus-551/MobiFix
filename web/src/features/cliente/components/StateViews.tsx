import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";

export function LoadingBlock({ label = "Carregando..." }: { label?: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
      <Loader2 aria-hidden className="h-4 w-4 animate-spin text-orange-500" />
      {label}
    </p>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="space-y-3">
      <Alert tone="error">{message}</Alert>
      {onRetry && (
        <div className="max-w-40">
          <Button variant="secondary" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}

/** Cartão de "carregando dados": o formato imita o conteúdo que vai aparecer. */
export function LoadingSkeleton({ label = "Carregando dados..." }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />
        <span aria-hidden className="flex-1 space-y-2">
          <span className="block h-3 w-2/5 animate-pulse rounded bg-gray-100" />
          <span className="block h-2.5 w-1/5 animate-pulse rounded bg-gray-100" />
        </span>
      </div>
      <span aria-hidden className="mt-5 block h-24 animate-pulse rounded-lg bg-gray-100" />
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
  icon,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  /** Ícone (lucide) mostrado dentro de um círculo laranja claro, acima do título. */
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-6 py-10 text-center shadow-sm">
      {icon && (
        <span aria-hidden className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
          {icon}
        </span>
      )}
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Link com aparência do botão primário (o `Button` do projeto renderiza <button>). */
export const LINK_BUTTON =
  "inline-flex h-10 items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2";

export const LINK_BUTTON_SECONDARY =
  "inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2";
