import { Check } from "lucide-react";
import { PROVIDER_STEPS } from "../models/registration";

export function ProviderStepper({ currentIndex }: { currentIndex: number }) {
  return (
    <nav aria-label="Progresso do cadastro" className="mb-8">
      <p className="mb-3 text-center text-xs text-gray-500 sm:hidden">
        Etapa {currentIndex + 1} de {PROVIDER_STEPS.length}: {PROVIDER_STEPS[currentIndex].label}
      </p>
      <ol className="flex items-center justify-between gap-1">
        {PROVIDER_STEPS.map((step, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          return (
            <li
              key={step.id}
              aria-current={current ? "step" : undefined}
              className="flex flex-1 flex-col items-center gap-1.5 text-center sm:flex-row sm:justify-center sm:gap-1.5"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done || current ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {done ? <Check aria-hidden className="h-3.5 w-3.5" /> : `0${index + 1}`}
              </span>
              <span
                className={`hidden text-[11px] sm:inline ${current ? "font-semibold text-gray-900" : "text-gray-400"}`}
              >
                {step.label}
                <span className="sr-only">{done ? " (concluída)" : current ? " (etapa atual)" : ""}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
