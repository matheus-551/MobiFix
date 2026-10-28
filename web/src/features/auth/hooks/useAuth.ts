"use client";

import { useContext } from "react";
import { AuthContext, type AuthState } from "../context/AuthProvider";

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  return context;
}