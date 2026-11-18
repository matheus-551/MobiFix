package br.com.edu.ifpe.mobifix.api.agendamento.application.exception;

public class ConflitoAgendamentoException extends RuntimeException {

    public ConflitoAgendamentoException(String mensagem) {
        super(mensagem);
    }
}
