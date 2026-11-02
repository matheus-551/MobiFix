export const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/** Mínimo de 8 caracteres, com ao menos uma letra e um número. */
export const senhaForte = (s: string) => s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s);

export const telefoneValido = (t: string) => {
  const n = t.replace(/\D/g, '').length;
  return n === 10 || n === 11;
};

export function formatarTelefone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
