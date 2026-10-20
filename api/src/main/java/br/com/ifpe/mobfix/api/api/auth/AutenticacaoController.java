package br.com.ifpe.mobfix.api.api.auth;

import br.com.ifpe.mobfix.api.application.auth.UsuarioAutenticado;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AutenticacaoController {
    @GetMapping("/me")
    public UsuarioResponse usuarioAtual(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return new UsuarioResponse(usuario.id(), usuario.firebaseUid(), usuario.email(), usuario.papel());
    }

    public record UsuarioResponse(UUID id, String firebaseUid, String email, String papel) {
    }
}
