import type { Metadata } from "next";
import ClientSignup from "@/features/auth/pages/ClientSignup";

export const metadata: Metadata = { title: "Criar conta de cliente | MobiFix" };

export default function Page() {
  return <ClientSignup />;
}
