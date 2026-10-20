package br.com.ifpe.mobfix.api.infrastructure.security;

import br.com.ifpe.mobfix.api.application.auth.UsuarioAutenticado;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.util.Optional;
import java.util.UUID;

@Component
public class UsuarioAtualAuditor implements AuditorAware<UUID> {
    @Override
    public Optional<UUID> getCurrentAuditor() {
        var autenticacao = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacao == null || !autenticacao.isAuthenticated()
                || !(autenticacao.getPrincipal() instanceof UsuarioAutenticado usuario)) {
            return Optional.empty();
        }
        return Optional.of(usuario.id());
    }
}
