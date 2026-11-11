/**
 * Rotas `GET` que a API libera sem autenticação (ver `SecurityConfiguration` em api.zip).
 * Nelas o front NÃO envia o ID Token: a API responde 401/503 a qualquer requisição que traga um token
 * que ela não consiga validar, mesmo em rota pública. `/prestadores/me/**` continua protegida.
 */
const PUBLIC_GET_PATHS: readonly RegExp[] = [
  /^\/tipos-veiculo$/,
  /^\/especialidades$/,
  /^\/prestadores$/,
  /^\/prestadores\/(?!me(?:\/|$))[^/]+$/,
  /^\/prestadores\/(?!me(?:\/|$))[^/]+\/horarios$/,
];

/** `path` relativo a `/api/v1`, sem a query string. */
export function isPublicApiRequest(method: string, path: string): boolean {
  return method === "GET" && PUBLIC_GET_PATHS.some((pattern) => pattern.test(path));
}
