package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web;

import java.sql.SQLException;
import br.com.edu.ifpe.mobifix.api.agenda.application.exception.*;
import br.com.edu.ifpe.mobifix.api.prestador.application.exception.CadastroPrestadorInvalidoException;
import br.com.edu.ifpe.mobifix.api.prestador.application.exception.PerfilPrestadorNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice(assignableTypes = {AgendaPrestadorController.class, AgendaPublicaController.class})
public class AgendaExceptionHandler {
    @ExceptionHandler({HorarioNaoEncontradoException.class, PerfilPrestadorNaoEncontradoException.class, UsuarioNaoEncontradoException.class})
    public ProblemDetail naoEncontrado(RuntimeException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }
    @ExceptionHandler(HorarioDuplicadoException.class)
    public ProblemDetail duplicado(HorarioDuplicadoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
    }
    @ExceptionHandler({RegraAgendaException.class, CadastroPrestadorInvalidoException.class})
    public ProblemDetail regraInvalida(RuntimeException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.valueOf(422), exception.getMessage());
    }
    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail argumentoInvalido(IllegalArgumentException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail integridade(DataIntegrityViolationException exception) {
        Throwable causa = exception;
        while (causa != null) {
            if (causa instanceof SQLException sql && ("23505".equals(sql.getSQLState()) || "23503".equals(sql.getSQLState()))) {
                return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "O horário já existe ou um cadastro relacionado não está mais disponível.");
            }
            causa = causa.getCause();
        }
        throw exception;
    }
}
