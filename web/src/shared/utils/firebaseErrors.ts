import { FirebaseError } from "firebase/app";
import { FirebaseConfigError } from "../lib/firebase/config";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/invalid-email": "Informe um e-mail válido.",
  "auth/user-disabled": "Esta conta foi desativada. Entre em contato com o suporte.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "auth/email-already-in-use": "Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.",
  "auth/weak-password": "A senha é muito fraca. Use pelo menos 8 caracteres, com letras e números.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet e tente novamente.",
  "auth/invalid-action-code": "Este link é inválido ou já foi utilizado. Solicite um novo e-mail.",
  "auth/requires-recent-login": "Por segurança, entre novamente para continuar.",
  "auth/operation-not-allowed": "O login por e-mail e senha não está habilitado no Firebase.",
  "auth/unauthorized-continue-uri": "O domínio deste site não está autorizado no Firebase Authentication.",
  "permission-denied": "Você não tem permissão para realizar esta operação.",
  unavailable: "Serviço temporariamente indisponível. Tente novamente em instantes.",
  "storage/unauthorized": "Não foi possível enviar o documento: permissão negada.",
  "storage/canceled": "O envio do documento foi cancelado.",
  "storage/quota-exceeded": "Limite de armazenamento excedido. Entre em contato com o suporte.",
};

/** Converte erros do Firebase (e de configuração) em mensagens amigáveis em português. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof FirebaseConfigError) return error.message;
  if (error instanceof FirebaseError) {
    return MESSAGES[error.code] ?? "Não foi possível concluir a operação. Tente novamente.";
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}

export function getErrorCode(error: unknown): string | null {
  return error instanceof FirebaseError ? error.code : null;
}
