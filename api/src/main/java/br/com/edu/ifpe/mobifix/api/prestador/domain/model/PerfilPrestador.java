package br.com.edu.ifpe.mobifix.api.prestador.domain.model;

import java.util.Set;
import java.util.UUID;

public record PerfilPrestador(
        UUID id,
        UUID usuarioId,
        String nomeFantasia,
        String descricao,
        Endereco endereco,
        Set<Long> tiposVeiculoIds,
        Set<Long> especialidadeIds
) {

    public PerfilPrestador {
        if (id == null) {
            throw new IllegalArgumentException("O identificador do perfil é obrigatório.");
        }

        if (usuarioId == null) {
            throw new IllegalArgumentException("O usuário responsável é obrigatório.");
        }

        if (endereco == null) {
            throw new IllegalArgumentException("O endereço é obrigatório.");
        }

        nomeFantasia = textoOpcional(nomeFantasia);
        descricao = textoOpcional(descricao);
        tiposVeiculoIds = validarIds(tiposVeiculoIds, "Selecione pelo menos um tipo de veículo.");
        especialidadeIds = validarIds(especialidadeIds, "Selecione pelo menos uma especialidade.");
    }

    private static Set<Long> validarIds(
            Set<Long> ids,
            String mensagem
    ) {
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException(mensagem);
        }

        for (Long id : ids) {
            if (id == null || id <= 0) {
                throw new IllegalArgumentException("Os identificadores devem ser positivos.");
            }
        }

        return Set.copyOf(ids);
    }

    private static String textoOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }

        return valor.strip();
    }
}