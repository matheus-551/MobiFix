package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.AgendamentoNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.ConflitoAgendamentoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.PermissaoAgendamentoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.RecursoAgendamentoNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.RegraAgendamentoException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.sql.SQLException;

@RestControllerAdvice(assignableTypes = AgendamentoController.class)
public class AgendamentoExceptionHandler {

    @ExceptionHandler({
        AgendamentoNaoEncontradoException.class,
        RecursoAgendamentoNaoEncontradoException.class
    })
    public ProblemDetail naoEncontrado(RuntimeException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(RegraAgendamentoException.class)
    public ProblemDetail regra(RegraAgendamentoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.valueOf(422), exception.getMessage());
    }

    @ExceptionHandler(ConflitoAgendamentoException.class)
    public ProblemDetail conflito(ConflitoAgendamentoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail invalido(IllegalArgumentException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail validacao(MethodArgumentNotValidException exception) {
        var problema =
                ProblemDetail.forStatusAndDetail(
                        HttpStatus.BAD_REQUEST, "Revise os campos informados.");
        problema.setProperty(
                "errors",
                exception.getBindingResult().getFieldErrors().stream()
                        .map(campo -> new ErroCampo(campo.getField(), campo.getDefaultMessage()))
                        .toList());

        return problema;
    }

    @ExceptionHandler(PessimisticLockingFailureException.class)
    public ProblemDetail concorrencia(PessimisticLockingFailureException exception) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "Outro atendimento está alterando estes recursos. Consulte os agendamentos antes de"
                        + " tentar novamente.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail integridade(DataIntegrityViolationException exception) {
        for (Throwable causa = exception; causa != null; causa = causa.getCause()) {
            if (causa instanceof SQLException sqlException
                    && ("23505".equals(sqlException.getSQLState())
                            || "23503".equals(sqlException.getSQLState()))) {
                return ProblemDetail.forStatusAndDetail(
                        HttpStatus.CONFLICT,
                        "Já existe uma reserva para o veículo neste horário ou um vínculo não está"
                                + " disponível.");
            }
        }
        throw exception;
    }

    public record ErroCampo(String field, String message) {}

    @ExceptionHandler(PermissaoAgendamentoException.class)
    public ProblemDetail permissao(PermissaoAgendamentoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, exception.getMessage());
    }

    public record ErroCampo(String field, String message) {}
}
