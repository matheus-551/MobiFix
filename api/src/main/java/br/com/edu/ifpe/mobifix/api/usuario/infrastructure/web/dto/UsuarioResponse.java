package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.web.dto;

import java.util.UUID;

public record UsuarioResponse(
        UUID id,
        String nome,
        String sobrenome,
        String email,
        String telefone,
        String uf,
        String tipo,
        boolean ativo
) {
}