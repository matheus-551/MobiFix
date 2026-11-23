"use client";

import { useMemo, type ReactNode } from "react";
import { RequireAuth } from "@/features/auth/components/RouteGuards";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getClientProfile } from "@/features/auth/services/accountService";
import { useAsync } from "@/shared/hooks/useAsync";
import { ClientContext, type ClientContextValue } from "../context/ClientContext";
import { NotificationsProvider } from "../context/NotificationsContext";
import { ToastProvider } from "./feedback/ToastContext";
import { ClientShell } from "./ClientShell";

function ClientProviders({ children }: { children: ReactNode }) {
  const { user, account } = useAuth();
  const uid = user?.uid ?? "";
  const { data: profile, reload: reloadProfile } = useAsync(() => getClientProfile(uid), uid, uid !== "");

  const value = useMemo<ClientContextValue>(
    () => ({
      uid,
      email: account?.email ?? user?.email ?? null,
      profile,
      firstName: profile?.firstName ?? user?.displayName?.split(" ")[0] ?? "",
      fullName: profile ? `${profile.firstName} ${profile.lastName}` : (user?.displayName ?? ""),
      reloadProfile,
    }),
    [uid, account?.email, user?.email, user?.displayName, profile, reloadProfile],
  );

  return (
    <ClientContext.Provider value={value}>
      <ToastProvider>
        <NotificationsProvider>
          <ClientShell>{children}</ClientShell>
        </NotificationsProvider>
      </ToastProvider>
    </ClientContext.Provider>
  );
}

/**
 * Área autenticada do cliente: guarda de rota + contexto do perfil + layout (sidebar e cabeçalho).
 * Usada por `src/app/cliente/layout.tsx`, portanto cobre /cliente e TODAS as páginas abaixo dela.
 */
export function ClientArea({ children }: { children: ReactNode }) {
  return (
    // ================================================
    // AUTENTICAÇÃO E PROTEÇÃO DE ROTAS
    // ================================================
    // <RequireAuth> é o guard que bloqueia /cliente/** para quem não está autenticado.
    // Para DESATIVAR temporariamente: use a chave em `features/auth/config/routeProtection.ts`
    // (recomendado) ou remova este wrapper (manter só <ClientProviders>).
    // ATENÇÃO: isso NÃO libera os endpoints protegidos da API; ver comentário em RouteGuards.tsx.
    <RequireAuth role="client">
      <ClientProviders>{children}</ClientProviders>
    </RequireAuth>
  );
}
