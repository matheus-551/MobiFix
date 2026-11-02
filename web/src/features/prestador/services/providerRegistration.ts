import { deleteUser } from "firebase/auth";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { deleteObject, ref, uploadBytes } from "firebase/storage";
import { getDb, getFirebaseAuth, getFirebaseStorage } from "@/shared/lib/firebase/client";
import { onlyDigits } from "@/shared/utils/format";
import { registerUserInApi, type ApiSyncResult } from "@/features/auth/services/apiRegistration";
import { signIn } from "@/features/auth/services/authService";
import { createVerifiedAccount } from "@/features/auth/services/emailVerificationService";
import type { ProviderDocument } from "@/shared/types/domain";
import {
  DOCUMENT_KIND_BY_FIELD,
  type DocumentField,
  type ProviderFormValues,
} from "../models/registration";

function safeFileName(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export interface ProviderRegistrationResult {
  /** Resultado do `POST /api/v1/usuarios` (tipo PRESTADOR); `ok: false` não desfaz o cadastro no Firebase. */
  api: ApiSyncResult;
}

/**
 * Cadastro do prestador, executado só depois da verificação do e-mail. A conta só é criada ao final
 * do fluxo, então não existem contas "pela metade" quando o usuário abandona uma etapa. Ordem:
 * conta criada pelo servidor com `emailVerified: true` (exige o token da verificação) → login →
 * upload dos documentos → escrita atômica de `users` + `providerProfiles` → `POST /api/v1/usuarios`
 * (PRESTADOR). Qualquer falha antes da API desfaz o que foi criado (arquivos e conta). O prestador
 * nasce com `status: "pending"` e `approvalStatus: "under_review"`; a aprovação é administrativa.
 *
 * O perfil profissional da API (`POST /prestadores/me/perfil`) NÃO é enviado aqui: ele exige logradouro,
 * número, bairro e CEP separados e IDs numéricos do catálogo da API, dados que este formulário não coleta
 * (o prestador completa em /prestador/perfil, que já usa esse contrato).
 */
export async function registerProvider(
  values: ProviderFormValues,
  verificationToken: string,
): Promise<ProviderRegistrationResult> {
  const email = values.email.trim().toLowerCase();
  const responsibleName = values.responsibleName.trim();

  await createVerifiedAccount({ email, token: verificationToken, password: values.password, displayName: responsibleName });
  await signIn(email, values.password, true);

  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sessão não iniciada após criar a conta.");
  const uploadedPaths: string[] = [];

  try {

    const storage = getFirebaseStorage();
    const documents: ProviderDocument[] = [];
    const fields: DocumentField[] = ["identityDocument", "businessProof"];

    for (const field of fields) {
      const file = values[field];
      if (!file) continue;
      const kind = DOCUMENT_KIND_BY_FIELD[field];
      const storagePath = `providerDocuments/${user.uid}/${kind}-${Date.now()}-${safeFileName(file.name)}`;
      await uploadBytes(ref(storage, storagePath), file, { contentType: file.type });
      uploadedPaths.push(storagePath);
      documents.push({ kind, fileName: file.name, contentType: file.type, size: file.size, storagePath });
    }

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
      documents,
      approvalStatus: "under_review",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    await Promise.all(uploadedPaths.map((path) => deleteObject(ref(getFirebaseStorage(), path)).catch(() => undefined)));
    await deleteUser(user).catch(() => undefined);
    throw error;
  }

  const [nome, ...rest] = responsibleName.split(/\s+/);
  const api = await registerUserInApi({
    nome,
    sobrenome: rest.join(" ") || nome,
    email,
    telefone: onlyDigits(values.phone),
    uf: values.state,
    tipo: "PRESTADOR",
  });
  return { api };
}
