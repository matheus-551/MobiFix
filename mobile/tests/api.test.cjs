const { test } = require('node:test');
const assert = require('node:assert/strict');
const { carregar } = require('./loader.cjs');
const resposta = (status, body = {}) => ({ status, ok: status >= 200 && status < 300, json: async () => body });
function montar(fetch, usuario, globais = {}) {
  const auth = { currentUser: usuario ?? { uid: 'firebase-A', getIdToken: async () => 'token-A' } };
  return { auth, ...carregar('src/services/api.ts', { '../config/firebase': { auth } }, { fetch, ...globais }) };
}
test('envia ID token e JSON, sem enviar UID como autorização', async () => {
  const { api } = montar(async (url, opts) => {
    assert.equal(url, 'http://api.test/api/v1/usuarios');
    assert.equal(opts.headers.Authorization, 'Bearer token-A');
    assert.equal(opts.headers.Accept, 'application/json');
    assert.equal(opts.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(opts.body), { nome: 'Ana' });
    return resposta(201, { id: 'interno' });
  });
  assert.equal((await api('/usuarios', { method: 'POST', body: { nome: 'Ana' } })).id, 'interno');
});
test('consulta pública não exige sessão nem envia token', async () => {
  const ctx = montar(async (_, opts) => { assert.equal(opts.headers.Authorization, undefined); return resposta(200, []); });
  ctx.auth.currentUser = null;
  assert.equal((await ctx.api('/tipos-veiculo', { publica: true })).length, 0);
});
test('sem sessão bloqueia rota protegida antes da rede', async () => {
  const ctx = montar(() => assert.fail('não pode acessar a rede')); ctx.auth.currentUser = null;
  await assert.rejects(ctx.api('/usuarios/me'), e => e.status === 401);
});
test('401 renova token e tenta uma única vez', async () => {
  const renovacoes = []; let chamadas = 0;
  const { api } = montar(async (_, opts) => {
    chamadas++; assert.equal(opts.headers.Authorization, chamadas === 1 ? 'Bearer antigo' : 'Bearer novo');
    return resposta(chamadas === 1 ? 401 : 200);
  }, { uid: 'uid', getIdToken: async forcar => { renovacoes.push(forcar); return forcar ? 'novo' : 'antigo'; } });
  await api('/usuarios/me'); assert.equal(chamadas, 2); assert.deepEqual(renovacoes, [false, true]);
});
test('401 persistente não entra em loop', async () => {
  let chamadas = 0;
  const { api } = montar(async () => { chamadas++; return resposta(401); });
  await assert.rejects(api('/usuarios/me'), e => e.status === 401); assert.equal(chamadas, 2);
});
test('503 não renova token nem repete escrita', async () => {
  let chamadas = 0;
  const { api } = montar(async () => { chamadas++; return resposta(503); });
  await assert.rejects(api('/usuarios', { method: 'POST' }), e => e.status === 503); assert.equal(chamadas, 1);
});
test('troca de conta durante obtenção do token bloqueia envio', async () => {
  const usuario = { uid: 'A', getIdToken: async () => { ctx.auth.currentUser = { uid: 'B' }; return 'token-A'; } };
  const ctx = montar(() => assert.fail('não pode enviar token da conta anterior'), usuario);
  await assert.rejects(ctx.api('/usuarios/me'), e => e.status === 401);
});
test('troca de conta durante resposta descarta dados antigos', async () => {
  const ctx = montar(async () => { ctx.auth.currentUser = { uid: 'B' }; return resposta(200, { id: 'A' }); });
  await assert.rejects(ctx.api('/usuarios/me'), e => e.status === 401);
});
test('UID esperado impede misturar etapas de duas contas', async () => {
  const { api } = montar(() => assert.fail('não pode acessar a rede'));
  await assert.rejects(api('/usuarios/me', { uidEsperado: 'outra-conta' }), e => e.status === 401);
});
test('erro de campos preserva mensagem da API', async () => {
  const { api } = montar(async () => resposta(422, { errors: [{ field: 'telefone', message: 'inválido' }] }));
  await assert.rejects(api('/usuarios'), e => e.status === 422 && e.message.includes('telefone: inválido'));
});
test('204 não tenta interpretar JSON', async () => {
  const { api } = montar(async () => ({ status: 204, ok: true, json: () => assert.fail('sem corpo') }));
  assert.equal(await api('/usuarios/me', { method: 'DELETE' }), undefined);
});
test('erro de conexão é recuperável e não vira sessão ausente', async () => {
  const { api } = montar(async () => { throw new TypeError('offline'); });
  await assert.rejects(api('/usuarios/me'), e => e.status === 0 && e.message.includes('conectar'));
});
test('URL ausente não produz requisição para endereço incorreto', async () => {
  const { api } = montar(() => assert.fail('não pode acessar a rede'), undefined, { process: { env: {} } });
  await assert.rejects(api('/usuarios/me'), e => e.status === 0 && e.message.includes('endereço'));
});
