package br.com.edu.ifpe.mobifix.api.usuario.application.useCase.criarUsuario;

import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;

public record CriarUsuarioCommand(
        String nome,
        String sobrenome,
        String email,
        String telefone,
        String uf,
        TipoUsuario tipo
) {
}