"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/shared/components/Alert";
import { DashboardShell } from "@/shared/components/DashboardShell";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import type { ClientProfile } from "@/shared/types/domain";
import { RequireAuth } from "@/features/auth/components/RouteGuards";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getClientProfile } from "@/features/auth/services/accountService";

function ClientDashboard() {
  const { user, account } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getClientProfile(uid)
      .then((data) => !cancelled && setProfile(data))
      .catch((failure: unknown) => !cancelled && setError(getErrorMessage(failure)))
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return (
    <DashboardShell greeting={profile ? `Olá, ${profile.firstName}!` : "Olá!"}>
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Seu painel de cliente</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sua conta está ativa e o e-mail foi verificado. As próximas telas (busca de prestadores, agendamentos e
          veículos) serão conectadas a partir daqui.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="dados-conta">
        <h2 id="dados-conta" className="mb-4 text-sm font-bold text-orange-500">Dados da conta</h2>
        {error && <Alert tone="error">{error}</Alert>}
        {!error && !loaded && <p role="status" className="text-sm text-gray-500">Carregando...</p>}
        {loaded && !error && (
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Item label="Nome" value={profile ? `${profile.firstName} ${profile.lastName}` : "—"} />
            <Item label="E-mail" value={account?.email ?? user?.email ?? "—"} />
            <Item label="Telefone" value={profile?.phone ?? "—"} />
            <Item label="Estado" value={profile?.state ?? "—"} />
          </dl>
        )}
      </section>
    </DashboardShell>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-gray-500">{label}</dt>
      <dd className="mt-0.5 break-words text-gray-800">{value}</dd>
    </div>
  );
}

export default function ClientHome() {
  return (
    <RequireAuth role="client">
      <ClientDashboard />
    </RequireAuth>
  );
}