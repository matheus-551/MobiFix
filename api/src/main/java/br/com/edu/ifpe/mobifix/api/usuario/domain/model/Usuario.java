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

    public Usuario atualizarDadosPessoais(String nome, String sobrenome, String telefone, String uf) {
        nome = textoObrigatorio(nome, "Nome");
        sobrenome = textoObrigatorio(sobrenome, "Sobrenome");
        telefone = textoObrigatorio(telefone, "Telefone");
        uf = textoObrigatorio(uf, "UF");
        if (nome.length() > 100 || sobrenome.length() > 100) {
            throw new IllegalArgumentException("Nome e sobrenome devem ter no máximo 100 caracteres.");
        }
        if (!telefone.matches("[0-9]{10,11}")) {
            throw new IllegalArgumentException("Informe DDD e telefone com 10 ou 11 dígitos.");
        }
        if (!uf.matches("AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO")) {
            throw new IllegalArgumentException("Informe uma UF brasileira válida em letras maiúsculas.");
        }
        return new Usuario(id, firebaseId, nome, sobrenome, email, telefone, uf, tipo, ativo);
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
