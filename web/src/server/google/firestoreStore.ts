import { ConflictError, type DocStore, type StoredData, type StoredDoc } from "../emailVerification/types";
import { getAccessToken, type ServerEnv } from "./serviceAccount";

/**
 * DocStore sobre a API REST do Firestore, autenticado com a conta de serviço (ignora as regras de
 * segurança, que negam tudo às coleções de verificação). Escritas usam pré-condição (`updateTime` /
 * `exists: false`) para concorrência otimista, o que garante contagem correta de tentativas.
 */
type FirestoreValue = { stringValue: string } | { integerValue: string } | { booleanValue: boolean };
type FirestoreDoc = { name: string; fields?: Record<string, FirestoreValue>; updateTime: string };

function encode(data: StoredData): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") fields[key] = { stringValue: value };
    else if (typeof value === "number") fields[key] = { integerValue: String(Math.trunc(value)) };
    else if (typeof value === "boolean") fields[key] = { booleanValue: value };
  }
  return fields;
}

function decode<T>(fields: Record<string, FirestoreValue> = {}): T {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(fields)) {
    if ("stringValue" in value) out[key] = value.stringValue;
    else if ("integerValue" in value) out[key] = Number(value.integerValue);
    else if ("booleanValue" in value) out[key] = value.booleanValue;
  }
  return out as T;
}

export function createFirestoreStore(env: ServerEnv, fetchImpl: typeof fetch = fetch): DocStore {
  const base = `https://firestore.googleapis.com/v1/projects/${env.projectId}/databases/(default)/documents`;

  async function headers() {
    return { Authorization: `Bearer ${await getAccessToken(env, fetchImpl)}`, "Content-Type": "application/json" };
  }

  return {
    async get<T extends StoredData>(collection: string, id: string): Promise<StoredDoc<T> | null> {
      const response = await fetchImpl(`${base}/${collection}/${id}`, { headers: await headers(), cache: "no-store" });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Firestore GET ${response.status}`);
      const doc = (await response.json()) as FirestoreDoc;
      return { data: decode<T>(doc.fields), version: doc.updateTime };
    },

    async save(collection: string, id: string, data: StoredData, expectedVersion: string | null): Promise<void> {
      const response = await fetchImpl(`${base}:commit`, {
        method: "POST",
        headers: await headers(),
        cache: "no-store",
        body: JSON.stringify({
          writes: [
            {
              update: { name: `${base.replace("https://firestore.googleapis.com/v1/", "")}/${collection}/${id}`, fields: encode(data) },
              currentDocument: expectedVersion === null ? { exists: false } : { updateTime: expectedVersion },
            },
          ],
        }),
      });
      if (response.ok) return;
      const body = (await response.json().catch(() => null)) as { error?: { status?: string } } | null;
      const status = body?.error?.status;
      if (status === "FAILED_PRECONDITION" || status === "ALREADY_EXISTS" || status === "ABORTED") throw new ConflictError();
      throw new Error(`Firestore commit ${response.status} ${status ?? ""}`);
    },
  };
}
