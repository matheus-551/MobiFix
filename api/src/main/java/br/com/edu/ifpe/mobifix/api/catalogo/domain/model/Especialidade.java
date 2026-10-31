package br.com.edu.ifpe.mobifix.api.catalogo.domain.model;

public record Especialidade(Long id, String nome) {

    public Especialidade {
        if (id != null && id <= 0) {
            throw new IllegalArgumentException(
                    "O identificador deve ser positivo."
            );
        }

        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException(
                    "O nome da especialidade é obrigatório."
            );
        }

        nome = nome.strip();
    }
}