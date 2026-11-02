import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createVerificationService } from "./service";
import { VERIFICATION_LIMITS as L } from "./config";
import {
  ConflictError,
  EmailAlreadyExistsError,
  VerificationError,
  type DocStore,
  type IdentityAdmin,
  type Mailer,
  type StoredData,
  type StoredDoc,
} from "./types";

/** Armazenamento em memória com a mesma semântica de concorrência otimista do Firestore. */
function memoryStore(): DocStore & { docs: Map<string, { data: StoredData; v: number }> } {
  const docs = new Map<string, { data: StoredData; v: number }>();
  return {
    docs,
    async get<T extends StoredData>(c: string, id: string): Promise<StoredDoc<T> | null> {
      const hit = docs.get(`${c}/${id}`);
      return hit ? { data: structuredClone(hit.data) as T, version: String(hit.v) } : null;
    },
    async save(c, id, data, expected) {
      const hit = docs.get(`${c}/${id}`);
      if (expected === null ? hit !== undefined : !hit || String(hit.v) !== expected) throw new ConflictError();
      docs.set(`${c}/${id}`, { data: structuredClone(data), v: (hit?.v ?? 0) + 1 });
    },
  };
}

function setup(opts: { sendFails?: boolean; existing?: string[] } = {}) {
  let t = 1_000_000;
  const sent: { to: string; code: string }[] = [];
  const created: string[] = [];
  const existing = new Set(opts.existing ?? []);
  const mailer: Mailer = {
    async sendVerificationCode(to, code) {
      if (opts.sendFails) throw new Error("smtp down");
      sent.push({ to, code });
    },
  };
  const identity: IdentityAdmin = {
    async emailExists(email) {
      return existing.has(email);
    },
    async createVerifiedUser({ email }) {
      if (existing.has(email)) throw new EmailAlreadyExistsError();
      existing.add(email);
      created.push(email);
      return { uid: `uid-${created.length}` };
    },
  };
  let n = 0;
  const store = memoryStore();
  const service = createVerificationService({
    store,
    mailer,
    identity,
    secret: "s".repeat(40),
    now: () => t,
    generateCode: () => String(123456 + n++),
  });
  return { service, sent, created, store, advance: (ms: number) => (t += ms) };
}

const IP = "203.0.113.9";
const EMAIL = "Ana@Example.com";
const code = (s: { sent: { code: string }[] }) => s.sent[s.sent.length - 1].code;

async function rejects(promise: Promise<unknown>, expected: string) {
  await assert.rejects(promise, (error: unknown) => error instanceof VerificationError && error.code === expected);
}

describe("verificação de e-mail por código", () => {
  it("envia o código, confirma e cria a conta verificada (fluxo completo)", async () => {
    const s = setup();
    await s.service.requestCode(EMAIL, IP);
    assert.equal(s.sent.length, 1);
    assert.equal(s.sent[0].to, "ana@example.com");
    assert.match(code(s), /^\d{6}$/);

    const { token } = await s.service.confirmCode(EMAIL, code(s), IP);
    const account = await s.service.createVerifiedAccount({ email: EMAIL, token, password: "senha1234", displayName: "Ana Silva" });
    assert.equal(account.uid, "uid-1");
    assert.deepEqual(s.created, ["ana@example.com"]);
  });

  it("não grava o código em claro", async () => {
    const s = setup();
    await s.service.requestCode(EMAIL, IP);
    const dump = JSON.stringify([...s.store.docs.values()]);
    assert.ok(!dump.includes(code(s)));
  });

  it("código incorreto: informa tentativas restantes e bloqueia ao esgotar", async () => {
    const s = setup();
    await s.service.requestCode(EMAIL, IP);
    for (let i = 1; i < L.maxAttempts; i++) {
      await assert.rejects(s.service.confirmCode(EMAIL, "000000", IP), (e: unknown) =>
        e instanceof VerificationError && e.code === "invalid_code" && e.extra.attemptsLeft === L.maxAttempts - i);
    }
    await rejects(s.service.confirmCode(EMAIL, "000000", IP), "too_many_attempts");
    // Depois de bloqueado, nem o código certo funciona.
    await rejects(s.service.confirmCode(EMAIL, code(s), IP), "too_many_attempts");
  });

  it("código expirado é recusado", async () => {
    const s = setup();
    await s.service.requestCode(EMAIL, IP);
    s.advance(L.codeTtlMs + 1000);
    await rejects(s.service.confirmCode(EMAIL, code(s), IP), "expired");
  });

  it("código não pode ser reutilizado", async () => {
    const s = setup();
    await s.service.requestCode(EMAIL, IP);
    const first = code(s);
    await s.service.confirmCode(EMAIL, first, IP);
    await rejects(s.service.confirmCode(EMAIL, first, IP), "already_used");
  });

  it("confirmar sem ter solicitado código", async () => {
    await rejects(setup().service.confirmCode(EMAIL, "123456", IP), "no_code");
  });

  it("reenvio: respeita o intervalo mínimo e invalida o código anterior", async () => {
    const s = setup();
    await s.service.requestCode(EMAIL, IP);
    const old = code(s);
    await assert.rejects(s.service.requestCode(EMAIL, IP), (e: unknown) =>
      e instanceof VerificationError && e.code === "rate_limited" && (e.extra.retryAfter ?? 0) > 0);
    s.advance(L.resendCooldownMs + 1);
    await s.service.requestCode(EMAIL, IP);
    assert.notEqual(code(s), old);
    await rejects(s.service.confirmCode(EMAIL, old, IP), "invalid_code");
    await s.service.confirmCode(EMAIL, code(s), IP);
  });

  it("limita envios por hora para o mesmo e-mail", async () => {
    const s = setup();
    for (let i = 0; i < L.maxSendsPerHour; i++) {
      await s.service.requestCode(EMAIL, IP);
      s.advance(L.resendCooldownMs + 1);
    }
    await rejects(s.service.requestCode(EMAIL, IP), "rate_limited");
    s.advance(L.hourMs);
    await s.service.requestCode(EMAIL, IP);
  });

  it("limita pedidos por IP mesmo com e-mails diferentes", async () => {
    const s = setup();
    for (let i = 0; i < L.maxRequestsPerIpPerHour; i++) await s.service.requestCode(`u${i}@example.com`, IP);
    await rejects(s.service.requestCode("outro@example.com", IP), "rate_limited");
    await s.service.requestCode("outro@example.com", "198.51.100.1");
  });

  it("recusa e-mail que já tem conta e e-mail inválido", async () => {
    const s = setup({ existing: ["ana@example.com"] });
    await rejects(s.service.requestCode(EMAIL, IP), "email_in_use");
    await rejects(s.service.requestCode("nao-e-email", IP), "invalid_input");
    assert.equal(s.sent.length, 0);
  });

  it("falha no envio: erro claro, código invalidado e sem cooldown", async () => {
    const s = setup({ sendFails: true });
    await rejects(s.service.requestCode(EMAIL, IP), "send_failed");
    await rejects(s.service.confirmCode(EMAIL, "123456", IP), "too_many_attempts");
    await rejects(s.service.requestCode(EMAIL, IP), "send_failed"); // sem 429: pode tentar de novo
  });

  it("token: uso único, preso ao e-mail e com validade", async () => {
    const s = setup();
    await s.service.requestCode(EMAIL, IP);
    const { token } = await s.service.confirmCode(EMAIL, code(s), IP);
    const base = { password: "senha1234", displayName: "Ana Silva" };

    await rejects(s.service.createVerifiedAccount({ ...base, email: "outra@example.com", token }), "invalid_token");
    await rejects(s.service.createVerifiedAccount({ ...base, email: EMAIL, token: "x".repeat(43) }), "invalid_token");
    await s.service.createVerifiedAccount({ ...base, email: EMAIL, token });
    await rejects(s.service.createVerifiedAccount({ ...base, email: EMAIL, token }), "invalid_token");
  });

  it("token expirado", async () => {
    const s = setup();
    await s.service.requestCode(EMAIL, IP);
    const { token } = await s.service.confirmCode(EMAIL, code(s), IP);
    s.advance(L.tokenTtlMs + 1000);
    await rejects(s.service.createVerifiedAccount({ email: EMAIL, token, password: "senha1234", displayName: "Ana" }), "expired");
  });

  it("criação concorrente com o mesmo token: só uma conta é criada", async () => {
    const s = setup();
    await s.service.requestCode(EMAIL, IP);
    const { token } = await s.service.confirmCode(EMAIL, code(s), IP);
    const input = { email: EMAIL, token, password: "senha1234", displayName: "Ana" };
    const results = await Promise.allSettled([s.service.createVerifiedAccount(input), s.service.createVerifiedAccount(input)]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(s.created.length, 1);
  });

  it("valida a senha no servidor", async () => {
    const s = setup();
    await s.service.requestCode(EMAIL, IP);
    const { token } = await s.service.confirmCode(EMAIL, code(s), IP);
    await rejects(s.service.createVerifiedAccount({ email: EMAIL, token, password: "curta", displayName: "Ana" }), "invalid_input");
  });
});
