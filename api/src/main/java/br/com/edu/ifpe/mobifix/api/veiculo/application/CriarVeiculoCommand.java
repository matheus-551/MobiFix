package br.com.edu.ifpe.mobifix.api.veiculo.application;
public record CriarVeiculoCommand(Long tipoVeiculoId, String marca, String modelo, int ano, String placa) {
}
