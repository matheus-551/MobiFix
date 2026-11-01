"use client";

import { createContext, useContext } from "react";
import type { ClientProfile } from "@/shared/types/domain";

export interface ClientContextValue {
  uid: string;
  email: string | null;
  /** `null` enquanto carrega ou se o documento `clientProfiles/{uid}` não existir. */
  profile: ClientProfile | null;
  firstName: string;
  fullName: string;
}

export const ClientContext = createContext<ClientContextValue | null>(null);

export function useClient(): ClientContextValue {
  const context = useContext(ClientContext);
  if (!context) throw new Error("useClient deve ser usado dentro de <ClientArea>.");
  return context;
}
