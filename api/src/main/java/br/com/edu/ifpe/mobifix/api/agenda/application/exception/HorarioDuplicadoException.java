package br.com.edu.ifpe.mobifix.api.agenda.application.exception;
public class HorarioDuplicadoException extends RuntimeException {
    public HorarioDuplicadoException() { super("O prestador já possui um horário nessa data e hora."); }
}
