"use client";

import { useMemo, type ReactNode } from "react";
import { RequireAuth } from "@/features/auth/components/RouteGuards";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getClientProfile } from "@/features/auth/services/accountService";
import { useAsync } from "@/shared/hooks/useAsync";
import { ClientContext, type ClientContextValue } from "../context/ClientContext";
import { ClientShell } from "./ClientShell";

function ClientProviders({ children }: { children: ReactNode }) {
  const { user, account } = useAuth();
  const uid = user?.uid ?? "";
  const { data: profile } = useAsync(() => getClientProfile(uid), uid, uid !== "");

  const value = useMemo<ClientContextValue>(
    () => ({
      uid,
      email: account?.email ?? user?.email ?? null,
      profile,
      firstName: profile?.firstName ?? user?.displayName?.split(" ")[0] ?? "",
      fullName: profile ? `${profile.firstName} ${profile.lastName}` : (user?.displayName ?? ""),
    }),
    [uid, account?.email, user?.email, user?.displayName, profile],
  );

  return (
    <ClientContext.Provider value={value}>
      <ClientShell>{children}</ClientShell>
    </ClientContext.Provider>
  );
}

/** Área autenticada do cliente: guarda de rota + contexto do perfil + layout (sidebar e cabeçalho). */
export function ClientArea({ children }: { children: ReactNode }) {
  return (
    <RequireAuth role="client">
      <ClientProviders>{children}</ClientProviders>
    </RequireAuth>
  );
}
