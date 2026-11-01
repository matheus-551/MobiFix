import type { Metadata } from "next";
import MyVehicles from "@/features/cliente/pages/MyVehicles";

export const metadata: Metadata = { title: "Meus veículos | MobiFix" };

export default function Page() {
  return <MyVehicles />;
}
