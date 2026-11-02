package br.com.edu.ifpe.mobifix.api.prestador.application.busca;

public class PrestadorPublicoNaoEncontradoException extends RuntimeException {
    public PrestadorPublicoNaoEncontradoException() {
        super("Prestador não encontrado.");
    }
}
