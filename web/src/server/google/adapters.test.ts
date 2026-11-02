import assert from "node:assert/strict";
import { generateKeyPairSync, createVerify } from "node:crypto";
import { describe, it } from "node:test";
import { createResendMailer } from "../email/resendMailer";
import { ConflictError, EmailAlreadyExistsError } from "../emailVerification/types";
import { createFirestoreStore } from "./firestoreStore";
import { createIdentityAdmin } from "./identityAdmin";
import { getAccessToken, readServerEnv, type ServerEnv } from "./serviceAccount";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const env: ServerEnv = {
  projectId: "demo-proj",
  clientEmail: "svc@demo-proj.iam.gserviceaccount.com",
  privateKey,
  secret: "s".repeat(40),
  resendApiKey: "re_test",
  emailFrom: "MobiFix <no-reply@example.com>",
};

type Call = { url: string; init: RequestInit };
function fakeFetch(handler: (call: Call) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const impl = (async (url: string | URL | Request, init: RequestInit = {}) => {
    const call = { url: String(url), init };
    calls.push(call);
    if (call.url === "https://oauth2.googleapis.com/token") {
      return Response.json({ access_token: "tok-123", expires_in: 3600 });
    }
    return handler(call);
  }) as typeof fetch;
  return { impl, calls };
}
const json = (call: Call) => JSON.parse(String(call.init.body));

describe("adaptadores de servidor (com fetch simulado)", () => {
  it("assina o JWT da conta de serviço (RS256) e troca por token OAuth", async () => {
    const f = fakeFetch(() => new Response("{}"));
    assert.equal(await getAccessToken(env, f.impl), "tok-123");
    const form = new URLSearchParams(String(f.calls[0].init.body));
    assert.equal(form.get("grant_type"), "urn:ietf:params:oauth:grant-type:jwt-bearer");
    const [h, c, sig] = form.get("assertion")!.split(".");
    assert.ok(createVerify("RSA-SHA256").update(`${h}.${c}`).verify(publicKey, Buffer.from(sig, "base64url")));
    const claims = JSON.parse(Buffer.from(c, "base64url").toString());
    assert.equal(claims.iss, env.clientEmail);
    assert.equal(claims.aud, "https://oauth2.googleapis.com/token");
  });

  it("Firestore: lê (404 = inexistente), grava com pré-condição e mapeia conflito", async () => {
    const f = fakeFetch((call) => {
      if (call.url.endsWith(":commit")) {
        const precondition = json(call).writes[0].currentDocument;
        return precondition.updateTime === "stale"
          ? Response.json({ error: { status: "FAILED_PRECONDITION" } }, { status: 400 })
          : Response.json({});
      }
      return call.url.endsWith("/missing")
        ? new Response("{}", { status: 404 })
        : Response.json({ name: "x", updateTime: "2026-01-01T00:00:00Z", fields: { attempts: { integerValue: "2" }, status: { stringValue: "pending" } } });
    });
    const store = createFirestoreStore(env, f.impl);
    assert.equal(await store.get("emailVerifications", "missing"), null);
    const doc = await store.get<never>("emailVerifications", "abc");
    assert.deepEqual(doc?.data, { attempts: 2, status: "pending" });
    assert.equal(doc?.version, "2026-01-01T00:00:00Z");

    await store.save("emailVerifications", "abc", { count: 1, windowStart: 5 }, null);
    const write = json(f.calls[f.calls.length - 1]).writes[0];
    assert.deepEqual(write.currentDocument, { exists: false });
    assert.equal(write.update.name, "projects/demo-proj/databases/(default)/documents/emailVerifications/abc");
    assert.deepEqual(write.update.fields, { count: { integerValue: "1" }, windowStart: { integerValue: "5" } });
    await assert.rejects(store.save("emailVerifications", "abc", { count: 1, windowStart: 5 }, "stale"), ConflictError);
  });

  it("Identity Toolkit: consulta e cria usuário com emailVerified", async () => {
    const f = fakeFetch((call) => {
      if (call.url.endsWith("/accounts:lookup")) {
        return Response.json(json(call).email[0] === "has@x.com" ? { users: [{ localId: "u1" }] } : {});
      }
      return json(call).email === "dup@x.com"
        ? Response.json({ error: { message: "EMAIL_EXISTS" } }, { status: 400 })
        : Response.json({ localId: "new-uid" });
    });
    const admin = createIdentityAdmin(env, f.impl);
    assert.equal(await admin.emailExists("has@x.com"), true);
    assert.equal(await admin.emailExists("none@x.com"), false);
    assert.deepEqual(await admin.createVerifiedUser({ email: "a@x.com", password: "senha1234", displayName: "Ana" }), { uid: "new-uid" });
    const body = json(f.calls[f.calls.length - 1]);
    assert.equal(body.emailVerified, true);
    assert.ok(f.calls[f.calls.length - 1].url.includes("/v1/projects/demo-proj/accounts"));
    assert.equal((f.calls[f.calls.length - 1].init.headers as Record<string, string>).Authorization, "Bearer tok-123");
    await assert.rejects(admin.createVerifiedUser({ email: "dup@x.com", password: "senha1234", displayName: "Ana" }), EmailAlreadyExistsError);
  });

  it("Resend: envia o código ao destinatário e falha em erro HTTP", async () => {
    const ok = fakeFetch(() => Response.json({ id: "1" }));
    await createResendMailer(env, ok.impl).sendVerificationCode("ana@x.com", "123456", 10);
    const body = json(ok.calls[0]);
    assert.equal(ok.calls[0].url, "https://api.resend.com/emails");
    assert.deepEqual(body.to, ["ana@x.com"]);
    assert.ok(body.text.includes("123456") && body.html.includes("123456"));
    assert.equal((ok.calls[0].init.headers as Record<string, string>).Authorization, "Bearer re_test");
    const bad = fakeFetch(() => new Response("nope", { status: 403 }));
    await assert.rejects(createResendMailer(env, bad.impl).sendVerificationCode("ana@x.com", "123456", 10));
  });

  it("configuração: recusa ambiente incompleto e segredo curto", () => {
    assert.throws(() => readServerEnv({} as NodeJS.ProcessEnv), /não está configurada/);
    const full = {
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "p", FIREBASE_ADMIN_CLIENT_EMAIL: "e", FIREBASE_ADMIN_PRIVATE_KEY: "k\\nk",
      EMAIL_VERIFICATION_SECRET: "curto", RESEND_API_KEY: "r", EMAIL_FROM: "f",
    } as unknown as NodeJS.ProcessEnv;
    assert.throws(() => readServerEnv(full), /não está configurada/);
    assert.equal(readServerEnv({ ...full, EMAIL_VERIFICATION_SECRET: "x".repeat(32) } as NodeJS.ProcessEnv).privateKey, "k\nk");
  });
});
