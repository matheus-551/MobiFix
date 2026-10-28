import {
  applyActionCode,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/shared/lib/firebase/client";
import { getErrorCode } from "@/shared/utils/firebaseErrors";
import { routes } from "@/routes";

export interface ClientRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  password: string;
}

export interface RegistrationResult {
  /** Falso quando a conta foi criada, mas o e-mail de verificação não pôde ser enviado (o usuário pode reenviar). */
  verificationEmailSent: boolean;
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
 * O destino é a página de verificação. Se o modelo de e-mail do Firebase estiver
 * configurado com URL de ação personalizada (README), o link chega com `oobCode`.
 */
export async function sendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user, { url: `${window.location.origin}${routes.verifyEmail}` });
}

/** Aplica o código `oobCode` do link de verificação (inválido/expirado lança `auth/*-action-code`). */
export async function confirmEmailVerification(oobCode: string): Promise<void> {
  await applyActionCode(getFirebaseAuth(), oobCode);
  // Atualiza o usuário atual, caso a verificação ocorra na mesma sessão.
  await getFirebaseAuth().currentUser?.reload();
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
 * Cria a conta no Authentication e os documentos `users` e `clientProfiles` em uma única
 * escrita atômica. Se a gravação falhar, a conta recém-criada é removida para não deixar
 * um usuário sem perfil.
 */
export async function registerClient(input: ClientRegistrationInput): Promise<RegistrationResult> {
  const auth = getFirebaseAuth();
  const email = input.email.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(auth, email, input.password);
  const { user } = credential;

  try {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    await updateProfile(user, { displayName: `${firstName} ${lastName}` });

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

  return { verificationEmailSent: await sendVerificationEmail(user).then(() => true, () => false) };
}