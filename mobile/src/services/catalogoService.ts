import { api } from './api';
import { ItemCatalogo } from './contratos';
export async function buscarCatalogos() {
  const [tiposVeiculo, especialidades] = await Promise.all([
    api<ItemCatalogo[]>('/tipos-veiculo', { publica: true }),
    api<ItemCatalogo[]>('/especialidades', { publica: true }),
  ]);
  return { tiposVeiculo, especialidades };
}
