import type { Metadata } from "next";
import VerifyEmail from "@/features/auth/pages/VerifyEmail";

export const metadata: Metadata = { title: "Verificar e-mail | MobiFix" };

export default function Page() {
  return <VerifyEmail />;
}
