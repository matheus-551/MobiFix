package br.com.ifpe.mobfix.api.application.auth;

import java.util.UUID;

public record UsuarioAutenticado(UUID id, String firebaseUid, String email, String papel) {
}
