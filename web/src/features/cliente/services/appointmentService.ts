import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "@/shared/lib/firebase/client";
import { toDate } from "@/shared/utils/firestore";
import type { AppointmentStatus, ClientAppointment } from "../types";

/**
 * Agendamentos ficam no Firestore (`appointments/{uid}_{slotId}`): a API ainda não possui o recurso.
 * Este arquivo é o único ponto de acesso; quando a API oferecer o endpoint basta reimplementá-lo aqui.
 * O ID determinístico impede solicitações duplicadas para o mesmo cliente e horário (cliques repetidos).
 */

export class DuplicateAppointmentError extends Error {
  constructor() {
    super("Você já possui uma solicitação para este horário. Consulte “Meus Agendamentos”.");
    this.name = "DuplicateAppointmentError";
  }
}

interface AppointmentData {
  clientId: string;
  providerId: string;
  providerName: string;
  vehicleId: string;
  vehicleLabel: string;
  specialtyIds: number[];
  specialtyNames: string[];
  slotId: string;
  date: string;
  time: string;
  description: string;
  status: AppointmentStatus;
  createdAt: Timestamp | null;
}

function toAppointment(id: string, data: AppointmentData): ClientAppointment {
  return { ...data, id, createdAt: toDate(data.createdAt) };
}

export type NewAppointmentInput = Omit<ClientAppointment, "id" | "status" | "createdAt">;

export async function createAppointment(input: NewAppointmentInput): Promise<string> {
  const id = `${input.clientId}_${input.slotId}`;
  const reference = doc(getDb(), "appointments", id);
  if ((await getDoc(reference)).exists()) throw new DuplicateAppointmentError();

  await setDoc(reference, {
    clientId: input.clientId,
    providerId: input.providerId,
    providerName: input.providerName,
    vehicleId: input.vehicleId,
    vehicleLabel: input.vehicleLabel,
    specialtyIds: input.specialtyIds,
    specialtyNames: input.specialtyNames,
    slotId: input.slotId,
    date: input.date,
    time: input.time,
    description: input.description.trim(),
    status: "requested",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
}

/** Do mais próximo para o mais distante no futuro e, depois, do mais recente para o mais antigo no passado. */
export async function listClientAppointments(clientId: string): Promise<ClientAppointment[]> {
  const snapshot = await getDocs(query(collection(getDb(), "appointments"), where("clientId", "==", clientId)));
  return snapshot.docs
    .map((item) => toAppointment(item.id, item.data() as AppointmentData))
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

export async function getClientAppointment(id: string): Promise<ClientAppointment | null> {
  const snapshot = await getDoc(doc(getDb(), "appointments", id));
  return snapshot.exists() ? toAppointment(snapshot.id, snapshot.data() as AppointmentData) : null;
}

/** Cancela apenas pelo cliente dono (as regras do Firestore restringem a mudança a `status: cancelled`). */
export async function cancelAppointment(id: string): Promise<void> {
  await updateDoc(doc(getDb(), "appointments", id), { status: "cancelled", updatedAt: serverTimestamp() });
}
