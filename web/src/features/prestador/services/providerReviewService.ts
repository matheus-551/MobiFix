import { listProviderReviews } from "@/features/cliente/services/reviewService";
import type { ProviderReview } from "@/features/cliente/types";
import { getMyApiProfile } from "./providerApiService";

/**
 * Avaliações recebidas pelo prestador logado. A API não possui avaliações: elas ficam no Firestore (`reviews`),
 * indexadas pelo ID do perfil do prestador na API (`GET /prestadores/me/perfil`, o mesmo `prestadorId` dos
 * agendamentos). Sem perfil na API ainda não há agendamentos nem avaliações.
 */
export async function listMyReviews(): Promise<ProviderReview[]> {
  const profile = await getMyApiProfile();
  return profile ? listProviderReviews(profile.id) : [];
}
