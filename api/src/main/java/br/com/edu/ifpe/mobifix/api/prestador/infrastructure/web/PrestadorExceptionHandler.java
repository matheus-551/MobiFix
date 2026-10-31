package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web;

import java.sql.SQLException;
import br.com.edu.ifpe.mobifix.api.prestador.application.exception.PerfilPrestadorNaoEncontradoException;

import br.com.edu.ifpe.mobifix.api.prestador.application.exception.CadastroPrestadorInvalidoException;
import br.com.edu.ifpe.mobifix.api.prestador.application.exception.PerfilPrestadorJaCadastradoException;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = PrestadorController.class)
public class PrestadorExceptionHandler {

    @ExceptionHandler(PerfilPrestadorNaoEncontradoException.class)
    public ProblemDetail tratarPerfilNaoEncontrado(PerfilPrestadorNaoEncontradoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }
    @ExceptionHandler(UsuarioNaoEncontradoException.class)
    public ProblemDetail tratarUsuarioNaoEncontrado(UsuarioNaoEncontradoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(PerfilPrestadorJaCadastradoException.class)
    public ProblemDetail tratarPerfilDuplicado(PerfilPrestadorJaCadastradoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(CadastroPrestadorInvalidoException.class)
    public ProblemDetail tratarCadastroInvalido(CadastroPrestadorInvalidoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, exception.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail tratarArgumentoInvalido(IllegalArgumentException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail tratarIntegridade(DataIntegrityViolationException exception) {
        Throwable causa = exception;

        while (causa != null) {
            if (causa instanceof SQLException sqlException) {
                if ("23505".equals(sqlException.getSQLState())) {
                    return ProblemDetail.forStatusAndDetail(
                            HttpStatus.CONFLICT,
                            "O cadastro conflita com um registro existente."
                    );
                }

                if ("23503".equals(sqlException.getSQLState())) {
                    return ProblemDetail.forStatusAndDetail(
                            HttpStatus.CONFLICT,
                            "Um registro relacionado não está mais disponível. Consulte os dados e tente novamente."
                    );
                }
            }

            causa = causa.getCause();
        }

        throw exception;
    }
}