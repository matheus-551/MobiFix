package br.com.edu.ifpe.mobifix.api.usuario.application.exception;

public class UsuarioNaoEncontradoException extends RuntimeException {

    public UsuarioNaoEncontradoException() {
        super("O usuário autenticado ainda não possui cadastro.");
    }
}
