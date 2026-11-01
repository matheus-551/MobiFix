import { Suspense } from "react";
import type { Metadata } from "next";
import ReviewPage from "@/features/cliente/pages/ReviewPage";
import { LoadingBlock } from "@/features/cliente/components/StateViews";

export const metadata: Metadata = { title: "Avaliação de serviço | MobiFix" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <ReviewPage />
    </Suspense>
  );
}
