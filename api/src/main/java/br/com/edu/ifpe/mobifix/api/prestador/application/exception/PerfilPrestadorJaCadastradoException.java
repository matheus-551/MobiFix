package br.com.edu.ifpe.mobifix.api.prestador.application.exception;

public class PerfilPrestadorJaCadastradoException extends RuntimeException {

    public PerfilPrestadorJaCadastradoException() {
        super("Este usuário já possui um perfil profissional.");
    }
}