import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientIp, errorResponse, readJson } from "./runtime";
import { VerificationError } from "./types";

describe("camada HTTP da verificação", () => {
  it("mapeia erros para status HTTP, JSON padronizado e Retry-After", async () => {
    const limited = errorResponse(new VerificationError("rate_limited", "Aguarde.", { retryAfter: 42 }));
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("Retry-After"), "42");
    assert.equal(limited.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await limited.json(), { code: "rate_limited", message: "Aguarde.", retryAfter: 42 });

    const wrong = errorResponse(new VerificationError("invalid_code", "Código incorreto.", { attemptsLeft: 3 }));
    assert.equal(wrong.status, 400);
    assert.equal((await wrong.json()).attemptsLeft, 3);
    assert.equal(errorResponse(new VerificationError("expired", "x")).status, 410);
    assert.equal(errorResponse(new VerificationError("email_in_use", "x")).status, 409);
    assert.equal(errorResponse(new VerificationError("not_configured", "x")).status, 503);
  });

  it("não vaza detalhes de erros inesperados", async () => {
    const original = console.error;
    console.error = () => undefined;
    try {
      const response = errorResponse(new Error("senha do banco: 1234"));
      assert.equal(response.status, 500);
      assert.ok(!JSON.stringify(await response.json()).includes("1234"));
    } finally {
      console.error = original;
    }
  });

  it("lê JSON válido, rejeita corpo inválido e extrai o IP", async () => {
    const ok = new Request("http://x/api", { method: "POST", body: JSON.stringify({ a: 1 }) });
    assert.deepEqual(await readJson(ok), { a: 1 });
    await assert.rejects(readJson(new Request("http://x/api", { method: "POST", body: "nao-json" })), VerificationError);
    await assert.rejects(readJson(new Request("http://x/api", { method: "POST", body: "[1]" })), VerificationError);
    assert.equal(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } })), "1.2.3.4");
    assert.equal(clientIp(new Request("http://x")), "unknown");
  });
});
