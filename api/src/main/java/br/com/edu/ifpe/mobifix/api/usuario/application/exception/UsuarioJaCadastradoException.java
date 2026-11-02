package br.com.edu.ifpe.mobifix.api.usuario.application.exception;

public class UsuarioJaCadastradoException extends RuntimeException {

    public UsuarioJaCadastradoException(String mensagem) {
        super(mensagem);
    }
}
