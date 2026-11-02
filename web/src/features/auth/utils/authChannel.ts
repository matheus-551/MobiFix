/**
 * Aviso entre abas do mesmo navegador: quando o link do e-mail é aberto em outra aba, a aba que está
 * esperando na tela de verificação é avisada na hora (sem esperar o próximo ciclo de checagem).
 */
const CHANNEL = "mobifix-auth";
const MESSAGE = "email-verified";

export function notifyEmailVerified(): void {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(MESSAGE);
    channel.close();
  } catch {
    /* BroadcastChannel indisponível: a checagem periódica cobre este caso */
  }
}

/** Devolve a função que cancela a escuta. */
export function listenEmailVerified(onVerified: () => void): () => void {
  if (typeof BroadcastChannel === "undefined") return () => undefined;
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (event) => {
    if (event.data === MESSAGE) onVerified();
  };
  return () => channel.close();
}
