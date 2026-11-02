import {
  browserLocalPersistence,
  browserSessionPersistence,
  deleteUser,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/shared/lib/firebase/client";
import { getErrorCode } from "@/shared/utils/firebaseErrors";
import { onlyDigits } from "@/shared/utils/format";
import { routes } from "@/routes";
import { registerUserInApi, type ApiSyncResult } from "./apiRegistration";
import { createVerifiedAccount } from "./emailVerificationService";

export interface ClientRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  password: string;
  /** Token de uso único devolvido pelo servidor depois que o código do e-mail foi confirmado. */
  verificationToken: string;
}

export interface ClientRegistrationResult {
  /** Resultado do `POST /api/v1/usuarios`; `ok: false` não desfaz o cadastro no Firebase. */
  api: ApiSyncResult;
}

/** `remember` = persistência local (sobrevive ao fechamento do navegador); caso contrário, apenas a sessão da aba. */
export async function signIn(email: string, password: string, remember: boolean): Promise<void> {
  const auth = getFirebaseAuth();
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

/**
 * Não revela se o e-mail existe: `auth/user-not-found` é tratado como sucesso para evitar
 * enumeração de contas.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim(), {
      url: `${window.location.origin}${routes.login}`,
    });
  } catch (error) {
    if (getErrorCode(error) !== "auth/user-not-found") throw error;
  }
}

/**
 * Cadastro do cliente (executado só depois da verificação do e-mail):
 * 1. o servidor cria a conta no Authentication já com `emailVerified: true` (exige o token da verificação);
 * 2. o navegador entra com a conta e grava `users` + `clientProfiles` em uma escrita atômica
 *    (as regras do Firestore exigem `email_verified`); se falhar, a conta é removida;
 * 3. o usuário é cadastrado na API (`POST /api/v1/usuarios`, tipo CLIENTE).
 */
export async function registerClient(input: ClientRegistrationInput): Promise<ClientRegistrationResult> {
  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  await createVerifiedAccount({
    email,
    token: input.verificationToken,
    password: input.password,
    displayName: `${firstName} ${lastName}`,
  });
  await signIn(email, input.password, true);

  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sessão não iniciada após criar a conta.");

  try {
    const db = getDb();
    const batch = writeBatch(db);
    batch.set(doc(db, "users", user.uid), {
      email,
      role: "client",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, "clientProfiles", user.uid), {
      firstName,
      lastName,
      phone: input.phone,
      state: input.state,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    await deleteUser(user).catch(() => undefined);
    throw error;
  }

  const api = await registerUserInApi({
    nome: firstName,
    sobrenome: lastName,
    email,
    telefone: onlyDigits(input.phone),
    uf: input.state,
    tipo: "CLIENTE",
  });
  return { api };
}
