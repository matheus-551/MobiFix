package br.com.edu.ifpe.mobifix.api.shared.infrastructure.security;

/** Identidade validada da requisição; o UID Firebase não precisa ser UUID. */
@FunctionalInterface
public interface IdentidadeAtual {
    String firebaseId();
}
