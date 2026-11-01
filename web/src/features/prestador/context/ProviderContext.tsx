"use client";

import { createContext, useContext } from "react";
import type { ProviderProfile } from "@/shared/types/domain";

export interface ProviderContextValue {
  uid: string;
  email: string | null;
  /** `null` enquanto carrega ou se o documento `providerProfiles/{uid}` não existir. */
  profile: ProviderProfile | null;
  loaded: boolean;
  error: string | null;
  displayName: string;
}

export const ProviderContext = createContext<ProviderContextValue | null>(null);

export function useProvider(): ProviderContextValue {
  const context = useContext(ProviderContext);
  if (!context) throw new Error("useProvider deve ser usado dentro de <ProviderArea>.");
  return context;
}
