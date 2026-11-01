/** Datas da agenda são `yyyy-MM-dd` (LocalDate da API); nunca passam por UTC para não mudar de dia. */

export function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function formatTime(value: string): string {
  return value.slice(0, 5);
}

export function formatDateBr(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

/** "Hoje, 15/10/2026", "Amanhã, 16/10/2026" ou apenas a data. */
export function formatRelativeDate(value: string): string {
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (value === toIsoDate(today)) return `Hoje, ${formatDateBr(value)}`;
  if (value === toIsoDate(tomorrow)) return `Amanhã, ${formatDateBr(value)}`;
  return formatDateBr(value);
}

export function monthLabel(year: number, monthIndex: number): string {
  const name = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(year, monthIndex, 1));
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

/** `true` se o par data/hora (local) ainda não passou. */
export function isFuture(date: string, time: string): boolean {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime() > Date.now();
}
