package br.com.ifpe.mobfix.api.application.auth;

import java.util.Optional;

public interface BuscarUsuarioPorFirebaseUid {
    Optional<UsuarioAutenticado> buscarAtivo(String firebaseUid);
}
