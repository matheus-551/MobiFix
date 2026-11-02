export type Papel = 'CLIENTE' | 'PRESTADOR';
/** Dados da conta autenticada, provenientes exclusivamente da API. */
export type Perfil = { id: string; papel: Papel; email: string; ativo: boolean; telefone: string; cidade?: string; uf: string;
  nome: string; sobrenome: string; nomeExibicao?: string };
export const nomeDo = (perfil?: Perfil | null): string =>
  perfil ? (perfil.papel === 'PRESTADOR' ? perfil.nomeExibicao || perfil.nome : perfil.nome) : '';
