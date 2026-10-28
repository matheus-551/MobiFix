import type { Metadata } from "next";
import Login from "@/features/auth/pages/Login";

export const metadata: Metadata = { title: "Entrar | MobiFix" };

export default function Page() {
  return <Login />;
}
