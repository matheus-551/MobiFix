package br.com.edu.ifpe.mobifix.api.prestador.domain.model;

import java.util.Locale;

public record Endereco(
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String uf,
        String cep
) {

    public Endereco {
        logradouro = textoObrigatorio(logradouro, "Logradouro");
        numero = textoObrigatorio(numero, "Número");
        bairro = textoObrigatorio(bairro, "Bairro");
        cidade = textoObrigatorio(cidade, "Cidade");

        uf = textoObrigatorio(uf, "UF").toUpperCase(Locale.ROOT);

        cep = textoObrigatorio(cep, "CEP");

        if (!uf.matches(
                "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO"
        )) {
            throw new IllegalArgumentException("UF inválida.");
        }

        if (!cep.matches("[0-9]{8}")) {
            throw new IllegalArgumentException(
                    "O CEP deve conter exatamente oito dígitos."
            );
        }

        if (complemento != null) {
            complemento = complemento.strip();

            if (complemento.isEmpty()) {
                complemento = null;
            }
        }
    }

    private static String textoObrigatorio(
            String valor,
            String campo
    ) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException(
                    campo + " é obrigatório."
            );
        }

        return valor.strip();
    }
}