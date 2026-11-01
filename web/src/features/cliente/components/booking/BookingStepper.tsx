import { Check } from "lucide-react";

export const BOOKING_STEPS = ["Veículo", "Serviço", "Data", "Horário", "Confirmação"] as const;

/** `current` é a etapa ativa (1 a 5); as anteriores aparecem concluídas. */
export function BookingStepper({ current }: { current: number }) {
  return (
    <ol aria-label="Etapas do agendamento" className="flex items-center justify-between gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-6">
      {BOOKING_STEPS.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done || active ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              {done ? <Check aria-hidden className="h-3.5 w-3.5" /> : number}
            </span>
            <span className={`hidden text-xs font-semibold sm:inline ${done || active ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
            {number < BOOKING_STEPS.length && <span aria-hidden className={`mx-1 h-px flex-1 ${done ? "bg-orange-400" : "bg-gray-200"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
