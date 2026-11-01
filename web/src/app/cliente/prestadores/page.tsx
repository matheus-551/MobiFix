import type { Metadata } from "next";
import ProviderSearch from "@/features/cliente/pages/ProviderSearch";

export const metadata: Metadata = { title: "Buscar prestadores | MobiFix" };

export default function Page() {
  return <ProviderSearch />;
}
