"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { ApiError, getFriendlyError } from "@/shared/lib/api/http";
import { useAsync } from "@/shared/hooks/useAsync";
import { EmptyState, ErrorState, LoadingBlock } from "@/features/cliente/components/StateViews";
import { formatDateBr, formatTime, pad, toIsoDate } from "@/features/cliente/utils/dates";
import { PageTitle } from "../components/ProviderUi";
import { createSlot, listMySlots, updateSlot } from "../services/providerApiService";
import type { ApiSlot } from "../types";

const DAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
const CONFIG_DAYS = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"] as const;
const HOURS = Array.from({ length: 17 }, (_, index) => index + 6); // 06h–22h
const CHUNK_SIZE = 8;

interface DayConfig {
  enabled: boolean;
  start: number;
  end: number;
}

/** Valores iniciais iguais à geração automática da API (seg–sex, 08h–18h, 3 vagas). */
const INITIAL_DAYS: DayConfig[] = [
  { enabled: true, start: 8, end: 18 },
  { enabled: true, start: 8, end: 18 },
  { enabled: true, start: 8, end: 18 },
  { enabled: true, start: 8, end: 18 },
  { enabled: true, start: 8, end: 18 },
  { enabled: false, start: 8, end: 12 },
];

function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function isPast(slotDate: string, time: string): boolean {
  return new Date(`${slotDate}T${formatTime(time)}:00`).getTime() <= Date.now();
}

type Feedback = { tone: "success" | "error" | "info"; text: string } | null;

export default function ProviderSchedule() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [days, setDays] = useState<DayConfig[]>(INITIAL_DAYS);
  const [capacity, setCapacity] = useState("3");
  const [saving, setSaving] = useState(false);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const dates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const from = toIsoDate(dates[0]);
  const to = toIsoDate(dates[6]);
  const { data: slots, error, loading, reload } = useAsync(() => listMySlots(from, to), from);

  function changeWeek(offset: number) {
    setFeedback(null);
    setWeekStart((current) => addDays(current, offset * 7));
  }

  function updateDay(index: number, patch: Partial<DayConfig>) {
    setDays((current) => current.map((day, position) => (position === index ? { ...day, ...patch } : day)));
  }

  async function toggleBlocked(slot: ApiSlot) {
    setBusySlot(slot.id);
    setFeedback(null);
    try {
      await updateSlot(slot.id, slot.capacidadeTotal, !slot.bloqueado);
      reload();
    } catch (failure) {
      setFeedback({ tone: "error", text: getFriendlyError(failure) });
    } finally {
      setBusySlot(null);
    }
  }

  async function handleSave() {
    setFeedback(null);
    const total = Number(capacity);
    if (capacity.trim() === "" || !Number.isInteger(total) || total < 0) {
      setFeedback({ tone: "error", text: "Informe um número inteiro de vagas, igual ou maior que zero." });
      return;
    }
    if (days.some((day) => day.enabled && day.start > day.end)) {
      setFeedback({ tone: "error", text: "O horário inicial não pode ser maior que o final." });
      return;
    }

    const current = slots ?? [];
    const operations: (() => Promise<unknown>)[] = [];
    CONFIG_DAYS.forEach((_, index) => {
      const date = toIsoDate(dates[index]);
      const daySlots = current.filter((slot) => slot.data === date);
      const wanted = new Set<string>();
      if (days[index].enabled) {
        for (let hour = days[index].start; hour <= days[index].end; hour += 1) wanted.add(`${pad(hour)}:00`);
      }
      wanted.forEach((time) => {
        if (isPast(date, time)) return;
        const existing = daySlots.find((slot) => formatTime(slot.horaInicio) === time);
        if (!existing) operations.push(() => createSlot(date, time, total));
        else if (existing.bloqueado || existing.capacidadeTotal !== total) operations.push(() => updateSlot(existing.id, total, false));
      });
      daySlots.forEach((slot) => {
        if (!wanted.has(formatTime(slot.horaInicio)) && !slot.bloqueado && !isPast(slot.data, slot.horaInicio)) {
          operations.push(() => updateSlot(slot.id, slot.capacidadeTotal, true));
        }
      });
    });

    if (operations.length === 0) {
      setFeedback({ tone: "info", text: "Nenhuma alteração necessária para esta semana." });
      return;
    }

    setSaving(true);
    let failures = 0;
    for (let start = 0; start < operations.length; start += CHUNK_SIZE) {
      const results = await Promise.allSettled(operations.slice(start, start + CHUNK_SIZE).map((run) => run()));
      failures += results.filter((result) => result.status === "rejected").length;
    }
    setSaving(false);
    reload();
    setFeedback(
      failures === 0
        ? { tone: "success", text: "Disponibilidade salva com sucesso." }
        : { tone: "error", text: `${failures} de ${operations.length} alterações não puderam ser salvas. Tente novamente.` },
    );
  }

  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <>
      <PageTitle title="Agenda e Disponibilidade" />
      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6" aria-labelledby="semana">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="semana" className="text-sm font-bold text-gray-900">Visualização Semanal</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button type="button" aria-label="Semana anterior" onClick={() => changeWeek(-1)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <ChevronLeft aria-hidden className="h-4 w-4" />
              </button>
              <span>{formatDateBr(from)} a {formatDateBr(to)}</span>
              <button type="button" aria-label="Próxima semana" onClick={() => changeWeek(1)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loading && <LoadingBlock label="Carregando agenda..." />}
          {notFound && (
            <Alert tone="info">
              Seu perfil profissional ainda não existe na API. Complete-o em{" "}
              <Link href={routes.providerProfile} className="font-semibold underline">Meu Perfil</Link> para gerenciar a agenda.
            </Alert>
          )}
          {error && !notFound && <ErrorState message={getFriendlyError(error)} onRetry={reload} />}
          {slots && slots.length === 0 && <EmptyState title="Sem horários nesta semana">Use a configuração ao lado para criar sua disponibilidade.</EmptyState>}
          {slots && slots.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
              {dates.map((date, index) => {
                const iso = toIsoDate(date);
                const daySlots = slots.filter((slot) => slot.data === iso).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
                return (
                  <div key={iso} className="rounded-xl border border-gray-100 p-2">
                    <p className="text-center text-xs font-bold text-gray-700">
                      {DAY_SHORT[index]} <span className="font-normal text-gray-400">{pad(date.getDate())}/{pad(date.getMonth() + 1)}</span>
                    </p>
                    <ul className="mt-2 space-y-1">
                      {daySlots.length === 0 && <li className="text-center text-[11px] text-gray-300">—</li>}
                      {daySlots.map((slot) => {
                        const past = isPast(slot.data, slot.horaInicio);
                        return (
                          <li key={slot.id}>
                            <button
                              type="button"
                              disabled={past || busySlot === slot.id}
                              onClick={() => void toggleBlocked(slot)}
                              aria-label={`${formatTime(slot.horaInicio)}, ${slot.bloqueado ? "bloqueado" : `${slot.capacidadeTotal} vagas`}. ${past ? "Horário passado" : slot.bloqueado ? "Liberar" : "Bloquear"}`}
                              className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                slot.bloqueado ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-700 hover:bg-green-100"
                              }`}
                            >
                              <span>{formatTime(slot.horaInicio)}</span>
                              <span>{slot.bloqueado ? "Bloq." : `${slot.capacidadeTotal} vg`}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-xs text-gray-500">Toque em um horário futuro para bloqueá-lo ou liberá-lo.</p>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6" aria-labelledby="config">
          <h2 id="config" className="mb-4 text-sm font-bold text-gray-900">Configurar Disponibilidade</h2>
          <ul className="space-y-3">
            {CONFIG_DAYS.map((label, index) => (
              <li key={label} className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={days[index].enabled}
                    onChange={(event) => updateDay(index, { enabled: event.target.checked })}
                    className="h-4 w-4 accent-orange-500"
                  />
                  {label}
                </label>
                <div className="flex items-center gap-2 pl-6 text-xs text-gray-500">
                  <select
                    aria-label={`${label}: início`}
                    value={days[index].start}
                    disabled={!days[index].enabled}
                    onChange={(event) => updateDay(index, { start: Number(event.target.value) })}
                    className="h-8 rounded-md border border-gray-200 bg-white px-2 disabled:bg-gray-50"
                  >
                    {HOURS.map((hour) => <option key={hour} value={hour}>{pad(hour)}:00</option>)}
                  </select>
                  <span aria-hidden>às</span>
                  <select
                    aria-label={`${label}: fim`}
                    value={days[index].end}
                    disabled={!days[index].enabled}
                    onChange={(event) => updateDay(index, { end: Number(event.target.value) })}
                    className="h-8 rounded-md border border-gray-200 bg-white px-2 disabled:bg-gray-50"
                  >
                    {HOURS.map((hour) => <option key={hour} value={hour}>{pad(hour)}:00</option>)}
                  </select>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <label htmlFor="vagas" className="mb-1.5 block text-xs font-semibold text-gray-700">Vagas por horário</label>
            <input
              id="vagas"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Aplica-se à semana exibida. Horários que já passaram não são alterados; dias desmarcados e horas fora do intervalo ficam bloqueados.
          </p>
          <div className="mt-4">
            <Button onClick={() => void handleSave()} loading={saving} loadingLabel="Salvando..." disabled={Boolean(error) || loading}>
              Salvar Disponibilidade
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
