import { Bike, Bus, Car, Truck, type LucideIcon } from "lucide-react";

/** Ícone aproximado a partir do nome do tipo de veículo do catálogo da API. */
export function vehicleTypeIcon(name: string): LucideIcon {
  const value = name.toLowerCase();
  if (value.includes("moto")) return Bike;
  if (value.includes("caminh")) return Truck;
  if (value.includes("ônibus") || value.includes("onibus")) return Bus;
  return Car;
}

export function VehicleTypeIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const Icon = vehicleTypeIcon(name);
  return <Icon aria-hidden className={className} />;
}
