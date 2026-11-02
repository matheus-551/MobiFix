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
  /** `true` assim que o Firebase Authentication informou se há sessão (não espera o perfil do Firestore). */
  authReady: boolean;
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

/** Tempo máximo esperando o perfil `users/{uid}` antes de mostrar um erro em vez de carregar para sempre. */
const ACCOUNT_TIMEOUT_MS = 15000;

const INITIAL: Snapshot = { status: "loading", authReady: false, user: null, emailVerified: false, account: null, error: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Snapshot>(INITIAL);

  useEffect(() => {
    let unsubscribeAccount: (() => void) | undefined;
    let unsubscribeAuth: (() => void) | undefined;
    let currentUid: string | null = null;
    let accountTimer: ReturnType<typeof setTimeout> | undefined;

    try {
      // onIdTokenChanged (e não onAuthStateChanged) dispara também quando o token é renovado.
      unsubscribeAuth = onIdTokenChanged(
        getFirebaseAuth(),
        (user) => {
          if (!user) {
            unsubscribeAccount?.();
            unsubscribeAccount = undefined;
            clearTimeout(accountTimer);
            currentUid = null;
            setState({ status: "ready", authReady: true, user: null, emailVerified: false, account: null, error: null });
            return;
          }

          // Renovação de token do mesmo usuário: só atualiza o estado de verificação, sem reassinar o perfil.
          if (user.uid === currentUid) {
            setState((current) => ({ ...current, user, emailVerified: user.emailVerified }));
            return;
          }

          unsubscribeAccount?.();
          clearTimeout(accountTimer);
          currentUid = user.uid;
          setState({ status: "loading", authReady: true, user, emailVerified: user.emailVerified, account: null, error: null });
          accountTimer = setTimeout(() => {
            setState((current) =>
              current.status === "loading" && current.user?.uid === user.uid
                ? {
                    ...current,
                    status: "ready",
                    error: "Não foi possível carregar o seu perfil. Verifique a conexão e se o Firestore está criado e com as regras publicadas.",
                  }
                : current,
            );
          }, ACCOUNT_TIMEOUT_MS);
          unsubscribeAccount = subscribeToAccount(
            user.uid,
            (account) => {
              clearTimeout(accountTimer);
              setState((current) => ({
                ...current,
                status: "ready",
                user,
                emailVerified: user.emailVerified,
                account,
                error: null,
              }));
            },
            (error) => {
              clearTimeout(accountTimer);
              setState((current) => ({ ...current, status: "ready", error: getErrorMessage(error) }));
            },
          );
        },
        (error) => setState({ ...INITIAL, status: "ready", authReady: true, error: getErrorMessage(error) }),
      );
    } catch (error) {
      // Normalmente: variáveis do Firebase ausentes. Exibimos a causa em vez de falhar em silêncio.
      queueMicrotask(() => setState({ ...INITIAL, status: "ready", authReady: true, error: getErrorMessage(error) }));
    }

    return () => {
      clearTimeout(accountTimer);
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
