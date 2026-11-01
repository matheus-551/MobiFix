import { Suspense } from "react";
import type { Metadata } from "next";
import MyAppointments from "@/features/cliente/pages/MyAppointments";
import { LoadingBlock } from "@/features/cliente/components/StateViews";

export const metadata: Metadata = { title: "Meus agendamentos | MobiFix" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <MyAppointments />
    </Suspense>
  );
}
