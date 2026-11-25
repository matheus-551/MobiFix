import type { Metadata } from "next";
import ClientProfile from "@/features/cliente/pages/ClientProfile";

export const metadata: Metadata = { title: "Configurações da conta | MobiFix" };

export default function Page() {
  return <ClientProfile />;
}
