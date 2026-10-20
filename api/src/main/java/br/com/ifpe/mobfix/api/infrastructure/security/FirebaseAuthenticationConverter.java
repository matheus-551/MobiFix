package br.com.ifpe.mobfix.api.infrastructure.security;

import br.com.ifpe.mobfix.api.application.auth.BuscarUsuarioPorFirebaseUid;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class FirebaseAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    private final BuscarUsuarioPorFirebaseUid usuarios;

    public FirebaseAuthenticationConverter(BuscarUsuarioPorFirebaseUid usuarios) {
        this.usuarios = usuarios;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt token) {
        var usuario = usuarios.buscarAtivo(token.getSubject()).orElseThrow(() ->
            new OAuth2AuthenticationException(new OAuth2Error("invalid_token",
                "Usuario local indisponivel para autenticacao.", null)));
        return UsernamePasswordAuthenticationToken.authenticated(usuario, null,
            List.of(new SimpleGrantedAuthority("ROLE_" + usuario.papel())));
    }
}
