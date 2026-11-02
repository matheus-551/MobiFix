package br.com.edu.ifpe.mobifix.api.prestador.domain.port;

import java.util.Optional;
import java.util.UUID;

import br.com.edu.ifpe.mobifix.api.prestador.domain.model.PerfilPrestador;

public interface PerfilPrestadorRepository {

    boolean existePorUsuarioId(UUID usuarioId);

    PerfilPrestador salvar(PerfilPrestador perfil);

    PerfilPrestador atualizar(PerfilPrestador perfil);

    Optional<PerfilPrestador> buscarPorUsuarioId(UUID usuarioId);
}