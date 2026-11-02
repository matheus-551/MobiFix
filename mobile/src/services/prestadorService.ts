import { api } from './api';
import { Pagina, PrestadorApi } from './contratos';
export type Prestador = { id: string; nomeExibicao: string; cidade: string; uf: string; tiposVeiculo: string[]; especialidades: string[] };
export async function buscarPrestadores(filtros: { page: number; tipoVeiculoId?: number; especialidadeId?: number }): Promise<Pagina<Prestador>> {
  const params = Object.entries({ size: 20, ...filtros }).filter(([, valor]) => valor !== undefined)
    .map(([chave, valor]) => `${encodeURIComponent(chave)}=${encodeURIComponent(String(valor))}`).join('&');
  const pagina = await api<Pagina<PrestadorApi>>(`/prestadores?${params}`, { publica: true });
  return { ...pagina, content: pagina.content.map(item => ({ id: item.id, nomeExibicao: item.nome, cidade: item.cidade, uf: item.uf,
    tiposVeiculo: item.tiposVeiculo.map(tipo => tipo.nome), especialidades: item.especialidades.map(esp => esp.nome) })) };
}
