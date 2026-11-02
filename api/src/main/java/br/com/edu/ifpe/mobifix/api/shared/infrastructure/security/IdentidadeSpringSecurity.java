package br.com.edu.ifpe.mobifix.api.shared.infrastructure.security;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class IdentidadeSpringSecurity implements IdentidadeAtual {
    @Override
    public String firebaseId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new AuthenticationCredentialsNotFoundException("Autenticação necessária.");
        }
        return auth.getName();
    }
}
