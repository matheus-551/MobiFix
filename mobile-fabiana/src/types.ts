export type Papel = 'CLIENTE' | 'PRESTADOR';
export type StatusConta = 'PENDING_VERIFICATION' | 'ACTIVE';

export type Perfil = {
  papel: Papel;
  email: string;
  status: StatusConta;
  telefone: string;
  cidade?: string;
  uf: string;
  nome?: string;
  sobrenome?: string;
  nomeExibicao?: string;
  endereco?: string;
  tiposVeiculo?: string[];
  especialidades?: string[];
};

/** Nome para exibir: nome do cliente ou nome/nome fantasia do profissional. */
export const nomeDo = (p?: Perfil | null): string =>
  p ? ((p.papel === 'PRESTADOR' ? p.nomeExibicao : p.nome) ?? '') : '';
