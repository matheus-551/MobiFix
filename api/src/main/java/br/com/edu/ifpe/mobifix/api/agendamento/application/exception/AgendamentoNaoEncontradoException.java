package br.com.edu.ifpe.mobifix.api.agendamento.application.exception;

public class AgendamentoNaoEncontradoException extends RuntimeException {

    public AgendamentoNaoEncontradoException() {
        super("Agendamento não encontrado.");
    }
}
