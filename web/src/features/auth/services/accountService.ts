import { doc, getDoc, onSnapshot, type Timestamp, type Unsubscribe } from "firebase/firestore";
import { getDb } from "@/shared/lib/firebase/client";
import { toDate } from "@/shared/utils/firestore";
import type {
  ClientProfile,
  ProviderApprovalStatus,
  ProviderProfile,
  UserAccount,
  UserRole,
  UserStatus,
} from "@/shared/types/domain";

interface AccountData {
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

function toAccount(data: AccountData): UserAccount {
  return {
    email: data.email,
    role: data.role,
    status: data.status,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/** Observa `users/{uid}`; `null` indica que o documento ainda não existe. */
export function subscribeToAccount(
  uid: string,
  onChange: (account: UserAccount | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(getDb(), "users", uid),
    (snapshot) => onChange(snapshot.exists() ? toAccount(snapshot.data() as AccountData) : null),
    onError,
  );
}

export async function getClientProfile(uid: string): Promise<ClientProfile | null> {
  const snapshot = await getDoc(doc(getDb(), "clientProfiles", uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Omit<ClientProfile, "createdAt" | "updatedAt"> & {
    createdAt: Timestamp | null;
    updatedAt: Timestamp | null;
  };
  return { ...data, createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) };
}

export async function getProviderProfile(uid: string): Promise<ProviderProfile | null> {
  const snapshot = await getDoc(doc(getDb(), "providerProfiles", uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Omit<ProviderProfile, "createdAt" | "updatedAt" | "approvalStatus"> & {
    approvalStatus: ProviderApprovalStatus;
    createdAt: Timestamp | null;
    updatedAt: Timestamp | null;
  };
  return { ...data, createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) };
}