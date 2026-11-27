"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/routes";
import { Alert } from "@/shared/components/Alert";
import { getFriendlyError } from "@/shared/lib/api/http";
import { ConfirmDialog } from "@/features/cliente/components/feedback/Dialogs";
import { deactivateApiAccount } from "../services/apiAccountService";
import { signOutUser } from "../services/authService";

/** Desativação da conta pela API (`DELETE /usuarios/me`); depois encerra a sessão e volta ao login. */
export function DeactivateAccountCard() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeactivate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await deactivateApiAccount();
      await signOutUser();
      router.replace(routes.login);
    } catch (failure) {
      setError(getFriendlyError(failure));
      setConfirming(false);
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-red-100 bg-white p-6 shadow-sm" aria-labelledby="desativar-conta">
      <h2 id="desativar-conta" className="text-base font-bold text-gray-900">Desativar conta</h2>
      <p className="text-sm text-gray-500">
        A conta é desativada na API: você deixa de usar os serviços do MobiFix e não aparece mais para outros usuários.
        Os dados não são apagados.
      </p>
      {error && <Alert tone="error">{error}</Alert>}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
      >
        Desativar minha conta
      </button>
      {confirming && (
        <ConfirmDialog
          title="Deseja desativar sua conta?"
          description="Você será desconectado e não poderá usar o MobiFix com esta conta. Esta ação não pode ser desfeita por aqui."
          confirmLabel="Desativar"
          loadingLabel="Desativando..."
          loading={loading}
          onConfirm={() => void handleDeactivate()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </section>
  );
}
