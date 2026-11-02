package br.com.edu.ifpe.mobifix.api.shared.infrastructure.security;

@FunctionalInterface
public interface VerificadorTokenFirebase {
    String verificar(String token);
}
