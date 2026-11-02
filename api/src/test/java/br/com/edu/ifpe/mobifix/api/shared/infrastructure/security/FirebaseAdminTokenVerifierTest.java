package br.com.edu.ifpe.mobifix.api.shared.infrastructure.security;

import com.google.firebase.auth.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.authentication.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FirebaseAdminTokenVerifierTest {
    @SuppressWarnings("unchecked")
    private final ObjectProvider<FirebaseAuth> provider = mock(ObjectProvider.class);
    private final FirebaseAuth auth = mock(FirebaseAuth.class);
    private final FirebaseAdminTokenVerifier verifier = new FirebaseAdminTokenVerifier(provider);

    @Test void utilizaVerificacaoComRevogacaoEUidOriginal() throws Exception {
        var token=mock(FirebaseToken.class);
        when(provider.getObject()).thenReturn(auth);
        when(auth.verifyIdToken("id-token", true)).thenReturn(token);
        when(token.getUid()).thenReturn("uid_real-nao-uuid");
        assertEquals("uid_real-nao-uuid", verifier.verificar("id-token"));
        verify(auth).verifyIdToken("id-token", true);
    }
    @ParameterizedTest
    @EnumSource(value=AuthErrorCode.class, names={"EXPIRED_ID_TOKEN", "INVALID_ID_TOKEN", "REVOKED_ID_TOKEN", "USER_DISABLED", "USER_NOT_FOUND"})
    void errosDeCredencialSaoRejeitados(AuthErrorCode code) throws Exception {
        var error=mock(FirebaseAuthException.class);
        when(error.getAuthErrorCode()).thenReturn(code);
        when(provider.getObject()).thenReturn(auth);
        when(auth.verifyIdToken("rejeitado", true)).thenThrow(error);
        assertThrows(BadCredentialsException.class, () -> verifier.verificar("rejeitado"));
    }
    @Test void falhaNaInicializacaoNaoEVistaComoCredencialInvalida() {
        when(provider.getObject()).thenThrow(new IllegalStateException("credencial ausente"));
        assertThrows(AuthenticationServiceException.class, () -> verifier.verificar("token"));
    }
    @Test void erroDeInfraestruturaFirebaseNaoEVistoComoTokenInvalido() throws Exception {
        var error=mock(FirebaseAuthException.class);
        when(provider.getObject()).thenReturn(auth);
        when(auth.verifyIdToken("token", true)).thenThrow(error);
        assertThrows(AuthenticationServiceException.class, () -> verifier.verificar("token"));
    }
    @Test void argumentoInvalidoDoSdkRetornaCredencialInvalida() throws Exception {
        when(provider.getObject()).thenReturn(auth);
        when(auth.verifyIdToken("token", true)).thenThrow(new IllegalArgumentException());
        assertThrows(BadCredentialsException.class, () -> verifier.verificar("token"));
    }
    @Test void configuracaoInvalidaNaoEVistaComoTokenInvalido() {
        when(provider.getObject()).thenThrow(new IllegalArgumentException("projeto inválido"));
        assertThrows(AuthenticationServiceException.class, () -> verifier.verificar("token"));
    }
}
