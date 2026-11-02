"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/shared/lib/firebase/client";
import { getErrorMessage } from "@/shared/utils/firebaseErrors";
import type { UserAccount } from "@/shared/types/domain";
import { subscribeToAccount } from "../services/accountService";
import { refreshEmailVerification } from "../services/authService";

export interface AuthState {
  /** `loading` até conhecermos o usuário do Authentication e (se houver) o documento `users/{uid}`. */
  status: "loading" | "ready";
  user: User | null;
  /** Espelha `user.emailVerified`; muda de estado quando o ID Token é renovado ou `refresh()` é chamado. */
  emailVerified: boolean;
  /** Documento `users/{uid}`; `null` se ainda não existe (ex.: durante o cadastro). */
  account: UserAccount | null;
  error: string | null;
  /** Recarrega o usuário no Firebase e renova o ID Token. Devolve o `emailVerified` atualizado. */
  refresh: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthState | null>(null);

type Snapshot = Omit<AuthState, "refresh">;

const INITIAL: Snapshot = { status: "loading", user: null, emailVerified: false, account: null, error: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Snapshot>(INITIAL);

  useEffect(() => {
    let unsubscribeAccount: (() => void) | undefined;
    let unsubscribeAuth: (() => void) | undefined;
    let currentUid: string | null = null;

    try {
      // onIdTokenChanged (e não onAuthStateChanged) dispara também quando o token é renovado.
      unsubscribeAuth = onIdTokenChanged(
        getFirebaseAuth(),
        (user) => {
          if (!user) {
            unsubscribeAccount?.();
            unsubscribeAccount = undefined;
            currentUid = null;
            setState({ status: "ready", user: null, emailVerified: false, account: null, error: null });
            return;
          }

          // Renovação de token do mesmo usuário: só atualiza o estado de verificação, sem reassinar o perfil.
          if (user.uid === currentUid) {
            setState((current) => ({ ...current, user, emailVerified: user.emailVerified }));
            return;
          }

          unsubscribeAccount?.();
          currentUid = user.uid;
          setState({ status: "loading", user, emailVerified: user.emailVerified, account: null, error: null });
          unsubscribeAccount = subscribeToAccount(
            user.uid,
            (account) =>
              setState((current) => ({
                ...current,
                status: "ready",
                user,
                emailVerified: user.emailVerified,
                account,
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

  const refresh = useCallback(async () => {
    const verified = await refreshEmailVerification();
    const user = getFirebaseAuth().currentUser;
    setState((current) => (current.user && user ? { ...current, user, emailVerified: user.emailVerified } : current));
    return verified;
  }, []);

  const value = useMemo<AuthState>(() => ({ ...state, refresh }), [state, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
