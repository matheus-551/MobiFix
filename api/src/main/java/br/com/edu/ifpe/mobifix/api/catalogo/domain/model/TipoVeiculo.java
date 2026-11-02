package br.com.edu.ifpe.mobifix.api.catalogo.domain.model;

public record TipoVeiculo(Long id, String nome) {

    public TipoVeiculo {
        if (id != null && id <=0) {
            throw new IllegalArgumentException("O Identificador deve ser positivo.");
        }

        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("O nome do tipo de veículo é obrigatório.");
        }

        nome = nome.strip();
    }
}
