package br.com.edu.ifpe.mobifix.api.prestador.application.useCase.criarPerfilPrestador;

import java.util.Set;

import br.com.edu.ifpe.mobifix.api.prestador.domain.model.Endereco;

public record CriarPerfilPrestadorCommand(
        String nomeFantasia,
        String descricao,
        Endereco endereco,
        Set<Long> tiposVeiculoIds,
        Set<Long> especialidadeIds
) {
}