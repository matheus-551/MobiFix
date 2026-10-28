import type { Specialty, VehicleType } from "../types/domain";

export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const VEHICLE_TYPES: readonly VehicleType[] = [
  { id: "car", name: "Carro" },
  { id: "motorcycle", name: "Moto" },
  { id: "truck", name: "Caminhão" },
  { id: "van", name: "Van" },
  { id: "bus", name: "Ônibus" },
];

export const SPECIALTIES: readonly Specialty[] = [
  { id: "general-mechanics", name: "Mecânica geral", active: true },
  { id: "brakes", name: "Freios", active: true },
  { id: "suspension", name: "Suspensão e direção", active: true },
  { id: "electrical", name: "Elétrica e injeção", active: true },
  { id: "diagnostics", name: "Diagnóstico", active: true },
  { id: "air-conditioning", name: "Ar-condicionado", active: true },
  { id: "diesel", name: "Diesel e pesados", active: true },
  { id: "tires-alignment", name: "Pneus e alinhamento", active: true },
  { id: "bodywork", name: "Funilaria e pintura", active: true },
  { id: "oil-change", name: "Troca de óleo e revisão", active: true },
];
