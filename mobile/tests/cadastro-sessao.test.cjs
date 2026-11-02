const { test } = require('node:test');
const assert = require('node:assert/strict');
const { carregar } = require('./loader.cjs');
class ErroApi extends Error { constructor(status, message = 'erro') { super(message); this.status = status; } }
const conta = (tipo = 'CLIENTE') => ({ id: 'interno', tipo, ativo: true, nome: 'Ana', sobrenome: 'Silva', email: 'ana@example.com', telefone: '81999990001', uf: 'PE' });
const dados = { nome: ' Ana ', sobrenome: ' Silva ', email: 'injetado@example.com', telefone: '(81) 99999-0001', uf: 'PE', papel: 'CLIENTE', senha: 'senha12345' };
function montar(api, firebase = {}) {
  const auth = { currentUser: { uid: 'firebase-A', email: 'ana@example.com' } };
  const mocks = { '../config/firebase': { auth }, './api': { api, ErroApi }, 'firebase/auth': firebase };
  return { auth, servico: carregar('src/services/authService.ts', mocks), sessao: carregar('src/services/perfilService.ts', mocks) };
}
test('cadastro usa e-mail da identidade, tipo correto e telefone sem formatação', async () => {
  const chamadas = [];
  const { servico } = montar(async (url, opts) => {
    chamadas.push([url, opts]); if (url === '/usuarios/me') throw new ErroApi(404);
    assert.equal(opts.body.email, 'ana@example.com'); assert.equal(opts.body.telefone, '81999990001');
    assert.equal(opts.body.nome, 'Ana'); assert.equal(opts.body.tipo, 'CLIENTE');
    assert.equal(opts.body.senha, undefined); assert.equal(opts.body.firebaseId, undefined);
    assert.equal(opts.uidEsperado, 'firebase-A'); return conta();
  });
  await servico.concluirCadastro(dados); assert.equal(chamadas.length, 2);
});
test('perfil profissional pode ser retomado sem cadastrar usuário novamente', async () => {
  let usuarioExiste = false; let perfilExiste = false; let criacoesUsuario = 0; let criacoesPerfil = 0;
  const profissional = { nomeFantasia: 'Oficina', descricao: null, endereco: { logradouro: 'Rua A', numero: '1', bairro: 'Centro', cidade: 'Recife', uf: 'PE', cep: '50000000', complemento: null }, tiposVeiculoIds: [1], especialidadeIds: [2] };
  const { servico } = montar(async (url, opts = {}) => {
    if (url === '/usuarios/me') { if (!usuarioExiste) throw new ErroApi(404); return conta('PRESTADOR'); }
    if (url === '/usuarios') { usuarioExiste = true; criacoesUsuario++; return conta('PRESTADOR'); }
    if (opts.method === 'POST') {
      criacoesPerfil++; assert.deepEqual(opts.body, profissional);
      if (criacoesPerfil === 1) throw new ErroApi(503); perfilExiste = true; return { id: 'perfil' };
    }
    if (!perfilExiste) throw new ErroApi(404); return { id: 'perfil' };
  });
  const cadastro = { ...dados, papel: 'PRESTADOR', profissional };
  await assert.rejects(servico.concluirCadastro(cadastro), e => e.status === 503);
  await servico.concluirCadastro(cadastro); await servico.concluirCadastro(cadastro);
  assert.equal(criacoesUsuario, 1); assert.equal(criacoesPerfil, 2);
});
test('não apaga conta Firebase quando API falha e libera listener de sessão', async () => {
  let verificacoes = 0;
  const ctx = montar(async () => { throw new ErroApi(503); }, {
    createUserWithEmailAndPassword: async () => ({ user: ctx.auth.currentUser }),
    sendEmailVerification: async () => { verificacoes++; }, deleteUser: () => assert.fail('não deve apagar a identidade'),
  });
  const tarefa = ctx.servico.cadastrarUsuario(dados);
  await assert.rejects(tarefa, e => e.status === 503); await ctx.servico.aguardarCadastro();
  assert.equal(ctx.auth.currentUser.uid, 'firebase-A'); assert.equal(verificacoes, 1);
});
test('conta de outro tipo não é convertida pelo cadastro', async () => {
  const { servico } = montar(async () => conta('PRESTADOR'));
  await assert.rejects(servico.concluirCadastro(dados), e => e.status === 409);
});
test('duplicidade de e-mail não é tratada como cadastro concluído', async () => {
  const { servico } = montar(async url => { throw new ErroApi(url === '/usuarios' ? 409 : 404); });
  await assert.rejects(servico.concluirCadastro(dados), e => e.status === 409);
});
test('identidade sem cadastro local solicita conclusão do cadastro', async () => {
  const { sessao } = montar(async () => { throw new ErroApi(404); });
  assert.equal((await sessao.carregarSessao()).estado, 'cadastro');
});
test('503 de /me não é confundido com cadastro inexistente', async () => {
  const { sessao } = montar(async () => { throw new ErroApi(503); });
  await assert.rejects(sessao.carregarSessao(), e => e.status === 503);
});
test('conta inativa não entra na área principal', async () => {
  const { sessao } = montar(async () => ({ ...conta(), ativo: false }));
  assert.equal((await sessao.carregarSessao()).estado, 'inativa');
});
test('prestador sem perfil profissional não entra na área principal', async () => {
  const { sessao } = montar(async url => { if (url.includes('/prestadores')) throw new ErroApi(404); return conta('PRESTADOR'); });
  const resultado = await sessao.carregarSessao(); assert.equal(resultado.estado, 'cadastro'); assert.equal(resultado.usuario.tipo, 'PRESTADOR');
});
test('cliente ativo recebe perfil da API', async () => {
  const { sessao } = montar(async () => conta()); const resultado = await sessao.carregarSessao();
  assert.equal(resultado.estado, 'pronta'); assert.equal(resultado.perfil.id, 'interno'); assert.equal(resultado.perfil.papel, 'CLIENTE');
});
test('confirmar e-mail atualiza token sem acessar Firestore', async () => {
  let atualizacoes = 0; let renovacoes = 0;
  const ctx = montar(() => assert.fail('não deve gravar status na API'));
  ctx.auth.currentUser.reload = async () => { atualizacoes++; ctx.auth.currentUser.emailVerified = true; };
  ctx.auth.currentUser.getIdToken = async force => { assert.equal(force, true); renovacoes++; };
  assert.equal(await ctx.servico.atualizarVerificacao(), true); assert.equal(atualizacoes, 1); assert.equal(renovacoes, 1);
});
test('busca usa paginação e IDs dos catálogos, sem avaliações inventadas', async () => {
  const { buscarPrestadores } = carregar('src/services/prestadorService.ts', { './api': { api: async (url, opts) => {
    assert.equal(url, '/prestadores?size=20&page=2&tipoVeiculoId=3&especialidadeId=8'); assert.equal(opts.publica, true);
    return { content: [{ id: 'perfil-interno', nome: 'Oficina', cidade: 'Recife', uf: 'PE', tiposVeiculo: [{ id: 3, nome: 'Carro' }], especialidades: [{ id: 8, nome: 'Freios' }] }], page: 2, totalPages: 4 };
  } } });
  const pagina = await buscarPrestadores({ page: 2, tipoVeiculoId: 3, especialidadeId: 8 });
  assert.equal(pagina.content[0].id, 'perfil-interno'); assert.equal(pagina.content[0].tiposVeiculo[0], 'Carro');
  assert.equal(pagina.content[0].notaMedia, undefined); assert.equal(pagina.totalPages, 4);
});
