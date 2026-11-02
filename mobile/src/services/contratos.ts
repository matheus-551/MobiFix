import { Papel } from '../types';
export type ItemCatalogo = { id: number; nome: string };
export type UsuarioApi = { id: string; nome: string; sobrenome: string; email: string; telefone: string; uf: string; tipo: Papel; ativo: boolean };
export type Endereco = { logradouro: string; numero: string; complemento: string | null; bairro: string; cidade: string; uf: string; cep: string };
export type PerfilProfissionalApi = { id: string; usuarioId: string; nomeFantasia: string | null; descricao: string | null;
  endereco: Endereco; tiposVeiculoIds: number[]; especialidadeIds: number[] };
export type CriarPerfilProfissional = { nomeFantasia: string | null; descricao: string | null; endereco: Endereco; tiposVeiculoIds: number[]; especialidadeIds: number[] };
export type PrestadorApi = { id: string; nome: string; descricao: string | null; cidade: string; uf: string; tiposVeiculo: ItemCatalogo[]; especialidades: ItemCatalogo[] };
export type Pagina<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number };
