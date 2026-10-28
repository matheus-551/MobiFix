import { BRAZILIAN_STATES } from "../constants/catalog";
import { onlyDigits } from "../utils/format";

/** Cada validador devolve a mensagem de erro, ou `null` quando o valor é válido. */
export type FieldError = string | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function required(value: string, label: string): FieldError {
  return value.trim() ? null : `Informe ${label}.`;
}

export function validateName(value: string, label: string): FieldError {
  const trimmed = value.trim();
  if (!trimmed) return `Informe ${label}.`;
  if (trimmed.length < 2) return `${capitalize(label)} deve ter pelo menos 2 caracteres.`;
  if (trimmed.length > 60) return `${capitalize(label)} deve ter no máximo 60 caracteres.`;
  return null;
}

export function validateEmail(value: string): FieldError {
  const trimmed = value.trim();
  if (!trimmed) return "Informe seu e-mail.";
  return EMAIL_PATTERN.test(trimmed) ? null : "Informe um e-mail válido.";
}

export function validatePhone(value: string): FieldError {
  const digits = onlyDigits(value);
  if (!digits) return "Informe seu telefone.";
  if (digits.length < 10 || digits.length > 11) return "Informe o telefone com DDD.";
  if (/^(\d)\1+$/.test(digits)) return "Informe um telefone válido.";
  return null;
}

export function validateState(value: string): FieldError {
  if (!value) return "Selecione o estado.";
  return (BRAZILIAN_STATES as readonly string[]).includes(value) ? null : "Estado inválido.";
}

export function validateNewPassword(value: string): FieldError {
  if (!value) return "Crie uma senha.";
  if (value.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (value.length > 128) return "A senha deve ter no máximo 128 caracteres.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "A senha deve conter letras e números.";
  }
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): FieldError {
  if (!confirmation) return "Repita a senha.";
  return password === confirmation ? null : "As senhas não coincidem.";
}

export function validateAccepted(value: boolean): FieldError {
  return value ? null : "É necessário aceitar os Termos de Serviço e a Política de Privacidade.";
}

function allSame(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

function cpfIsValid(digits: string): boolean {
  if (digits.length !== 11 || allSame(digits)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
    const check = ((sum * 10) % 11) % 10;
    if (check !== Number(digits[length])) return false;
  }
  return true;
}

function cnpjIsValid(digits: string): boolean {
  if (digits.length !== 14 || allSame(digits)) return false;
  for (const length of [12, 13]) {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * weights[i];
    const remainder = sum % 11;
    const check = remainder < 2 ? 0 : 11 - remainder;
    if (check !== Number(digits[length])) return false;
  }
  return true;
}

export function validateTaxId(value: string, type: "cpf" | "cnpj"): FieldError {
  const digits = onlyDigits(value);
  if (!digits) return type === "cpf" ? "Informe o CPF." : "Informe o CNPJ.";
  if (type === "cpf") return cpfIsValid(digits) ? null : "CPF inválido.";
  return cnpjIsValid(digits) ? null : "CNPJ inválido.";
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Remove entradas nulas de um mapa de erros; um objeto vazio significa formulário válido. */
export function compactErrors<K extends string>(errors: Record<K, FieldError>): Partial<Record<K, string>> {
  const result: Partial<Record<K, string>> = {};
  for (const key of Object.keys(errors) as K[]) {
    const message = errors[key];
    if (message) result[key] = message;
  }
  return result;
}
