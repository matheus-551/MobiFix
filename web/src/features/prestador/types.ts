/** Tipos das respostas da API MobiFix usadas pelo painel do prestador (espelham os DTOs do backend). */

export interface ApiAddress {
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

/** `GET /prestadores/me/perfil` */
export interface ApiProviderProfile {
  id: string;
  usuarioId: string;
  nomeFantasia: string | null;
  descricao: string | null;
  endereco: ApiAddress;
  tiposVeiculoIds: number[];
  especialidadeIds: number[];
}

/** Corpo de `POST` e `PUT /prestadores/me/perfil`. */
export interface ApiProviderProfileInput {
  nomeFantasia: string;
  descricao: string;
  endereco: ApiAddress;
  tiposVeiculoIds: number[];
  especialidadeIds: number[];
}

/** `GET /prestadores/me/horarios` */
export interface ApiSlot {
  id: string;
  prestadorId: string;
  data: string; // yyyy-MM-dd
  horaInicio: string; // HH:mm[:ss]
  capacidadeTotal: number;
  bloqueado: boolean;
}
