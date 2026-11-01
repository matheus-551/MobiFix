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

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
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
