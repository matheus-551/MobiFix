"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Alert } from "@/shared/components/Alert";
import { EmptyState, LoadingBlock } from "@/features/cliente/components/StateViews";
import type { ProviderApprovalStatus } from "@/shared/types/domain";
import { useProvider } from "../context/ProviderContext";
import { FeatureUnavailable, PageTitle, StatCard } from "../components/ProviderUi";

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

export default function ProviderHome() {
  const { profile, loaded, error, email, displayName } = useProvider();
  const approval = profile ? APPROVAL_TEXT[profile.approvalStatus] : null;
  const approved = profile?.approvalStatus === "approved";

  // Etapas distintas: o cadastro já foi enviado; análise e aprovação dependem do status do perfil.
  const steps = [
    { label: "Cadastro enviado", done: true },
    { label: "Análise documental", done: approved || profile?.approvalStatus === "rejected" },
    { label: "Aprovação profissional", done: approved },
  ];

  return (
    <>
      <PageTitle title="Painel de Controle — Prestador" />

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">{displayName ? `Olá, ${displayName}!` : "Olá!"}</h2>
        <p className="mt-1 text-sm text-gray-500">Acompanhe o desempenho e o andamento da sua oficina.</p>
        {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}
        {!error && !loaded && <LoadingBlock />}
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

      <FeatureUnavailable feature="agendamentos e avaliações" />

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Solicitações Pendentes" />
        <StatCard label="Agendamentos de Hoje" />
        <StatCard label="Concluídos este Mês" />
        <StatCard label="Avaliação Média" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="proximos">
          <h2 id="proximos" className="mb-4 text-sm font-bold text-gray-900">Próximos Atendimentos</h2>
          <EmptyState title="Sem dados para exibir">Os próximos atendimentos aparecerão aqui.</EmptyState>
        </section>
        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="desempenho">
          <h2 id="desempenho" className="mb-4 text-sm font-bold text-gray-900">Desempenho Semanal (Serviços Concluídos)</h2>
          <EmptyState title="Sem dados para exibir">O gráfico semanal aparecerá aqui.</EmptyState>
        </section>
      </div>

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
            <Item label="E-mail" value={email ?? "—"} />
            <Item label="Telefone" value={profile.phone} />
            <Item label="Localização" value={`${profile.city} - ${profile.state}`} />
            <Item label="Endereço" value={profile.address} />
            <Item label="Documentos enviados" value={String(profile.documents.length)} />
          </dl>
        </section>
      )}
    </>
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
