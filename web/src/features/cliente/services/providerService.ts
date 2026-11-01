import { apiRequest } from "@/shared/lib/api/http";
import type { AvailableSlot, ProviderFilters, ProviderPage, PublicProvider } from "../types";

/** `GET /api/v1/prestadores` — filtros aceitos pela API: tipoVeiculoId, especialidadeId, uf, cidade, page, size. */
export function searchProviders(filters: ProviderFilters, page: number, size: number): Promise<ProviderPage> {
  return apiRequest<ProviderPage>("/prestadores", {
    query: {
      tipoVeiculoId: filters.tipoVeiculoId,
      especialidadeId: filters.especialidadeId,
      uf: filters.uf,
      cidade: filters.cidade?.trim(),
      page,
      size,
    },
  });
}

/** `GET /api/v1/prestadores/{id}` */
export function getProvider(id: string): Promise<PublicProvider> {
  return apiRequest<PublicProvider>(`/prestadores/${encodeURIComponent(id)}`);
}

/**
 * `GET /api/v1/prestadores/{id}/horarios?inicio&fim` — horários abertos (não bloqueados, no futuro e com
 * vagas) no período. É a única fonte de disponibilidade da API; o período máximo é de 366 dias.
 */
export function listAvailableSlots(providerId: string, inicio: string, fim: string): Promise<AvailableSlot[]> {
  return apiRequest<AvailableSlot[]>(`/prestadores/${encodeURIComponent(providerId)}/horarios`, {
    query: { inicio, fim },
  });
}
