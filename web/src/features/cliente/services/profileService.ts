import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { apiRequest, getFriendlyError } from "@/shared/lib/api/http";
import { ApiError } from "@/shared/lib/api/ApiError";
import { getDb, getFirebaseAuth } from "@/shared/lib/firebase/client";
import type { ClientProfile } from "@/shared/types/domain";
import { getErrorCode } from "@/shared/utils/firebaseErrors";
import { formatPhone, onlyDigits } from "@/shared/utils/format";
import { withTimeout } from "@/shared/utils/timeout";
import type { ApiUser } from "../types";
import { ensureApiUser } from "./vehicleService";

export interface ClientProfileInput {
  uid: string;
  email: string | null;
  /** Perfil atual (usado só para criar o usuário na API se ele ainda não existir). */
  currentProfile: ClientProfile | null;
  firstName: string;
  lastName: string;
  phone: string;
  state: string;
}

/**
 * Salva nome, sobrenome, telefone e UF, que são os campos que a API aceita em `PUT /api/v1/usuarios/me`
 * (e-mail, foto e endereço NÃO fazem parte do cadastro na API). Depois espelha os mesmos campos em
 * `clientProfiles/{uid}` (Firestore), que alimenta o restante do painel.
 */
export async function updateClientProfile(input: ClientProfileInput): Promise<void> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const phone = formatPhone(input.phone);

  await ensureApiUser(input.currentProfile, input.email);
  await apiRequest<ApiUser>("/usuarios/me", {
    method: "PUT",
    body: { nome: firstName, sobrenome: lastName, telefone: onlyDigits(input.phone), uf: input.state },
  });

  try {
    await updateDoc(doc(getDb(), "clientProfiles", input.uid), {
      firstName,
      lastName,
      phone,
      state: input.state,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new ApiError(
      0,
      `Seus dados foram salvos na API, mas não foi possível atualizar o perfil exibido neste painel. ${getFriendlyError(error)}`,
    );
  }
}

/** A senha atual informada não confere (o Firebase devolve o mesmo erro de "credencial inválida" do login). */
export class WrongCurrentPasswordError extends Error {
  constructor() {
    super("A senha atual está incorreta.");
    this.name = "WrongCurrentPasswordError";
  }
}

const PASSWORD_TIMEOUT_MS = 20_000;
const PASSWORD_TIMEOUT_MESSAGE = "O servidor de autenticação demorou demais para responder. Tente novamente.";

/**
 * Troca a senha pelo Firebase Authentication: reautentica com a senha atual (exigência do Firebase para
 * operações sensíveis) e só então chama `updatePassword`. A senha nunca passa pela API MobiFix.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.email) throw new ApiError(401, "Sua sessão expirou. Entre novamente para continuar.");

  try {
    await withTimeout(
      reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword)),
      PASSWORD_TIMEOUT_MS,
      PASSWORD_TIMEOUT_MESSAGE,
    );
  } catch (error) {
    const code = getErrorCode(error);
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") throw new WrongCurrentPasswordError();
    throw error;
  }
  await withTimeout(updatePassword(user, newPassword), PASSWORD_TIMEOUT_MS, PASSWORD_TIMEOUT_MESSAGE);
}
