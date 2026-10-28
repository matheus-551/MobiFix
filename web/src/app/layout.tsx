import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MobiFix",
  description: "Plataforma que conecta clientes a prestadores de serviços automotivos.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
