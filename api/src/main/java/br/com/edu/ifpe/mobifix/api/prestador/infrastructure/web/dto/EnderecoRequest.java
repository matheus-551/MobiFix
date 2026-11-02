package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EnderecoRequest(

        @NotBlank
        @Size(max = 200)
        String logradouro,

        @NotBlank
        @Size(max = 20)
        String numero,

        @Size(max = 100)
        String complemento,

        @NotBlank
        @Size(max = 100)
        String bairro,

        @NotBlank
        @Size(max = 100)
        String cidade,

        @NotBlank
        @Pattern(
                regexp = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO",
                message = "Informe uma UF brasileira válida em letras maiúsculas."
        )
        String uf,

        @NotBlank
        @Pattern(
                regexp = "[0-9]{8}",
                message = "Informe o CEP com oito dígitos."
        )
        String cep
) {
}