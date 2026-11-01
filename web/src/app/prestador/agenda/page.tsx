import type { Metadata } from "next";
import ProviderSchedule from "@/features/prestador/pages/ProviderSchedule";

export const metadata: Metadata = { title: "Agenda e disponibilidade | MobiFix Pro" };

export default function Page() {
  return <ProviderSchedule />;
}
