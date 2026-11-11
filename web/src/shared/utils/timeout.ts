/** Lançado quando uma operação demora mais que o limite e deixa de ser aguardada. */
export class TimeoutError extends Error {
  constructor(
    public readonly timeoutMs: number,
    message = "A operação demorou demais para responder.",
  ) {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Aguarda `promise` por no máximo `ms`. Passado o limite, rejeita com `TimeoutError` (a operação original
 * não é cancelada, apenas deixa de ser esperada) para a tela nunca ficar presa em "carregando".
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms, message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export interface TimeoutSignal {
  /** Repassar ao `fetch`: aborta quando o limite estoura ou quando o `parent` é abortado. */
  signal: AbortSignal;
  /** `true` somente se o abort foi causado pelo limite de tempo (e não pelo chamador). */
  readonly timedOut: boolean;
  /** Libera o temporizador e o listener; chamar sempre que a requisição terminar (inclusive a leitura do corpo). */
  clear: () => void;
}

/** Cria um `AbortSignal` que dispara após `ms`, encadeado ao `parent` opcional. */
export function createTimeoutSignal(ms: number, parent?: AbortSignal): TimeoutSignal {
  const controller = new AbortController();
  let timedOut = false;
  const onParentAbort = () => controller.abort();

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);

  if (parent) {
    if (parent.aborted) controller.abort();
    else parent.addEventListener("abort", onParentAbort, { once: true });
  }

  return {
    signal: controller.signal,
    get timedOut() {
      return timedOut;
    },
    clear() {
      clearTimeout(timer);
      parent?.removeEventListener("abort", onParentAbort);
    },
  };
}
