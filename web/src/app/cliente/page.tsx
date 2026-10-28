import type { Metadata } from "next";
import ClientHome from "@/features/cliente/pages/ClientHome";

export const metadata: Metadata = { title: "Painel do cliente | MobiFix" };

export default function Page() {
  return <ClientHome />;
}
