package br.com.ifpe.mobfix.api.config;

import br.com.ifpe.mobfix.api.infrastructure.security.FirebaseAuthenticationConverter;
import br.com.ifpe.mobfix.api.infrastructure.security.FirebaseTokenValidator;
import jakarta.servlet.DispatcherType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    JwtDecoder firebaseJwtDecoder(@Value("${firebase.project-id}") String projectId) {
        if (projectId.isBlank() || projectId.startsWith("${")) {
            throw new IllegalArgumentException("Configure FIREBASE_PROJECT_ID com o ID do projeto Firebase.");
        }
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(
            "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
            .jwsAlgorithm(SignatureAlgorithm.RS256).build();
        decoder.setJwtValidator(FirebaseTokenValidator.paraProjeto(projectId));
        return decoder;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
            FirebaseAuthenticationConverter converter) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .requestCache(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(requests -> requests
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(resource -> resource.jwt(jwt -> jwt.jwtAuthenticationConverter(converter)))
            .build();
    }
}
