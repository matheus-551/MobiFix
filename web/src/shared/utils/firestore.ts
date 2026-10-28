import type { Timestamp } from "firebase/firestore";

/** Converte o Timestamp do Firestore (ou null, enquanto o serverTimestamp está pendente) em Date. */
export function toDate(value: Timestamp | null | undefined): Date | null {
  return value ? value.toDate() : null;
}
