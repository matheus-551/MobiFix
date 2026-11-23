"use client";

import { useEffect, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle, type LucideIcon } from "lucide-react";

type DialogTone = "success" | "error" | "warning";

const TONES: Record<DialogTone, { Icon: LucideIcon; circle: string }> = {
  success: { Icon: CheckCircle2, circle: "bg-green-50 text-green-600" },
  error: { Icon: XCircle, circle: "bg-red-50 text-red-500" },
  warning: { Icon: AlertTriangle, circle: "bg-amber-50 text-amber-500" },
};

const BUTTON_BASE =
  "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const BUTTON_OUTLINE = `${BUTTON_BASE} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`;
const BUTTON_DANGER = `${BUTTON_BASE} bg-red-500 text-white hover:bg-red-600`;
const BUTTON_DARK = `${BUTTON_BASE} bg-gray-900 text-white hover:bg-black`;

interface DialogFrameProps {
  tone: DialogTone;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  /** Impede fechar por Esc/fundo enquanto uma operação está em andamento. */
  busy?: boolean;
  children: ReactNode;
}

function DialogFrame({ tone, title, description, onClose, busy = false, children }: DialogFrameProps) {
  const { Icon, circle } = TONES[tone];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Fechar" tabIndex={-1} disabled={busy} className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8">
        <span aria-hidden className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${circle}`}>
          <Icon className="h-6 w-6" />
        </span>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        <div className="mt-6 flex gap-3">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** "Deseja fazer isso?": pergunta antes de uma ação sem volta. O foco inicial fica em "Voltar" (opção segura). */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Voltar",
  loadingLabel = "Aguarde...",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <DialogFrame tone="warning" title={title} description={description} onClose={onCancel} busy={loading}>
      <button type="button" autoFocus onClick={onCancel} disabled={loading} className={BUTTON_OUTLINE}>
        {cancelLabel}
      </button>
      <button type="button" onClick={onConfirm} disabled={loading} aria-busy={loading || undefined} className={BUTTON_DANGER}>
        {loading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
        {loading ? loadingLabel : confirmLabel}
      </button>
    </DialogFrame>
  );
}

interface ResultDialogProps {
  tone: "success" | "error";
  title: string;
  description?: ReactNode;
  onClose: () => void;
  /** Só no erro: mostra o botão "Tente novamente". */
  onRetry?: () => void;
}

/** Resultado de uma operação: sucesso (botão "OK") ou erro ("Fechar" e, opcionalmente, "Tente novamente"). */
export function ResultDialog({ tone, title, description, onClose, onRetry }: ResultDialogProps) {
  return (
    <DialogFrame tone={tone} title={title} description={description} onClose={onClose}>
      {tone === "success" ? (
        <button type="button" autoFocus onClick={onClose} className={BUTTON_DARK}>
          OK
        </button>
      ) : (
        <>
          <button type="button" autoFocus={!onRetry} onClick={onClose} className={BUTTON_OUTLINE}>
            Fechar
          </button>
          {onRetry && (
            <button type="button" autoFocus onClick={onRetry} className={BUTTON_DANGER}>
              Tente novamente
            </button>
          )}
        </>
      )}
    </DialogFrame>
  );
}
