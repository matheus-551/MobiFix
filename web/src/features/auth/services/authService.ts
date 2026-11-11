import {
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
import { EMAIL_VERIFICATION_ENABLED } from "@/shared/config/features";
import { getErrorCode } from "@/shared/utils/firebaseErrors";
import { withTimeout } from "@/shared/utils/timeout";
import { routes } from "@/routes";
import { checkResend, describeBlock, markSent } from "../utils/resendPolicy";
import { isContinueUrlError } from "../utils/continueUrlError";
import { syncApiUserAfterSignup } from "./apiAccountService";

/**
 * Autenticação exclusivamente via Firebase Authentication: cadastro, verificação de e-mail,
 * login e redefinição de senha usam apenas o SDK (sem códigos próprios nem provedor de e-mail externo).
 */

export interface ClientRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  password: string;
}

export interface RegistrationResult {
  /**
   * `true` quando a verificação de e-mail está ativa (NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED): a tela deve
   * mostrar a verificação. `false`: nenhum e-mail foi enviado e a conta já pode ser usada normalmente.
   */
  verificationRequired: boolean;
  /**
   * Envio do link em andamento (nunca rejeita). Resolve `false` se o e-mail não pôde ser enviado; a tela
   * de verificação já aparece enquanto isso e oferece o reenvio. `undefined` quando a verificação está desativada.
   */
  verificationEmail?: Promise<boolean>;
}

/** Limite para o Firebase Authentication responder ao login/cadastro (o SDK não tem limite próprio). */
const AUTH_TIMEOUT_MS = 20_000;
const AUTH_TIMEOUT_MESSAGE =
  "O servidor de autenticação demorou demais para responder. Verifique sua conexão e tente novamente.";

/** Lançado quando o reenvio é barrado pela política local (intervalo mínimo / limite por hora). */
export class ResendBlockedError extends Error {
  constructor(
    message: string,
    public readonly waitSeconds: number,
  ) {
    super(message);
    this.name = "ResendBlockedError";
  }
}

function actionSettings() {
  return { url: `${window.location.origin}${routes.login}` };
}

/** Chave do histórico de envios: por usuário (verificação) ou por e-mail (redefinição de senha). */
export const verificationKey = (uid: string) => `verify:${uid}`;
const resetKey = (email: string) => `reset:${email.trim().toLowerCase()}`;

/** `remember` = persistência local (sobrevive ao fechamento do navegador); caso contrário, apenas a sessão da aba. */
export async function signIn(email: string, password: string, remember: boolean): Promise<{ emailVerified: boolean }> {
  const auth = getFirebaseAuth();
  return withTimeout(
    (async () => {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      return { emailVerified: credential.user.emailVerified };
    })(),
    AUTH_TIMEOUT_MS,
    AUTH_TIMEOUT_MESSAGE,
  );
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

/**
 * Envia o link de verificação do Firebase. Tenta primeiro com a URL de retorno do site; se o Firebase a recusar
 * (domínio ainda fora de "Domínios autorizados"), repete SEM URL de retorno — exatamente como o mobile envia
 * (`sendEmailVerification(user)`). Assim o usuário nunca fica sem receber o link por causa dessa configuração.
 */
async function sendVerificationLink(user: User): Promise<void> {
  try {
    await sendEmailVerification(user, actionSettings());
  } catch (error) {
    if (!isContinueUrlError(getErrorCode(error))) throw error;
    await sendEmailVerification(user);
  }
}

/** Envia o e-mail de verificação nativo do Firebase e registra o envio na política de reenvio. */
export async function dispatchVerificationEmail(user: User): Promise<boolean> {
  try {
    await sendVerificationLink(user);
    markSent(verificationKey(user.uid));
    return true;
  } catch {
    return false;
  }
}

/** Reenvio manual (botão "Reenviar e-mail"), respeitando intervalo mínimo e limite por hora. */
export async function resendVerificationEmail(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sessão não encontrada.");
  const decision = checkResend(verificationKey(user.uid));
  if (!decision.allowed) throw new ResendBlockedError(describeBlock(decision), decision.waitSeconds);
  await sendVerificationLink(user);
  markSent(verificationKey(user.uid));
}

/**
 * Atualiza o usuário no Firebase e renova o ID Token. A renovação é o que faz o claim `email_verified`
 * chegar às regras do Firestore/Storage e ao backend (Spring Boot) com o valor atualizado.
 */
export async function refreshEmailVerification(): Promise<boolean> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return false;
  await user.reload();
  if (user.emailVerified) await user.getIdToken(true);
  return user.emailVerified;
}

/**
 * Não revela se o e-mail existe: `auth/user-not-found` é tratado como sucesso para evitar
 * enumeração de contas. Aplica o mesmo intervalo mínimo dos demais reenvios.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const key = resetKey(email);
  const decision = checkResend(key);
  if (!decision.allowed) throw new ResendBlockedError(describeBlock(decision), decision.waitSeconds);
  const auth = getFirebaseAuth();
  try {
    try {
      await sendPasswordResetEmail(auth, email.trim(), actionSettings());
    } catch (error) {
      // Domínio fora de "Domínios autorizados": repete sem URL de retorno (como o mobile).
      if (!isContinueUrlError(getErrorCode(error))) throw error;
      await sendPasswordResetEmail(auth, email.trim());
    }
  } catch (error) {
    if (getErrorCode(error) !== "auth/user-not-found") throw error;
  }
  markSent(key);
}

/**
 * Cria a conta no Firebase Authentication (a senha nunca passa por nosso código além deste SDK) e
 * mantém o usuário logado, pois o envio/reenvio do link de verificação exige sessão.
 */
export async function createAccount(email: string, password: string, displayName: string): Promise<User> {
  const auth = getFirebaseAuth();
  const { user } = await withTimeout(
    (async () => {
      await setPersistence(auth, browserLocalPersistence);
      return createUserWithEmailAndPassword(auth, email, password);
    })(),
    AUTH_TIMEOUT_MS,
    AUTH_TIMEOUT_MESSAGE,
  );
  // O nome de exibição é cosmético: não precisa travar o cadastro esperando esta chamada.
  void updateProfile(user, { displayName }).catch(() => undefined);
  return user;
}

/** Desfaz a conta recém-criada quando a gravação do perfil falha (evita conta sem perfil). */
export async function discardAccount(user: User): Promise<void> {
  await deleteUser(user).catch(() => undefined);
  // Garante que não sobra sessão (caso a exclusão falhe) antes de a tela liberar o redirecionamento.
  await signOut(getFirebaseAuth()).catch(() => undefined);
}

/**
 * Cadastro do cliente:
 * 1. `createUserWithEmailAndPassword` cria a conta (e-mail ainda NÃO verificado);
 * 2. `users` + `clientProfiles` são gravados em uma escrita atômica (se falhar, a conta é removida);
 * 3. O usuário correspondente na API (`POST /usuarios`) é criado em segundo plano, como no mobile; se a API
 *    estiver fora do ar, é criado sob demanda (`ensureApiUser`) no primeiro acesso às telas que a usam.
 * 4. Verificação ATIVA (padrão): `sendEmailVerification` envia o link nativo e o acesso às áreas
 *    protegidas só é liberado depois que o Firebase marcar `emailVerified`.
 *    Verificação DESATIVADA (NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED=false): nada é enviado e a conta já entra.
 */
export async function registerClient(input: ClientRegistrationInput): Promise<RegistrationResult> {
  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  const user = await createAccount(email, input.password, `${firstName} ${lastName}`);

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
    const firebaseError = error as {
      code?: string;
      message?: string;
    };

    console.error("[MOBIFIX] Erro ao gravar perfil:", {
      code: firebaseError.code,
      message: firebaseError.message,
      error,
    });

    await discardAccount(user);
    throw error;
  }

  syncApiUserAfterSignup("CLIENTE", { nome: firstName, sobrenome: lastName, email, telefone: input.phone, uf: input.state });
  return startVerification(user);
}

/**
 * Passo final comum aos cadastros. Só depois do perfil gravado (sem e-mail para conta descartada) e sem
 * bloquear a troca de tela. Com a verificação desativada, não envia nada.
 */
export function startVerification(user: User): RegistrationResult {
  if (!EMAIL_VERIFICATION_ENABLED) return { verificationRequired: false };
  return { verificationRequired: true, verificationEmail: dispatchVerificationEmail(user) };
}
