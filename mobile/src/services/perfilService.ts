import { auth } from '../config/firebase';
import { Perfil } from '../types';
import { api, ErroApi } from './api';
import { PerfilProfissionalApi, UsuarioApi } from './contratos';
export type Sessao = { estado: 'cadastro'; usuario?: UsuarioApi } | { estado: 'inativa' } | { estado: 'pronta'; perfil: Perfil };
export async function carregarSessao(): Promise<Sessao> {
  const uidEsperado = auth.currentUser?.uid;
  if (!uidEsperado) throw new ErroApi(401, 'Sua sessão expirou. Entre novamente.');
  const consultar = <T>(caminho: string) => api<T>(caminho, { uidEsperado });
  let usuario: UsuarioApi;
  try { usuario = await consultar<UsuarioApi>('/usuarios/me'); }
  catch (erro) { if (erro instanceof ErroApi && erro.status === 404) return { estado: 'cadastro' }; throw erro; }
  if (!usuario.ativo) return { estado: 'inativa' };
  let profissional: PerfilProfissionalApi | undefined;
  if (usuario.tipo === 'PRESTADOR') {
    try { profissional = await consultar<PerfilProfissionalApi>('/prestadores/me/perfil'); }
    catch (erro) { if (erro instanceof ErroApi && erro.status === 404) return { estado: 'cadastro', usuario }; throw erro; }
  }
  return { estado: 'pronta', perfil: { id: usuario.id, papel: usuario.tipo, email: usuario.email, ativo: usuario.ativo,
    telefone: usuario.telefone, uf: profissional?.endereco.uf ?? usuario.uf, cidade: profissional?.endereco.cidade,
    nome: usuario.nome, sobrenome: usuario.sobrenome, nomeExibicao: profissional?.nomeFantasia ?? undefined } };
}
