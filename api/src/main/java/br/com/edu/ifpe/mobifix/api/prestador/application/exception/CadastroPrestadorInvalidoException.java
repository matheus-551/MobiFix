package br.com.edu.ifpe.mobifix.api.prestador.application.exception;

public class CadastroPrestadorInvalidoException extends RuntimeException {

    public CadastroPrestadorInvalidoException(String mensagem) {
        super(mensagem);
    }
}