import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, it } from "node:test";
import { ApiError } from "../../../shared/lib/api/ApiError";
import { isPublicApiRequest } from "../../../shared/lib/api/publicRoutes";
import { parseBooleanFlag } from "../../../shared/utils/flags";
import { TimeoutError, createTimeoutSignal, withTimeout } from "../../../shared/utils/timeout";
import { resolveRouteProtection } from "../config/routeProtection";
import { parseAuthActionParams } from "./authActionParams";
import { splitFullName, syncApiUser, type ApiCall } from "./apiUserSync";
import { isContinueUrlError } from "./continueUrlError";
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

describe("parseBooleanFlag (chave de verificação de e-mail)", () => {
  it("reconhece valores verdadeiros e falsos, sem diferenciar maiúsculas nem espaços", () => {
    for (const value of ["true", "TRUE", " 1 ", "yes", "on", "sim"]) assert.equal(parseBooleanFlag(value, false), true, value);
    for (const value of ["false", "False", "0", " no ", "off", "não", "nao"]) assert.equal(parseBooleanFlag(value, true), false, value);
  });

  it("usa o padrão quando ausente, vazio ou irreconhecível", () => {
    assert.equal(parseBooleanFlag(undefined, true), true);
    assert.equal(parseBooleanFlag("", true), true);
    assert.equal(parseBooleanFlag("talvez", false), false);
    assert.equal(parseBooleanFlag(null, true), true);
  });
});

describe("isPublicApiRequest (rotas sem token)", () => {
  it("considera públicas só as rotas GET liberadas pela API", () => {
    for (const path of ["/tipos-veiculo", "/especialidades", "/prestadores", "/prestadores/12", "/prestadores/12/horarios"]) {
      assert.equal(isPublicApiRequest("GET", path), true, path);
    }
  });

  it("mantém protegidas as rotas do usuário logado e os métodos de escrita", () => {
    for (const path of ["/usuarios/me", "/veiculos/me", "/prestadores/me", "/prestadores/me/perfil", "/prestadores/me/horarios"]) {
      assert.equal(isPublicApiRequest("GET", path), false, path);
    }
    assert.equal(isPublicApiRequest("POST", "/usuarios"), false);
    assert.equal(isPublicApiRequest("DELETE", "/prestadores/12"), false);
  });
});

describe("limites de tempo (login/API sem resposta)", () => {
  it("withTimeout devolve o valor quando a operação termina a tempo", async () => {
    assert.equal(await withTimeout(Promise.resolve(42), 200), 42);
  });

  it("withTimeout rejeita com TimeoutError e a mensagem informada quando a operação nunca termina", async () => {
    const never = new Promise<never>(() => undefined);
    await assert.rejects(withTimeout(never, 30, "demorou"), (error: unknown) => {
      assert.ok(error instanceof TimeoutError);
      assert.equal((error as TimeoutError).message, "demorou");
      return true;
    });
  });

  it("withTimeout repassa o erro original (ex.: senha incorreta) sem trocá-lo por timeout", async () => {
    const failure = new Error("auth/invalid-credential");
    await assert.rejects(withTimeout(Promise.reject(failure), 200), (error: unknown) => error === failure);
  });

  it("aborta um fetch contra um servidor que aceita a conexão e nunca responde", async () => {
    const server = createServer(() => {
      /* nunca responde: simula a API pendurada */
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    const timeout = createTimeoutSignal(150);
    const started = Date.now();
    try {
      await assert.rejects(fetch(`http://127.0.0.1:${port}/api/v1/usuarios/me`, { signal: timeout.signal }));
      assert.equal(timeout.timedOut, true);
      assert.ok(Date.now() - started < 2000, "deveria abortar logo após o limite");
    } finally {
      timeout.clear();
      server.closeAllConnections();
      server.close();
    }
  });

  it("cancelamento feito pelo chamador não é tratado como tempo esgotado", async () => {
    const parent = new AbortController();
    const timeout = createTimeoutSignal(5000, parent.signal);
    parent.abort();
    assert.equal(timeout.signal.aborted, true);
    assert.equal(timeout.timedOut, false);
    timeout.clear();
  });

  it("uma resposta rápida da API não é afetada pelo limite", async () => {
    const server = createServer((_request, response) => {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ ok: true }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    const timeout = createTimeoutSignal(2000);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/x`, { signal: timeout.signal });
      assert.deepEqual(await response.json(), { ok: true });
      assert.equal(timeout.timedOut, false);
    } finally {
      timeout.clear();
      server.closeAllConnections();
      server.close();
    }
  });
});


describe("proteção de rotas (chave central)", () => {
  it("fica ATIVADA por padrão (variável ausente, vazia ou irreconhecível)", () => {
    assert.equal(resolveRouteProtection(undefined, "development"), true);
    assert.equal(resolveRouteProtection("", "development"), true);
    assert.equal(resolveRouteProtection("talvez", "development"), true);
  });

  it("só desativa em desenvolvimento, com valor falso explícito", () => {
    assert.equal(resolveRouteProtection("false", "development"), false);
    assert.equal(resolveRouteProtection("0", "development"), false);
    assert.equal(resolveRouteProtection("false", undefined), false);
    assert.equal(resolveRouteProtection("true", "development"), true);
  });

  it("em produção a proteção é sempre ligada, mesmo com a variável em false", () => {
    assert.equal(resolveRouteProtection("false", "production"), true);
    assert.equal(resolveRouteProtection("0", "production"), true);
  });
});

describe("URL de retorno recusada pelo Firebase", () => {
  it("reconhece os códigos que justificam reenviar sem URL de retorno", () => {
    assert.equal(isContinueUrlError("auth/unauthorized-continue-uri"), true);
    assert.equal(isContinueUrlError("auth/invalid-continue-uri"), true);
    assert.equal(isContinueUrlError("auth/missing-continue-uri"), true);
  });

  it("não mascara outros erros (limite de envios, rede, usuário inexistente)", () => {
    assert.equal(isContinueUrlError("auth/too-many-requests"), false);
    assert.equal(isContinueUrlError("auth/network-request-failed"), false);
    assert.equal(isContinueUrlError(null), false);
    assert.equal(isContinueUrlError(undefined), false);
  });
});

describe("sincronização do usuário na API (mesma regra do mobile)", () => {
  const CREATE = { nome: " Maria ", sobrenome: " Silva ", email: "maria@exemplo.com", telefone: "(81) 99999-8888", uf: "PE" };
  const USER = { id: "u1", nome: "Maria", sobrenome: "Silva", email: "maria@exemplo.com", telefone: "81999998888", uf: "PE", tipo: "CLIENTE", ativo: true };

  /** Requisição falsa: registra as chamadas e responde conforme o roteiro. */
  function fakeApi(script: Record<string, unknown[]>) {
    const calls: { path: string; method: string; body?: unknown }[] = [];
    const request: ApiCall = async <T,>(path: string, options?: { method?: "POST"; body?: unknown }) => {
      const method = options?.method ?? "GET";
      calls.push({ path, method, body: options?.body });
      const queue = script[`${method} ${path}`] ?? [];
      const next = queue.shift();
      if (next instanceof Error) throw next;
      return next as T;
    };
    return { request, calls };
  }

  it("usa o usuário existente sem criar outro", async () => {
    const { request, calls } = fakeApi({ "GET /usuarios/me": [USER] });
    assert.deepEqual(await syncApiUser(request, "CLIENTE", CREATE), USER);
    assert.deepEqual(calls.map((c) => `${c.method} ${c.path}`), ["GET /usuarios/me"]);
  });

  it("404 em /usuarios/me → POST /usuarios com telefone só com dígitos, nomes aparados e tipo", async () => {
    const { request, calls } = fakeApi({
      "GET /usuarios/me": [new ApiError(404, "não existe")],
      "POST /usuarios": [USER],
    });
    await syncApiUser(request, "CLIENTE", CREATE);
    assert.deepEqual(calls[1], {
      path: "/usuarios",
      method: "POST",
      body: { nome: "Maria", sobrenome: "Silva", email: "maria@exemplo.com", telefone: "81999998888", uf: "PE", tipo: "CLIENTE" },
    });
  });

  it("409 no POST (criação concorrente): só vale se /usuarios/me passar a existir", async () => {
    const ok = fakeApi({
      "GET /usuarios/me": [new ApiError(404, "x"), USER],
      "POST /usuarios": [new ApiError(409, "já existe")],
    });
    assert.deepEqual(await syncApiUser(ok.request, "CLIENTE", CREATE), USER);

    const falha = fakeApi({
      "GET /usuarios/me": [new ApiError(404, "x"), new ApiError(404, "x")],
      "POST /usuarios": [new ApiError(409, "e-mail em uso")],
    });
    await assert.rejects(syncApiUser(falha.request, "CLIENTE", CREATE), (e: unknown) => e instanceof ApiError && e.status === 409);
  });

  it("sem dados para criar, 404 vira erro e nada é enviado", async () => {
    const { request, calls } = fakeApi({ "GET /usuarios/me": [new ApiError(404, "x")] });
    await assert.rejects(syncApiUser(request, "CLIENTE", null), (e: unknown) => e instanceof ApiError && e.status === 404);
    assert.equal(calls.length, 1);
  });

  it("propaga erros que não são 404 (ex.: 401, 503) sem tentar criar", async () => {
    const { request, calls } = fakeApi({ "GET /usuarios/me": [new ApiError(503, "indisponível")] });
    await assert.rejects(syncApiUser(request, "CLIENTE", CREATE), (e: unknown) => e instanceof ApiError && e.status === 503);
    assert.equal(calls.length, 1);
  });

  it("recusa conta desativada e conta de outro tipo", async () => {
    const inativa = fakeApi({ "GET /usuarios/me": [{ ...USER, ativo: false }] });
    await assert.rejects(syncApiUser(inativa.request, "CLIENTE", CREATE), (e: unknown) => e instanceof ApiError && e.status === 403);

    const outroTipo = fakeApi({ "GET /usuarios/me": [{ ...USER, tipo: "PRESTADOR" }] });
    await assert.rejects(syncApiUser(outroTipo.request, "CLIENTE", CREATE), (e: unknown) => e instanceof ApiError && e.status === 409);
  });

  it("separa nome e sobrenome (nome único repete-se, pois a API exige os dois)", () => {
    assert.deepEqual(splitFullName("  Maria  da Silva "), { nome: "Maria", sobrenome: "da Silva" });
    assert.deepEqual(splitFullName("Madonna"), { nome: "Madonna", sobrenome: "Madonna" });
  });
});
