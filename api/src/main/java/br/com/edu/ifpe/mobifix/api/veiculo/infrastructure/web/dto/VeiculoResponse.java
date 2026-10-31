package br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.web.dto;
import java.util.UUID;

public record VeiculoResponse(UUID id, UUID clienteId, Long tipoVeiculoId, String marca, String modelo, int ano, String placa) {
}
