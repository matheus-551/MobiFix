package br.com.edu.ifpe.mobifix.api.prestador.application.exception;

public class PerfilPrestadorNaoEncontradoException extends RuntimeException {

    public PerfilPrestadorNaoEncontradoException() {
        super("O usuário ainda não possui um perfil profissional.");
    }
}