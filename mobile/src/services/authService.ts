import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { api, ErroApi, Opcoes } from './api';
import { CriarPerfilProfissional, PerfilProfissionalApi, UsuarioApi } from './contratos';
import { Papel } from '../types';

export type DadosCadastro = { nome: string; sobrenome: string; email: string; telefone: string; uf: string;
  papel: Papel; senha?: string; profissional?: CriarPerfilProfissional };

let cadastroEmAndamento: Promise<void> | null = null;
/** Evita que o listener de login desmonte o cadastro antes de concluir a comunicação com a API. */
export async function aguardarCadastro(): Promise<void> { await cadastroEmAndamento?.catch(() => undefined); }

export async function concluirCadastro(dados: DadosCadastro, uidEsperado = auth.currentUser?.uid): Promise<void> {
  const atual = auth.currentUser;
  if (!atual || atual.uid !== uidEsperado) throw new ErroApi(401, 'Entre novamente para concluir o cadastro.');
  const requisitar = <T>(caminho: string, opcoes: Opcoes = {}) => api<T>(caminho, { ...opcoes, uidEsperado: atual.uid });
  let usuario: UsuarioApi;
  try { usuario = await requisitar<UsuarioApi>('/usuarios/me'); }
  catch (erro) {
    if (!(erro instanceof ErroApi) || erro.status !== 404) throw erro;
    try {
      usuario = await requisitar<UsuarioApi>('/usuarios', { method: 'POST', body: {
        nome: dados.nome.trim(), sobrenome: dados.sobrenome.trim(), email: atual.email,
        telefone: dados.telefone.replace(/\D/g, ''), uf: dados.uf, tipo: dados.papel,
      } });
    } catch (criacao) {
      // Uma resposta perdida pode ter confirmado o cadastro. Só considera sucesso se /me existir.
      if (!(criacao instanceof ErroApi) || criacao.status !== 409) throw criacao;
      try { usuario = await requisitar<UsuarioApi>('/usuarios/me'); } catch { throw criacao; }
    }
  }
  if (!usuario.ativo) throw new ErroApi(403, 'Sua conta está desativada.');
  if (usuario.tipo !== dados.papel) throw new ErroApi(409, 'A conta já possui outro tipo de cadastro.');
  if (usuario.tipo === 'PRESTADOR') {
    try { await requisitar<PerfilProfissionalApi>('/prestadores/me/perfil'); }
    catch (erro) {
      if (!(erro instanceof ErroApi) || erro.status !== 404) throw erro;
      if (!dados.profissional) throw new ErroApi(422, 'Preencha o perfil profissional para continuar.');
      try { await requisitar('/prestadores/me/perfil', { method: 'POST', body: dados.profissional }); }
      catch (criacao) {
        if (!(criacao instanceof ErroApi) || criacao.status !== 409) throw criacao;
        try { await requisitar<PerfilProfissionalApi>('/prestadores/me/perfil'); } catch { throw criacao; }
      }
    }
  }
}

export function cadastrarUsuario(dados: DadosCadastro): Promise<void> {
  if (cadastroEmAndamento) return cadastroEmAndamento;
  const tarefa = (async () => {
    if (!dados.senha) throw new Error('Informe uma senha.');
    const cred = await createUserWithEmailAndPassword(auth, dados.email.trim().toLowerCase(), dados.senha);
    // Nunca apagar a identidade: uma falha posterior pode ocorrer após o commit na API.
    await sendEmailVerification(cred.user);
    await concluirCadastro(dados, cred.user.uid);
  })();
  cadastroEmAndamento = tarefa;
  return tarefa.finally(() => { if (cadastroEmAndamento === tarefa) cadastroEmAndamento = null; });
}

export async function reenviarVerificacao(): Promise<void> {
  if (!auth.currentUser) throw new ErroApi(401, 'Entre novamente para receber o e-mail.');
  await sendEmailVerification(auth.currentUser);
}
export async function atualizarVerificacao(): Promise<boolean> {
  const usuario = auth.currentUser;
  if (!usuario) return false;
  await usuario.reload();
  if (!usuario.emailVerified) return false;
  await usuario.getIdToken(true);
  return true;
}
export const entrar = (email: string, senha: string) => signInWithEmailAndPassword(auth, email.trim().toLowerCase(), senha);
export const recuperarSenha = (email: string) => sendPasswordResetEmail(auth, email.trim().toLowerCase());
export const sair = () => signOut(auth);

const MENSAGENS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.', 'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.', 'auth/invalid-email': 'E-mail inválido.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado. Entre para concluir seu cadastro.',
  'auth/weak-password': 'A senha é muito fraca.', 'auth/too-many-requests': 'Muitas tentativas. Aguarde e tente novamente.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
  'auth/operation-not-allowed': 'Login por e-mail/senha não está ativado no Firebase.',
  'auth/user-disabled': 'Sua conta Firebase está desabilitada.',
  'auth/user-token-expired': 'Sua sessão expirou. Entre novamente.',
};
export function mensagemErro(erro: unknown): string {
  if (erro instanceof ErroApi) return erro.message;
  return MENSAGENS[(erro as { code?: string })?.code ?? ''] ?? 'Não foi possível concluir a operação. Tente novamente.';
}
