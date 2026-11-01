import { CalendarDays, Car, CheckCircle2, CircleDollarSign, Clock, Wrench } from "lucide-react";
import type { ReactNode } from "react";

export interface BookingSummary {
  providerName: string;
  vehicle: string;
  services: string[];
  dateLabel: string;
  time: string;
  description: string;
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 text-sm last:border-b-0">
      <dt className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
        <span aria-hidden className="text-gray-400">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="text-right font-semibold text-gray-900">{children}</dd>
    </div>
  );
}

export function ConfirmStep({ summary }: { summary: BookingSummary }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="resumo">
      <div role="status" className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs font-medium text-green-800">
        <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0" />
        Quase lá! Revise as informações abaixo para confirmar sua reserva.
      </div>
      <h2 id="resumo" className="mb-2 text-base font-bold text-gray-900">
        Resumo do Agendamento
      </h2>
      <dl>
        <Row icon={<Wrench className="h-4 w-4" />} label="Prestador">
          {summary.providerName}
        </Row>
        <Row icon={<Car className="h-4 w-4" />} label="Veículo">
          {summary.vehicle}
        </Row>
        <Row icon={<Wrench className="h-4 w-4" />} label={summary.services.length > 1 ? "Serviços" : "Serviço"}>
          {summary.services.join(", ")}
        </Row>
        <Row icon={<CalendarDays className="h-4 w-4" />} label="Data & Horário">
          {summary.dateLabel} às {summary.time}
        </Row>
        <Row icon={<CircleDollarSign className="h-4 w-4" />} label="Valor Estimado">
          A combinar com a oficina
        </Row>
        {summary.description.trim() && (
          <Row icon={<Clock className="h-4 w-4" />} label="Informações adicionais">
            <span className="whitespace-pre-line font-normal text-gray-700">{summary.description.trim()}</span>
          </Row>
        )}
      </dl>
    </section>
  );
}
