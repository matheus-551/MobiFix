import { routes } from "@/routes";
import type { UserRole } from "@/shared/types/domain";

/** Destino padrão de cada papel após autenticar. */
export function homeForRole(role: UserRole): string {
  return role === "provider" ? routes.providerHome : routes.clientHome;
}