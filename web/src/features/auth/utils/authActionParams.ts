/** Interpreta os parâmetros que o Firebase coloca no link dos e-mails (`mode` e `oobCode`). */
export type AuthActionMode = "verifyEmail" | "resetPassword";

export interface AuthActionParams {
  mode: AuthActionMode;
  oobCode: string;
}

export interface ParamReader {
  get(name: string): string | null;
}

/** `null` quando o link está incompleto ou usa um modo que o MobiFix não trata (ex.: recoverEmail). */
export function parseAuthActionParams(params: ParamReader): AuthActionParams | null {
  const mode = params.get("mode");
  const oobCode = params.get("oobCode")?.trim();
  if (!oobCode || oobCode.length > 512) return null;
  if (mode !== "verifyEmail" && mode !== "resetPassword") return null;
  return { mode, oobCode };
}
