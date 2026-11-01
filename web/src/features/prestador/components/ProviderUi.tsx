import { Alert } from "@/shared/components/Alert";

/**
 * Aviso padrão das telas cujo recurso ainda não existe na API (nada é simulado). Quando o endpoint
 * for publicado, basta criar o serviço correspondente e substituir este aviso pelos dados reais.
 */
export function FeatureUnavailable({ feature }: { feature: string }) {
  return (
    <Alert tone="info">
      <strong>Recurso indisponível no momento.</strong> A API ainda não possui endpoints de {feature}. Esta tela já está
      preparada e será habilitada quando o recurso for disponibilizado.
    </Alert>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

/** Cartão de indicador; `value` é "—" enquanto não houver dados reais. */
export function StatCard({ label, value = "—" }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
