package br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.web.dto;
import jakarta.validation.constraints.*;

public record AtualizarVeiculoRequest(
        @NotNull @Positive Long tipoVeiculoId,
        @NotBlank @Size(max = 100) String marca,
        @NotBlank @Size(max = 100) String modelo,
        @NotNull @Min(1886) Integer ano,
        @Size(max = 8) String placa
) {
}
