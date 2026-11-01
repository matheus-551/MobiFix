import type { ApiVehicle } from "../types";

export function vehicleLabel(vehicle: Pick<ApiVehicle, "marca" | "modelo" | "ano" | "placa">): string {
  const base = `${vehicle.marca} ${vehicle.modelo} (${vehicle.ano})`;
  return vehicle.placa ? `${base} • ${vehicle.placa}` : base;
}
