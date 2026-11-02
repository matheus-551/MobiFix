import { Suspense } from "react";
import type { Metadata } from "next";
import AuthAction from "@/features/auth/pages/AuthAction";
import { LoadingScreen } from "@/shared/components/LoadingScreen";

export const metadata: Metadata = { title: "Ação da conta | MobiFix" };

export default function Page() {
  // useSearchParams exige um limite de Suspense.
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthAction />
    </Suspense>
  );
}
