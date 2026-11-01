import { Suspense } from "react";
import type { Metadata } from "next";
import SearchResults from "@/features/cliente/pages/SearchResults";
import { LoadingBlock } from "@/features/cliente/components/StateViews";

export const metadata: Metadata = { title: "Resultados da busca | MobiFix" };

export default function Page() {
  // useSearchParams exige um limite de Suspense.
  return (
    <Suspense fallback={<LoadingBlock />}>
      <SearchResults />
    </Suspense>
  );
}
