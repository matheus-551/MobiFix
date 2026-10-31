package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.prestador.application.busca.PrestadorPublicoNaoEncontradoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = PrestadorPublicoController.class)
public class PrestadorPublicoExceptionHandler {
    @ExceptionHandler(PrestadorPublicoNaoEncontradoException.class)
    public ProblemDetail naoEncontrado(PrestadorPublicoNaoEncontradoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }
    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail filtroInvalido(IllegalArgumentException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }
}
