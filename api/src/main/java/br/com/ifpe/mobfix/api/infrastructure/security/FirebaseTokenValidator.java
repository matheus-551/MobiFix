package br.com.ifpe.mobfix.api.infrastructure.security;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import java.time.Instant;

/** Complementa a verificação de assinatura, expiração e emissor do Spring Security. */
public class FirebaseTokenValidator implements OAuth2TokenValidator<Jwt> {
    private final String projectId;

    public FirebaseTokenValidator(String projectId) {
        this.projectId = projectId;
    }

    public static OAuth2TokenValidator<Jwt> paraProjeto(String projectId) {
        return new org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator<>(
            org.springframework.security.oauth2.jwt.JwtValidators.createDefaultWithIssuer(
                "https://securetoken.google.com/" + projectId),
            new FirebaseTokenValidator(projectId));
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt token) {
        Instant agora = Instant.now();
        Object authTime = token.getClaims().get("auth_time");
        String uid = token.getSubject();
        boolean valido = token.getAudience() != null
            && token.getAudience().size() == 1 && token.getAudience().contains(projectId)
            && uid != null && !uid.isBlank() && uid.length() <= 128
            && token.getExpiresAt() != null && token.getExpiresAt().isAfter(agora)
            && token.getIssuedAt() != null && !token.getIssuedAt().isAfter(agora)
            && token.getExpiresAt().isAfter(token.getIssuedAt())
            && authTime instanceof Number
            && ((Number) authTime).longValue() >= 0
            && ((Number) authTime).longValue() <= agora.getEpochSecond()
            && ((Number) authTime).longValue() <= token.getIssuedAt().getEpochSecond()
            && Boolean.TRUE.equals(token.getClaims().get("email_verified"));
        return valido ? OAuth2TokenValidatorResult.success()
            : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token",
                "ID token Firebase invalido ou email nao verificado.", null));
    }
}
