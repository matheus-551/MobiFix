import { createUserWithEmailAndPassword, deleteUser, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { deleteObject, ref, uploadBytes } from "firebase/storage";
import { getDb, getFirebaseAuth, getFirebaseStorage } from "@/shared/lib/firebase/client";
import { onlyDigits } from "@/shared/utils/format";
import type { ProviderDocument } from "@/shared/types/domain";
import { sendVerificationEmail, type RegistrationResult } from "@/features/auth/services/authService";
import {
  DOCUMENT_KIND_BY_FIELD,
  type DocumentField,
  type ProviderFormValues,
} from "../models/registration";

function safeFileName(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

/**
 * Cadastro do prestador. A conta só é criada ao final do fluxo, então não existem contas
 * "pela metade" quando o usuário abandona uma etapa. Ordem: Authentication → upload dos
 * documentos → escrita atômica de `users` + `providerProfiles`. Qualquer falha desfaz o
 * que foi criado (arquivos e conta). O prestador nasce com `status: "pending"` e
 * `approvalStatus: "under_review"`; a aprovação é uma ação administrativa posterior.
 */
export async function registerProvider(values: ProviderFormValues): Promise<RegistrationResult> {
  const auth = getFirebaseAuth();
  const email = values.email.trim().toLowerCase();
  const { user } = await createUserWithEmailAndPassword(auth, email, values.password);
  const uploadedPaths: string[] = [];

  try {
    await updateProfile(user, { displayName: values.responsibleName.trim() });

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
      responsibleName: values.responsibleName.trim(),
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

  return { verificationEmailSent: await sendVerificationEmail(user).then(() => true, () => false) };
}
