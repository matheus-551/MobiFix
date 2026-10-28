import type { Metadata } from "next";
import { LegalPage } from "@/shared/components/LegalPage";

export const metadata: Metadata = { title: "Termos de Serviço | MobiFix" };

export default function Page() {
  return (
    <LegalPage title="Termos de Serviço">
      <p>
        O texto oficial dos Termos de Serviço do MobiFix ainda não foi fornecido. Esta página existe para que o link
        do cadastro funcione e vai(se houver) ser substituída pelo documento definitivo antes da publicação.
      </p>
    </LegalPage>
  );
}