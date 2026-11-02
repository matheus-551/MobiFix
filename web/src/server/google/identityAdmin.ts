import { EmailAlreadyExistsError, type IdentityAdmin } from "../emailVerification/types";
import { getAccessToken, type ServerEnv } from "./serviceAccount";

/** Operações administrativas do Firebase Authentication (Identity Toolkit REST) feitas só no servidor. */
export function createIdentityAdmin(env: ServerEnv, fetchImpl: typeof fetch = fetch): IdentityAdmin {
  const base = `https://identitytoolkit.googleapis.com/v1/projects/${env.projectId}`;

  async function post(path: string, body: unknown): Promise<Response> {
    return fetchImpl(`${base}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await getAccessToken(env, fetchImpl)}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  }

  return {
    async emailExists(email) {
      const response = await post("/accounts:lookup", { email: [email] });
      if (!response.ok) throw new Error(`Identity lookup ${response.status}`);
      const data = (await response.json()) as { users?: unknown[] };
      return Array.isArray(data.users) && data.users.length > 0;
    },

    async createVerifiedUser({ email, password, displayName }) {
      const response = await post("/accounts", { email, password, displayName, emailVerified: true });
      if (response.ok) {
        const data = (await response.json()) as { localId: string };
        return { uid: data.localId };
      }
      const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (body?.error?.message?.startsWith("EMAIL_EXISTS")) throw new EmailAlreadyExistsError();
      throw new Error(`Identity create ${response.status} ${body?.error?.message ?? ""}`);
    },
  };
}
