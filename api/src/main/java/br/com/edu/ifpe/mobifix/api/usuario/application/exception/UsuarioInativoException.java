package br.com.edu.ifpe.mobifix.api.usuario.application.exception;

public class UsuarioInativoException extends RuntimeException {
    public UsuarioInativoException() {
        super("A conta precisa estar ativa para alterar os dados pessoais.");
    }
}
