import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAuthActionParams } from "./authActionParams";
import {
  MAX_SENDS_PER_HOUR,
  RESEND_COOLDOWN_SECONDS,
  evaluateResend,
  pruneHistory,
  recordSend,
} from "./resendPolicy";

const T0 = 1_700_000_000_000;
const sec = (n: number) => n * 1000;

describe("resendPolicy", () => {
  it("permite o primeiro envio", () => {
    assert.deepEqual(evaluateResend([], T0), { allowed: true, waitSeconds: 0, reason: null });
  });

  it("bloqueia durante o intervalo mínimo e informa os segundos restantes", () => {
    const decision = evaluateResend([T0], T0 + sec(20));
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "cooldown");
    assert.equal(decision.waitSeconds, RESEND_COOLDOWN_SECONDS - 20);
  });

  it("libera exatamente ao fim do intervalo", () => {
    assert.equal(evaluateResend([T0], T0 + sec(RESEND_COOLDOWN_SECONDS)).allowed, true);
  });

  it("bloqueia ao atingir o limite por hora, mesmo fora do intervalo", () => {
    let history: number[] = [];
    for (let i = 0; i < MAX_SENDS_PER_HOUR; i++) history = recordSend(history, T0 + sec(i * 61));
    const now = T0 + sec(MAX_SENDS_PER_HOUR * 61);
    const decision = evaluateResend(history, now);
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "hourly");
    assert.ok(decision.waitSeconds > 0 && decision.waitSeconds <= 3600);
  });

  it("libera de novo quando o envio mais antigo sai da janela de 1 hora", () => {
    const history = Array.from({ length: MAX_SENDS_PER_HOUR }, (_, i) => T0 + sec(i * 61));
    assert.equal(evaluateResend(history, T0 + 3600_000 + sec(1)).allowed, true);
  });

  it("descarta valores inválidos e futuros do histórico", () => {
    assert.deepEqual(pruneHistory([Number.NaN, T0 + 5000, T0 - 10], T0), [T0 - 10]);
  });
});

describe("parseAuthActionParams", () => {
  const reader = (entries: Record<string, string>) => ({ get: (name: string) => entries[name] ?? null });

  it("aceita verifyEmail e resetPassword com oobCode", () => {
    assert.deepEqual(parseAuthActionParams(reader({ mode: "verifyEmail", oobCode: "abc" })), {
      mode: "verifyEmail",
      oobCode: "abc",
    });
    assert.equal(parseAuthActionParams(reader({ mode: "resetPassword", oobCode: "xyz" }))?.mode, "resetPassword");
  });

  it("rejeita link incompleto, modo desconhecido e código gigante", () => {
    assert.equal(parseAuthActionParams(reader({ mode: "verifyEmail" })), null);
    assert.equal(parseAuthActionParams(reader({ oobCode: "abc" })), null);
    assert.equal(parseAuthActionParams(reader({ mode: "recoverEmail", oobCode: "abc" })), null);
    assert.equal(parseAuthActionParams(reader({ mode: "verifyEmail", oobCode: "a".repeat(513) })), null);
  });
});
