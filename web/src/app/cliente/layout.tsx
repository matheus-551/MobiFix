import type { ReactNode } from "react";
import { ClientArea } from "@/features/cliente/components/ClientArea";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <ClientArea>{children}</ClientArea>;
}
