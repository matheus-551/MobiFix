import { apiRequest } from "@/shared/lib/api/http";
import type { CatalogItem } from "../types";

/** `GET /api/v1/tipos-veiculo` */
export function listVehicleTypes(): Promise<CatalogItem[]> {
  return apiRequest<CatalogItem[]>("/tipos-veiculo");
}

/** `GET /api/v1/especialidades` */
export function listSpecialties(): Promise<CatalogItem[]> {
  return apiRequest<CatalogItem[]>("/especialidades");
}
