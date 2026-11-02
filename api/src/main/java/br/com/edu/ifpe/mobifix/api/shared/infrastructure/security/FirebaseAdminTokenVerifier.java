package br.com.edu.ifpe.mobifix.api.shared.infrastructure.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;

@Component
public class FirebaseAdminTokenVerifier implements VerificadorTokenFirebase {
    private final ObjectProvider<FirebaseAuth> firebaseAuth;
    public FirebaseAdminTokenVerifier(ObjectProvider<FirebaseAuth> firebaseAuth) { this.firebaseAuth = firebaseAuth; }

    @Override
    public String verificar(String token) {
        final FirebaseAuth auth;
        try {
            auth = firebaseAuth.getObject();
        } catch (RuntimeException ex) {
            throw new AuthenticationServiceException("Serviço de autenticação indisponível.");
        }
        try {
            // Além de assinatura, projeto e validade, verifica revogação e usuário desabilitado.
            return auth.verifyIdToken(token, true).getUid();
        } catch (FirebaseAuthException ex) {
            String code = String.valueOf(ex.getAuthErrorCode());
            if (java.util.Set.of("EXPIRED_ID_TOKEN", "INVALID_ID_TOKEN", "REVOKED_ID_TOKEN",
                    "USER_DISABLED", "USER_NOT_FOUND").contains(code)) {
                throw new BadCredentialsException("Token Firebase inválido.");
            }
            throw new AuthenticationServiceException("Não foi possível validar a autenticação.");
        } catch (IllegalArgumentException ex) {
            throw new BadCredentialsException("Token Firebase inválido.");
        } catch (RuntimeException ex) {
            // Falha de configuração ou acesso ao serviço não deve parecer token inválido.
            throw new AuthenticationServiceException("Serviço de autenticação indisponível.");
        }
    }
}
