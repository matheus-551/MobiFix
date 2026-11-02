import { auth } from '../config/firebase';

type ErroCampo = { field: string; message: string };
type Problema = { detail?: string; errors?: ErroCampo[] };
export class ErroApi extends Error {
  constructor(public readonly status: number, mensagem: string) { super(mensagem); this.name = 'ErroApi'; }
}
export type Opcoes = { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; publica?: boolean; uidEsperado?: string };

/** Token obtido pelo SDK a cada chamada; nunca persistimos tokens manualmente. */
export async function api<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const base = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
  if (!base) throw new ErroApi(0, 'Configure o endereço da API para conectar o aplicativo.');
  const usuario = opcoes.publica ? null : auth.currentUser;
  if (!opcoes.publica && !usuario) throw new ErroApi(401, 'Sua sessão expirou. Entre novamente.');
  if (opcoes.uidEsperado && usuario?.uid !== opcoes.uidEsperado) throw new ErroApi(401, 'A conta conectada mudou. Tente novamente.');
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const token = usuario ? await usuario.getIdToken(tentativa === 1) : null;
    if (usuario && auth.currentUser?.uid !== usuario.uid) throw new ErroApi(401, 'A conta conectada mudou. Tente novamente.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${base}${caminho}`, {
        method: opcoes.method ?? 'GET', signal: controller.signal,
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(opcoes.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        ...(opcoes.body !== undefined ? { body: JSON.stringify(opcoes.body) } : {}),
      });
      if (usuario && auth.currentUser?.uid !== usuario.uid) throw new ErroApi(401, 'A conta conectada mudou. Tente novamente.');
      if (response.status === 401 && usuario && tentativa === 0) continue;
      if (!response.ok) {
        const problema: Problema = await response.json().catch(() => ({}));
        const mensagem = response.status === 401 ? 'Sua sessão não foi aceita. Entre novamente.'
          : response.status === 503 ? 'O serviço de autenticação está indisponível. Tente novamente mais tarde.'
          : problema.errors?.map(e => `${e.field}: ${e.message}`).join('\n') || problema.detail || 'Não foi possível concluir a solicitação.';
        throw new ErroApi(response.status, mensagem);
      }
      if (response.status === 204) return undefined as T;
      return await response.json() as T;
    } catch (erro) {
      if (erro instanceof ErroApi) throw erro;
      throw new ErroApi(0, controller.signal.aborted ? 'A API demorou para responder. Tente novamente.'
        : 'Não foi possível conectar à API. Confira sua conexão e tente novamente.');
    } finally { clearTimeout(timeout); }
  }
  throw new ErroApi(401, 'Sua sessão expirou. Entre novamente.');
}
