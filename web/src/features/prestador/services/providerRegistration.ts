import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { getDb } from "@/shared/lib/firebase/client";
import { onlyDigits } from "@/shared/utils/format";
import {
  createAccount,
  discardAccount,
  startVerification,
  type RegistrationResult,
} from "@/features/auth/services/authService";
import { syncApiUserAfterSignup } from "@/features/auth/services/apiAccountService";
import { splitFullName } from "@/features/auth/utils/apiUserSync";
import type { ProviderFormValues } from "../models/registration";

/**
 * Cadastro do prestador. Ordem: conta criada no Firebase Authentication (`createUserWithEmailAndPassword`,
 * e-mail ainda NÃO verificado) → escrita atômica de `users` + `providerProfiles` → (verificação ativa)
 * `sendEmailVerification`. Não há envio de imagens nem de documentos: `documents` nasce vazio. Qualquer falha
 * antes do envio do link desfaz a conta criada. O prestador nasce com `status: "pending"` e
 * `approvalStatus: "under_review"`; a aprovação é administrativa. O usuário na API (`POST /usuarios`, tipo
 * PRESTADOR) é criado em segundo plano logo após o cadastro, como no mobile, e repetido sob demanda
 * (`ensureApiProviderUser`) se a API estiver fora do ar. O perfil profissional da API é completado em
 * /prestador/perfil, pois exige endereço completo (CEP, número, bairro) que este formulário não coleta.
 */
export async function registerProvider(values: ProviderFormValues): Promise<RegistrationResult> {
  const email = values.email.trim().toLowerCase();
  const responsibleName = values.responsibleName.trim();

  const user = await createAccount(email, values.password, responsibleName);

  try {
    const db = getDb();
    const batch = writeBatch(db);
    batch.set(doc(db, "users", user.uid), {
      email,
      role: "provider",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, "providerProfiles", user.uid), {
      responsibleName,
      displayName: values.companyName.trim(),
      phone: values.phone,
      taxIdType: values.taxIdType,
      taxId: onlyDigits(values.taxId),
      address: values.address.trim(),
      city: values.city.trim(),
      state: values.state,
      vehicleTypeIds: values.vehicleTypeIds,
      specialtyIds: values.specialtyIds,
      documents: [],
      approvalStatus: "under_review",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    await discardAccount(user);
    throw error;
  }

  syncApiUserAfterSignup("PRESTADOR", {
    ...splitFullName(responsibleName),
    email,
    telefone: values.phone,
    uf: values.state,
  });
  return startVerification(user);
}
