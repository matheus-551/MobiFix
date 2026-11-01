import type { Metadata } from "next";
import ProviderProfileEditor from "@/features/prestador/pages/ProviderProfileEditor";

export const metadata: Metadata = { title: "Meu perfil | MobiFix Pro" };

export default function Page() {
  return <ProviderProfileEditor />;
}
