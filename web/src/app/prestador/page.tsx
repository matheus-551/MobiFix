import type { Metadata } from "next";
import ProviderHome from "@/features/prestador/pages/ProviderHome";

export const metadata: Metadata = { title: "Painel do prestador | MobiFix Pro" };

export default function Page() {
  return <ProviderHome />;
}
