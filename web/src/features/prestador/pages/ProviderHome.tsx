"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Alert } from "@/shared/components/Alert";
import { DashboardShell } from "@/shared/components/DashboardShell";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import type { ProviderApprovalStatus, ProviderProfile } from "@/shared/types/domain";
import { RequireAuth } from "@/features/auth/components/RouteGuards";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getProviderProfile } from "@/features/auth/services/accountService";

const APPROVAL_TEXT: Record<ProviderApprovalStatus, { title: string; detail: string }> = {
  under_review: {
    title: "Documentos em análise",
    detail: "Nossa equipe está analisando seus documentos. Você será avisado quando o perfil for aprovado.",
  },
  changes_requested: {
    title: "Ajustes solicitados",
    detail: "A equipe pediu ajustes no seu cadastro. Entre em contato com o suporte para enviar novos documentos.",
  },
  rejected: {
    title: "Cadastro não aprovado",
    detail: "Não foi possível aprovar seu cadastro. Entre em contato com o suporte para mais informações.",
  },
  approved: {
    title: "Perfil aprovado",
    detail: "Seu perfil foi aprovado e está apto a receber solicitações de clientes.",
  },
};

function ProviderDashboard() {
  const { user, account } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getProviderProfile(uid)
      .then((data) => !cancelled && setProfile(data))
      .catch((failure: unknown) => !cancelled && setError(getErrorMessage(failure)))
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const approval = profile ? APPROVAL_TEXT[profile.approvalStatus] : null;
  const approved = profile?.approvalStatus === "approved";

  // Etapas distintas: cadastro e e-mail são fatos já cumpridos aqui (a guarda exige e-mail verificado).
  const steps = [
    { label: "Cadastro enviado", done: true },
    { label: "E-mail verificado", done: true },
    { label: "Análise documental", done: approved || profile?.approvalStatus === "rejected" },
    { label: "Aprovação profissional", done: approved },
  ];

  return (
    <DashboardShell greeting={profile ? `Olá, ${profile.responsibleName.split(" ")[0]}!` : "Olá!"}>
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Painel do prestador</h1>
        {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}
        {!error && !loaded && <p role="status" className="mt-2 text-sm text-gray-500">Carregando...</p>}
        {approval && (
          <div className="mt-4">
            <Alert tone={approved ? "success" : profile?.approvalStatus === "under_review" ? "info" : "error"}>
              <strong>{approval.title}.</strong> {approval.detail}
            </Alert>
          </div>
        )}
        {loaded && !profile && !error && (
          <div className="mt-4"><Alert tone="error">Perfil profissional não encontrado. Contate o suporte.</Alert></div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="andamento">
        <h2 id="andamento" className="mb-4 text-sm font-bold text-orange-500">Andamento do cadastro</h2>
        <ol className="space-y-3">
          {steps.map((step, index) => {
            const current = !step.done && steps.slice(0, index).every((previous) => previous.done);
            return (
              <li key={step.label} className="flex items-center gap-3 text-sm text-gray-700">
                {step.done ? (
                  <CheckCircle2 aria-hidden className="h-5 w-5 text-green-600" />
                ) : current ? (
                  <Clock aria-hidden className="h-5 w-5 text-orange-500" />
                ) : (
                  <Circle aria-hidden className="h-5 w-5 text-gray-300" />
                )}
                <span>
                  {step.label}
                  <span className="sr-only">{step.done ? " (concluída)" : current ? " (em andamento)" : " (pendente)"}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {profile && (
        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="dados-empresa">
          <h2 id="dados-empresa" className="mb-4 text-sm font-bold text-orange-500">Dados da oficina</h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Item label="Empresa / Oficina" value={profile.displayName} />
            <Item label="E-mail" value={account?.email ?? user?.email ?? "—"} />
            <Item label="Telefone" value={profile.phone} />
            <Item label="Localização" value={`${profile.city} - ${profile.state}`} />
            <Item label="Endereço" value={profile.address} />
            <Item label="Documentos enviados" value={String(profile.documents.length)} />
          </dl>
        </section>
      )}
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

export default function ProviderHome() {
  return (
    <RequireAuth role="provider">
      <ProviderDashboard />
    </RequireAuth>
  );
}
