package br.com.edu.ifpe.mobifix.api.agendamento.application.exception;

public class PermissaoAgendamentoException extends RuntimeException {

    public PermissaoAgendamentoException() {
        super("Somente o prestador responsável pode executar esta ação.");
    }

    public PermissaoAgendamentoException(String mensagem) {
        super(mensagem);
    }
}
