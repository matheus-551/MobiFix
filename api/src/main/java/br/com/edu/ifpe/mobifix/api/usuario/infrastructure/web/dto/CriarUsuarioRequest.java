package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.web.dto;

import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CriarUsuarioRequest(

        @NotBlank
        @Size(max = 100)
        String nome,

        @NotBlank
        @Size(max = 100)
        String sobrenome,

        @NotBlank
        @Email
        @Size(max = 254)
        String email,

        @NotBlank
        @Pattern(
                regexp = "[0-9]{10,11}",
                message = "Informe DDD e telefone com 10 ou 11 dígitos."
        )
        String telefone,

        @NotBlank
        @Pattern(
                regexp = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO",
                message = "Informe uma UF brasileira válida em letras maiúsculas."
        )
        String uf,

        @NotNull
        TipoUsuario tipo
) {
}