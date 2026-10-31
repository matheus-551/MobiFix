package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.web;

import java.sql.SQLException;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioInativoException;
import java.util.List;

import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioJaCadastradoException;

import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = UsuarioController.class)
public class UsuarioExceptionHandler {
    @ExceptionHandler(UsuarioInativoException.class)
    public ProblemDetail tratarUsuarioInativo(UsuarioInativoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.valueOf(422), exception.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail tratarArgumentoInvalido(IllegalArgumentException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(UsuarioJaCadastradoException.class)
    public ProblemDetail tratarDuplicidade(UsuarioJaCadastradoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail tratarValidacao(MethodArgumentNotValidException exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Revise os campos informados.");

        List<ErroCampo> erros = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(erro -> new ErroCampo(
                        erro.getField(),
                        erro.getDefaultMessage()
                ))
                .toList();

        problem.setProperty("errors", erros);

        return problem;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail tratarIntegridade(DataIntegrityViolationException exception) {Throwable causa = exception;

        while (causa != null) {
            if (causa instanceof SQLException sqlException && "23505".equals(sqlException.getSQLState())) {
                return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Já existe um usuário com o e-mail ou identificador informado.");
            }
            causa = causa.getCause();
        }

        throw exception;
    }

    @ExceptionHandler(UsuarioNaoEncontradoException.class)
    public ProblemDetail tratarUsuarioNaoEncontrado(UsuarioNaoEncontradoException exception) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                exception.getMessage()
        );
    }

    public record ErroCampo(String field, String message) { }
}
