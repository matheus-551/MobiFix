import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

type Base = { email: string; senha: string; telefone: string; cidade: string; uf: string };
export type DadosCliente = Base & { papel: 'CLIENTE'; nome: string; sobrenome: string };
export type DadosPrestador = Base & {
  papel: 'PRESTADOR';
  nomeExibicao: string;
  endereco: string;
  tiposVeiculo: string[];
  especialidades: string[];
};
export type DadosCadastro = DadosCliente | DadosPrestador;

/** Cria a conta no Firebase Auth, salva o perfil no Firestore e envia o e-mail de verificação. */
export async function cadastrarUsuario(dados: DadosCadastro): Promise<void> {
  const { senha, email, ...perfil } = dados;
  const emailLimpo = email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(auth, emailLimpo, senha);
  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      ...perfil,
      email: emailLimpo,
      status: 'PENDING_VERIFICATION',
      criadoEm: serverTimestamp(),
    });
    await sendEmailVerification(cred.user);
  } catch (e) {
    await deleteUser(cred.user).catch(() => undefined); // evita conta sem perfil
    throw e;
  }
}

/** Reenvia o e-mail de verificação para o usuário logado. */
export async function reenviarVerificacao(): Promise<void> {
  if (!auth.currentUser) throw new Error('sessao-expirada');
  await sendEmailVerification(auth.currentUser);
}

/** Consulta o Firebase e retorna true se o e-mail já foi confirmado (e ativa a conta no Firestore). */
export async function atualizarVerificacao(): Promise<boolean> {
  const u = auth.currentUser;
  if (!u) return false;
  await u.reload();
  if (!u.emailVerified) return false;
  await u.getIdToken(true); // renova o token para as regras do Firestore enxergarem email_verified
  await updateDoc(doc(db, 'users', u.uid), { status: 'ACTIVE' }).catch(() => undefined);
  return true;
}

export const entrar = (email: string, senha: string) =>
  signInWithEmailAndPassword(auth, email.trim().toLowerCase(), senha);

/** Envia o link de redefinição de senha. O Firebase não revela se o e-mail existe. */
export const recuperarSenha = (email: string) => sendPasswordResetEmail(auth, email.trim().toLowerCase());

export const sair = () => signOut(auth);

const MENSAGENS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/weak-password': 'A senha é muito fraca.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
  'auth/operation-not-allowed': 'Login por e-mail/senha não está ativado no Firebase.',
  'permission-denied': 'Sem permissão para salvar os dados. Verifique se as regras do Firestore foram publicadas.',
  'unavailable': 'Não foi possível acessar o banco de dados. Verifique se o Firestore foi criado.',
};

export function mensagemErro(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const chave = code.startsWith('firestore/') ? code.replace('firestore/', '') : code;
  return MENSAGENS[chave] ?? 'Algo deu errado. Tente novamente.';
}
