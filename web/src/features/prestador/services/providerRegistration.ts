import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { deleteObject, ref, uploadBytes } from "firebase/storage";
import { getDb, getFirebaseStorage } from "@/shared/lib/firebase/client";
import { onlyDigits } from "@/shared/utils/format";
import {
  createAccount,
  discardAccount,
  dispatchVerificationEmail,
  type RegistrationResult,
} from "@/features/auth/services/authService";
import type { ProviderDocument } from "@/shared/types/domain";
import {
  DOCUMENT_KIND_BY_FIELD,
  type DocumentField,
  type ProviderFormValues,
} from "../models/registration";

function safeFileName(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

/**
 * Cadastro do prestador. Ordem: conta criada no Firebase Authentication (`createUserWithEmailAndPassword`,
 * e-mail ainda NÃO verificado) → upload dos documentos → escrita atômica de `users` + `providerProfiles`
 * → `sendEmailVerification`. Os documentos precisam subir agora (ficam em memória no formulário), por isso
 * as regras do Storage permitem o envio ao dono da conta mesmo antes da verificação; todo o resto do
 * sistema exige e-mail verificado. Qualquer falha antes do envio do link desfaz o que foi criado
 * (arquivos e conta). O prestador nasce com `status: "pending"` e `approvalStatus: "under_review"`;
 * a aprovação é administrativa. O usuário na API é criado sob demanda (`ensureApiProviderUser`).
 */
export async function registerProvider(values: ProviderFormValues): Promise<RegistrationResult> {
  const email = values.email.trim().toLowerCase();
  const responsibleName = values.responsibleName.trim();

  const user = await createAccount(email, values.password, responsibleName);
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
    await discardAccount(user);
    throw error;
  }

  return { verificationEmailSent: await dispatchVerificationEmail(user) };
}
