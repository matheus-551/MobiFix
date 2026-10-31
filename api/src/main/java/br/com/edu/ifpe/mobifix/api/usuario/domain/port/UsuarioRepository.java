package br.com.edu.ifpe.mobifix.api.usuario.domain.port;

import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;

import java.util.Optional;

public interface UsuarioRepository {

    boolean existePorFirebaseId(String firebaseId);

    boolean existePorEmail(String email);

    Usuario salvar(Usuario usuario);

    Usuario atualizarDadosPessoais(Usuario usuario);

    void desativarPorFirebaseId(String firebaseId);

    Optional<Usuario> buscarPorFirebaseId(String firebaseId);
}
