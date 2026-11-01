import type { Metadata } from "next";
import ProviderReviews from "@/features/prestador/pages/ProviderReviews";

export const metadata: Metadata = { title: "Avaliações | MobiFix Pro" };

export default function Page() {
  return <ProviderReviews />;
}
