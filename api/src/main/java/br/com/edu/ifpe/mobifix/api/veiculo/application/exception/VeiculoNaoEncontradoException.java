package br.com.edu.ifpe.mobifix.api.veiculo.application.exception;

public class VeiculoNaoEncontradoException extends RuntimeException {
    public VeiculoNaoEncontradoException() {
        super("Veículo não encontrado.");
    }
}
