import type { ReactNode } from "react";
import { ProviderArea } from "@/features/prestador/components/ProviderArea";

export default function ProviderLayout({ children }: { children: ReactNode }) {
  return <ProviderArea>{children}</ProviderArea>;
}
