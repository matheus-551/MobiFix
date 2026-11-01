import type { Metadata } from "next";
import ProviderHistory from "@/features/prestador/pages/ProviderHistory";

export const metadata: Metadata = { title: "Histórico de atendimentos | MobiFix Pro" };

export default function Page() {
  return <ProviderHistory />;
}
