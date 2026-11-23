import type { Metadata } from "next";
import Notifications from "@/features/cliente/pages/Notifications";

export const metadata: Metadata = { title: "Notificações | MobiFix" };

export default function Page() {
  return <Notifications />;
}
