package br.com.edu.ifpe.mobifix.api.shared.infrastructure.security;

import java.io.IOException;
import java.util.List;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class FirebaseAuthenticationFilter extends OncePerRequestFilter {
    private final VerificadorTokenFirebase verificador;
    public FirebaseAuthenticationFilter(VerificadorTokenFirebase verificador) { this.verificador = verificador; }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var headers = request.getHeaders("Authorization");
        if (!headers.hasMoreElements()) { chain.doFilter(request, response); return; }
        String header = headers.nextElement();
        try {
            if (headers.hasMoreElements() || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
                throw new BadCredentialsException("Authorization inválido.");
            }
            String token = header.substring(7);
            if (token.isBlank() || token.chars().anyMatch(Character::isWhitespace) || token.contains(",")) {
                throw new BadCredentialsException("Token inválido.");
            }
            String uid = verificador.verificar(token);
            if (uid == null || uid.isBlank()) throw new BadCredentialsException("UID inválido.");
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(uid, null, List.of()));
            SecurityContextHolder.setContext(context);
        } catch (AuthenticationException ex) {
            SecurityContextHolder.clearContext();
            RespostaSeguranca.escrever(response, ex instanceof AuthenticationServiceException ? 503 : 401);
            return;
        }
        chain.doFilter(request, response);
    }
}
