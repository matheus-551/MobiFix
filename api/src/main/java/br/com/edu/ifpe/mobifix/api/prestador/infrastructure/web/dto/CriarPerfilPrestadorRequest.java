package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web.dto;

import java.util.Set;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CriarPerfilPrestadorRequest(

        @Size(max = 150)
        String nomeFantasia,

        @Size(max = 2000)
        String descricao,

        @NotNull
        @Valid
        EnderecoRequest endereco,

        @NotEmpty
        Set<@NotNull @Positive Long> tiposVeiculoIds,

        @NotEmpty
        Set<@NotNull @Positive Long> especialidadeIds
) {
}