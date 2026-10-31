package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AtualizarUsuarioRequest(
        @NotBlank @Size(max = 100) String nome,
        @NotBlank @Size(max = 100) String sobrenome,
        @NotBlank
        @Pattern(regexp = "[0-9]{10,11}", message = "Informe DDD e telefone com 10 ou 11 dígitos.")
        String telefone,
        @NotBlank
        @Pattern(regexp = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO",
                message = "Informe uma UF brasileira válida em letras maiúsculas.")
        String uf
) {
}
