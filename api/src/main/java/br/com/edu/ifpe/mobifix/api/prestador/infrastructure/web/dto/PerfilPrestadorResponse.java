package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web.dto;

import java.util.Set;
import java.util.UUID;

public record PerfilPrestadorResponse(
        UUID id,
        UUID usuarioId,
        String nomeFantasia,
        String descricao,
        EnderecoResponse endereco,
        Set<Long> tiposVeiculoIds,
        Set<Long> especialidadeIds
) {

    public record EnderecoResponse(
            String logradouro,
            String numero,
            String complemento,
            String bairro,
            String cidade,
            String uf,
            String cep
    ) {
    }
}