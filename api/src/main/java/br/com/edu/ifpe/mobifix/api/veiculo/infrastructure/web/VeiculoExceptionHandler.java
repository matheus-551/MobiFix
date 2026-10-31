package br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.web;

import java.sql.SQLException;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.veiculo.application.exception.OperacaoVeiculoInvalidaException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = VeiculoController.class)
public class VeiculoExceptionHandler {
    @ExceptionHandler(UsuarioNaoEncontradoException.class)
    public ProblemDetail usuarioNaoEncontrado(UsuarioNaoEncontradoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }
    @ExceptionHandler(OperacaoVeiculoInvalidaException.class)
    public ProblemDetail operacaoInvalida(OperacaoVeiculoInvalidaException exception) {
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
            if (causa instanceof SQLException sql && ("23503".equals(sql.getSQLState()) || "23505".equals(sql.getSQLState()))) {
                return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Os dados relacionados mudaram. Consulte os cadastros e tente novamente.");
            }
            causa = causa.getCause();
        }
        throw exception;
    }
}
