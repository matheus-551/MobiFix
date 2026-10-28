import type { Metadata } from "next";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";

export const metadata: Metadata = { title: "Recuperar senha | MobiFix" };

export default function Page() {
  return <ForgotPassword />;
}
