"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/shared/lib/firebase/client";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import type { UserAccount } from "@/shared/types/domain";
import { subscribeToAccount } from "../services/accountService";

export interface AuthState {
  /** `loading` até conhecermos o usuário do Authentication e (se houver) o documento `users/{uid}`. */
  status: "loading" | "ready";
  user: User | null;
  /** Documento `users/{uid}`; `null` se ainda não existe (ex.: durante o cadastro). */
  account: UserAccount | null;
  emailVerified: boolean;
  error: string | null;
  /** Recarrega o usuário no Firebase (necessário após verificar o e-mail). */
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

interface Snapshot {
  status: "loading" | "ready";
  user: User | null;
  account: UserAccount | null;
  emailVerified: boolean;
  error: string | null;
}

const INITIAL: Snapshot = { status: "loading", user: null, account: null, emailVerified: false, error: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Snapshot>(INITIAL);

  useEffect(() => {
    let unsubscribeAccount: (() => void) | undefined;
    let unsubscribeAuth: (() => void) | undefined;

    try {
      unsubscribeAuth = onAuthStateChanged(
        getFirebaseAuth(),
        (user) => {
          unsubscribeAccount?.();
          unsubscribeAccount = undefined;

          if (!user) {
            setState({ status: "ready", user: null, account: null, emailVerified: false, error: null });
            return;
          }

          setState({ status: "loading", user, account: null, emailVerified: user.emailVerified, error: null });
          unsubscribeAccount = subscribeToAccount(
            user.uid,
            (account) =>
              setState((current) => ({
                ...current,
                status: "ready",
                user,
                account,
                emailVerified: user.emailVerified,
                error: null,
              })),
            (error) => setState((current) => ({ ...current, status: "ready", error: getErrorMessage(error) })),
          );
        },
        (error) => setState({ ...INITIAL, status: "ready", error: getErrorMessage(error) }),
      );
    } catch (error) {
      // Normalmente: variáveis do Firebase ausentes. Exibimos a causa em vez de falhar em silêncio.
      queueMicrotask(() => setState({ ...INITIAL, status: "ready", error: getErrorMessage(error) }));
    }

    return () => {
      unsubscribeAuth?.();
      unsubscribeAccount?.();
    };
  }, []);

  const refreshUser = useCallback(async () => {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    await user.reload();
    setState((current) => ({ ...current, emailVerified: user.emailVerified }));
  }, []);

  const value = useMemo<AuthState>(() => ({ ...state, refreshUser }), [state, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}