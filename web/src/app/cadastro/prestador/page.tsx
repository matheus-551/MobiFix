import type { Metadata } from "next";
import ProviderSignup from "@/features/prestador/pages/ProviderSignup";

export const metadata: Metadata = { title: "Cadastro de prestador | MobiFix" };

export default function Page() {
  return <ProviderSignup />;
}
