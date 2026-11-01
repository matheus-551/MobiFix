import type { Metadata } from "next";
import ProviderRequests from "@/features/prestador/pages/ProviderRequests";

export const metadata: Metadata = { title: "Solicitações | MobiFix Pro" };

export default function Page() {
  return <ProviderRequests />;
}
