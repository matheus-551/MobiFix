import { Suspense } from "react";
import type { Metadata } from "next";
import ProviderProfile from "@/features/cliente/pages/ProviderProfile";
import { LoadingBlock } from "@/features/cliente/components/StateViews";

export const metadata: Metadata = { title: "Perfil do prestador | MobiFix" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Carregando perfil..." />}>
      <ProviderProfile />
    </Suspense>
  );
}
