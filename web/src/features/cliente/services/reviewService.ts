import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "@/shared/lib/firebase/client";
import { toDate } from "@/shared/utils/firestore";
import type { ClientAppointment, ProviderReview, RatingSummary } from "../types";

/**
 * Avaliações ficam no Firestore (`reviews/{appointmentId}`): a API ainda não possui o recurso.
 * O ID é o do agendamento, o que garante no máximo uma avaliação por atendimento.
 */

interface ReviewData {
  appointmentId: string;
  providerId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp | null;
}

function toReview(id: string, data: ReviewData): ProviderReview {
  return {
    id,
    appointmentId: data.appointmentId,
    providerId: data.providerId,
    clientName: data.clientName,
    rating: data.rating,
    comment: data.comment,
    createdAt: toDate(data.createdAt),
  };
}

const IN_QUERY_LIMIT = 30;

export async function listProviderReviews(providerId: string): Promise<ProviderReview[]> {
  const snapshot = await getDocs(query(collection(getDb(), "reviews"), where("providerId", "==", providerId)));
  return snapshot.docs
    .map((item) => toReview(item.id, item.data() as ReviewData))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export function summarize(reviews: readonly { rating: number }[]): RatingSummary | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return { average: total / reviews.length, count: reviews.length };
}

/** Nota média e quantidade por prestador, calculadas a partir das avaliações reais. */
export async function getProviderRatings(providerIds: string[]): Promise<Record<string, RatingSummary>> {
  const ids = [...new Set(providerIds)];
  const grouped: Record<string, { rating: number }[]> = {};
  for (let start = 0; start < ids.length; start += IN_QUERY_LIMIT) {
    const chunk = ids.slice(start, start + IN_QUERY_LIMIT);
    const snapshot = await getDocs(query(collection(getDb(), "reviews"), where("providerId", "in", chunk)));
    snapshot.docs.forEach((item) => {
      const data = item.data() as ReviewData;
      (grouped[data.providerId] ??= []).push({ rating: data.rating });
    });
  }
  const result: Record<string, RatingSummary> = {};
  for (const [providerId, reviews] of Object.entries(grouped)) {
    const summary = summarize(reviews);
    if (summary) result[providerId] = summary;
  }
  return result;
}

/** IDs dos agendamentos que o cliente já avaliou. */
export async function listReviewedAppointmentIds(clientId: string): Promise<string[]> {
  const snapshot = await getDocs(query(collection(getDb(), "reviews"), where("clientId", "==", clientId)));
  return snapshot.docs.map((item) => item.id);
}

export async function hasReview(appointmentId: string): Promise<boolean> {
  return (await getDoc(doc(getDb(), "reviews", appointmentId))).exists();
}

export interface NewReviewInput {
  appointment: ClientAppointment;
  clientName: string;
  rating: number;
  comment: string;
}

export async function submitReview({ appointment, clientName, rating, comment }: NewReviewInput): Promise<void> {
  await setDoc(doc(getDb(), "reviews", appointment.id), {
    appointmentId: appointment.id,
    providerId: appointment.providerId,
    clientId: appointment.clientId,
    clientName,
    rating,
    comment: comment.trim(),
    createdAt: serverTimestamp(),
  });
}
