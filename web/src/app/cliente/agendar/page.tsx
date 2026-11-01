import { Suspense } from "react";
import type { Metadata } from "next";
import BookingFlow from "@/features/cliente/pages/BookingFlow";
import { LoadingBlock } from "@/features/cliente/components/StateViews";

export const metadata: Metadata = { title: "Novo agendamento | MobiFix" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <BookingFlow />
    </Suspense>
  );
}
