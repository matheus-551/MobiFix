"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAsync } from "@/shared/hooks/useAsync";
import { getFriendlyError } from "@/shared/lib/api/http";
import { listAvailableSlots } from "../../services/providerService";
import { formatTime, isFuture, monthLabel, pad, todayIso, toIsoDate } from "../../utils/dates";
import { ErrorState, LoadingBlock } from "../StateViews";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const DESCRIPTION_LIMIT = 500;

interface DateTimeStepProps {
  providerId: string;
  date: string | null;
  slotId: string | null;
  description: string;
  onDateChange: (date: string) => void;
  onSlotChange: (slotId: string) => void;
  onDescriptionChange: (value: string) => void;
  dateError?: string;
  slotError?: string;
}

/** Etapas 3 e 4: calendário (dias com horários abertos na API) e horários do dia escolhido. */
export function DateTimeStep({
  providerId,
  date,
  slotId,
  description,
  onDateChange,
  onSlotChange,
  onDescriptionChange,
  dateError,
  slotError,
}: DateTimeStepProps) {
  const [cursor, setCursor] = useState(() => {
    const base = date ? new Date(`${date}T00:00:00`) : new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const today = todayIso();
  const todayDate = new Date();
  const isCurrentMonth = cursor.year === todayDate.getFullYear() && cursor.month === todayDate.getMonth();

  const firstDay = new Date(cursor.year, cursor.month, 1);
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const monthStart = isCurrentMonth ? today : toIsoDate(firstDay);
  const monthEnd = `${cursor.year}-${pad(cursor.month + 1)}-${pad(daysInMonth)}`;

  // Disponibilidade do mês: GET /prestadores/{id}/horarios?inicio&fim
  const month = useAsync(() => listAvailableSlots(providerId, monthStart, monthEnd), `month:${providerId}:${monthStart}:${monthEnd}`);
  const availableDays = new Set((month.data ?? []).filter((slot) => slot.vagasDisponiveis > 0).map((slot) => slot.data));

  // Horários do dia: nova consulta sempre que a data muda.
  const day = useAsync(() => listAvailableSlots(providerId, date as string, date as string), `day:${providerId}:${date}`, date !== null);
  const daySlots = (day.data ?? [])
    .filter((slot) => slot.vagasDisponiveis > 0 && isFuture(slot.data, formatTime(slot.horaInicio)))
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  function shiftMonth(delta: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  const cells: (number | null)[] = [...Array<null>(firstDay.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm" aria-labelledby="etapa-data">
        <h2 id="etapa-data" className="mb-4 text-base font-bold text-gray-900">
          3. Selecione a Data
        </h2>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800" aria-live="polite">
            {monthLabel(cursor.year, cursor.month)}
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              aria-label="Mês anterior"
              disabled={isCurrentMonth}
              onClick={() => shiftMonth(-1)}
              className="rounded border border-gray-200 p-1 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              <ChevronLeft aria-hidden className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => shiftMonth(1)}
              className="rounded border border-gray-200 p-1 text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-2 text-center" role="group" aria-label={`Datas de ${monthLabel(cursor.year, cursor.month)}`} aria-busy={month.loading}>
          {WEEKDAYS.map((label, index) => (
            <span key={index} className="text-[11px] font-semibold text-gray-400" aria-hidden>
              {label}
            </span>
          ))}
          {cells.map((value, index) => {
            if (value === null) return <span key={`blank-${index}`} />;
            const iso = `${cursor.year}-${pad(cursor.month + 1)}-${pad(value)}`;
            const available = iso >= today && availableDays.has(iso);
            const selected = iso === date;
            return (
              <button
                key={iso}
                type="button"
                disabled={!available}
                aria-pressed={selected}
                aria-label={`${value} de ${monthLabel(cursor.year, cursor.month)}${available ? "" : " (indisponível)"}`}
                onClick={() => onDateChange(iso)}
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                  selected
                    ? "bg-orange-500 font-bold text-white"
                    : available
                      ? "text-gray-900 hover:bg-orange-50"
                      : "cursor-not-allowed bg-gray-50 text-gray-300"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>

        {month.loading && <LoadingBlock label="Consultando disponibilidade..." />}
        {month.error !== null && (
          <div className="mt-3">
            <ErrorState message={getFriendlyError(month.error)} onRetry={month.reload} />
          </div>
        )}
        {!month.loading && month.error === null && availableDays.size === 0 && (
          <p className="mt-3 text-center text-xs text-gray-500">Este prestador não tem horários abertos neste mês. Tente o próximo.</p>
        )}
        {dateError && (
          <p role="alert" className="mt-3 text-xs text-red-600">
            {dateError}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm" aria-labelledby="etapa-horario">
        <h2 id="etapa-horario" className="mb-4 text-base font-bold text-gray-900">
          4. Selecione o Horário
        </h2>

        {date === null ? (
          <p className="text-sm text-gray-500">Escolha uma data no calendário para ver os horários.</p>
        ) : day.loading ? (
          <LoadingBlock label="Consultando horários..." />
        ) : day.error !== null ? (
          <ErrorState message={getFriendlyError(day.error)} onRetry={day.reload} />
        ) : daySlots.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Não há horários disponíveis nesta data. Escolha outro dia.</p>
        ) : (
          <div role="radiogroup" aria-label="Horários disponíveis" className="flex flex-wrap gap-2">
            {daySlots.map((slot) => {
              const selected = slot.id === slotId;
              return (
                <button
                  key={slot.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSlotChange(slot.id)}
                  className={`rounded-md border px-3.5 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                    selected ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 bg-gray-50 text-gray-800 hover:border-orange-300"
                  }`}
                >
                  {formatTime(slot.horaInicio)}
                </button>
              );
            })}
          </div>
        )}
        {slotError && (
          <p role="alert" className="mt-3 text-xs text-red-600">
            {slotError}
          </p>
        )}

        <div className="mt-5">
          <label htmlFor="descricao-problema" className="mb-1.5 block text-xs font-semibold text-gray-700">
            Descrição do problema (opcional)
          </label>
          <textarea
            id="descricao-problema"
            rows={4}
            maxLength={DESCRIPTION_LIMIT}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Ex.: Gostaria de verificar barulho metálico nas rodas dianteiras ao passar por lombadas..."
            className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
          <p className="mt-1 text-right text-[11px] text-gray-400">
            {description.length}/{DESCRIPTION_LIMIT}
          </p>
        </div>
      </section>
    </div>
  );
}
