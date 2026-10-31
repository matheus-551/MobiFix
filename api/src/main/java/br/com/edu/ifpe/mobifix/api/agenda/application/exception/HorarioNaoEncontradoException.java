package br.com.edu.ifpe.mobifix.api.agenda.application.exception;
public class HorarioNaoEncontradoException extends RuntimeException {
    public HorarioNaoEncontradoException() { super("Horário não encontrado."); }
}
