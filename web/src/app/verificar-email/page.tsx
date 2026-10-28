import { Suspense } from "react";
import type { Metadata } from "next";
import VerifyEmail from "@/features/auth/pages/VerifyEmail";
import { LoadingScreen } from "@/shared/components/LoadingScreen";

export const metadata: Metadata = { title: "Verifique seu e-mail | MobiFix" };

export default function Page() {
  // useSearchParams exige um limite de Suspense.
  return (
    <Suspense fallback={<LoadingScreen />}>
      <VerifyEmail />
    </Suspense>
  );
}
