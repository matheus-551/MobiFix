/**
 * Interpreta uma variável de ambiente booleana. Aceita true/false, 1/0, yes/no, on/off e sim/não
 * (sem diferenciar maiúsculas). Vazio, ausente ou irreconhecível devolve `defaultValue`.
 */
export function parseBooleanFlag(value: string | undefined | null, defaultValue: boolean): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "on", "sim"].includes(normalized)) return true;
  if (["false", "0", "no", "off", "nao", "não"].includes(normalized)) return false;
  return defaultValue;
}
