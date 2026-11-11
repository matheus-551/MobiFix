"use client";

import { useMemo, type ReactNode } from "react";
import { RequireAuth } from "@/features/auth/components/RouteGuards";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getProviderProfile } from "@/features/auth/services/accountService";
import { getFriendlyError } from "@/shared/lib/api/http";
import { useAsync } from "@/shared/hooks/useAsync";
import { ProviderContext, type ProviderContextValue } from "../context/ProviderContext";
import { ProviderShell } from "./ProviderShell";

function ProviderProviders({ children }: { children: ReactNode }) {
  const { user, account } = useAuth();
  const uid = user?.uid ?? "";
  const { data: profile, error, loading } = useAsync(() => getProviderProfile(uid), uid, uid !== "");

  const value = useMemo<ProviderContextValue>(
    () => ({
      uid,
      email: account?.email ?? user?.email ?? null,
      profile,
      loaded: !loading,
      error: error ? getFriendlyError(error) : null,
      displayName: profile?.displayName ?? user?.displayName ?? "",
    }),
    [uid, account?.email, user?.email, user?.displayName, profile, error, loading],
  );

  return (
    <ProviderContext.Provider value={value}>
      <ProviderShell>{children}</ProviderShell>
    </ProviderContext.Provider>
  );
}

/**
 * Área autenticada do prestador: guarda de rota + contexto do perfil + layout (sidebar e cabeçalho).
 * Usada por `src/app/prestador/layout.tsx`, portanto cobre /prestador e TODAS as páginas abaixo dela.
 */
export function ProviderArea({ children }: { children: ReactNode }) {
  return (
    // ================================================
    // AUTENTICAÇÃO E PROTEÇÃO DE ROTAS
    // ================================================
    // <RequireAuth> é o guard que bloqueia /prestador/** para quem não está autenticado.
    // Para DESATIVAR temporariamente: use a chave em `features/auth/config/routeProtection.ts`
    // (recomendado) ou remova este wrapper (manter só <ProviderProviders>).
    // ATENÇÃO: isso NÃO libera os endpoints protegidos da API; ver comentário em RouteGuards.tsx.
    <RequireAuth role="provider">
      <ProviderProviders>{children}</ProviderProviders>
    </RequireAuth>
  );
}
