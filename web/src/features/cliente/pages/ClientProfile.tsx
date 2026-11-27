"use client";

import { useState } from "react";
import type { ClientProfile as ClientProfileData } from "@/shared/types/domain";
import { DeactivateAccountCard } from "@/features/auth/components/DeactivateAccountCard";
import { PasswordForm } from "../components/profile/PasswordForm";
import { ProfileInfoForm } from "../components/profile/ProfileInfoForm";
import { LoadingSkeleton } from "../components/StateViews";
import { useClient } from "../context/ClientContext";

export default function ClientProfile() {
  const { profile } = useClient();
  // Guarda o primeiro perfil carregado: as recargas após salvar não desmontam o formulário (nem apagam o aviso de sucesso).
  const [initial, setInitial] = useState<ClientProfileData | null>(null);
  if (profile && !initial) setInitial(profile);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Configurações da Conta</h1>
        <p className="mt-1 text-sm text-gray-500">Atualize suas informações pessoais, de segurança e privacidade.</p>
      </header>

      {initial ? <ProfileInfoForm initial={initial} /> : <LoadingSkeleton label="Carregando seu perfil..." />}
      <PasswordForm />
      <DeactivateAccountCard />
    </div>
  );
}
