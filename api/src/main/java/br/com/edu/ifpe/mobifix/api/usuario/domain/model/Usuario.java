package br.com.edu.ifpe.mobifix.api.usuario.domain.model;

import java.util.UUID;

public record Usuario(
        UUID id,
        String firebaseId,
        String nome,
        String sobrenome,
        String email,
        String telefone,
        String uf,
        TipoUsuario tipo,
        boolean ativo
) {

    public Usuario {
        if (id == null) {
            throw new IllegalArgumentException(
                    "O identificador do usuário é obrigatório."
            );
        }

        firebaseId = textoObrigatorio(firebaseId, "Identidade externa");

        nome = textoObrigatorio(nome, "Nome");
        sobrenome = textoObrigatorio(sobrenome, "Sobrenome");
        email = textoObrigatorio(email, "E-mail");
        telefone = textoObrigatorio(telefone, "Telefone");
        uf = textoObrigatorio(uf, "UF");

        if (tipo == null) {
            throw new IllegalArgumentException("O tipo de usuário é obrigatório.");
        }
    }

    private static String textoObrigatorio(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException(
                    campo + " é obrigatório."
            );
        }

        return valor.strip();
    }
}