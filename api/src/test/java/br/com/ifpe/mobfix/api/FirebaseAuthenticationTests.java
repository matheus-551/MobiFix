package br.com.ifpe.mobfix.api;

import br.com.ifpe.mobfix.api.infrastructure.persistence.entity.Usuario;
import br.com.ifpe.mobfix.api.infrastructure.persistence.entity.TipoVeiculo;
import br.com.ifpe.mobfix.api.infrastructure.security.FirebaseTokenValidator;
import br.com.ifpe.mobfix.api.infrastructure.security.UsuarioAtualAuditor;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "firebase.project-id=mobifix-test")
@Transactional
@Import(FirebaseAuthenticationTests.TokenConfig.class)
class FirebaseAuthenticationTests {
    private static final RSAKey CHAVE = gerarChave();
    private static RSAKey gerarChave() {
        try { return new RSAKeyGenerator(2048).keyID("teste").generate(); }
        catch (JOSEException e) { throw new IllegalStateException(e); }
    }

    @TestConfiguration
    static class TokenConfig {
        @Bean @Primary
        JwtDecoder decoderDeTeste() throws JOSEException {
            var decoder = NimbusJwtDecoder.withPublicKey(CHAVE.toRSAPublicKey()).build();
            decoder.setJwtValidator(FirebaseTokenValidator.paraProjeto("mobifix-test"));
            return decoder;
        }
        @Bean
        EscritaAuditada escritaAuditada(EntityManager manager) { return new EscritaAuditada(manager); }
    }

    /** Endpoint somente de teste para validar o autor da escrita na mesma requisição. */
    @RestController
    static class EscritaAuditada {
        private final EntityManager manager;
        EscritaAuditada(EntityManager manager) { this.manager = manager; }
        @PostMapping("/teste/auditoria")
        Map<String, UUID> escrever() {
            TipoVeiculo tipo = new TipoVeiculo();
            tipo.setNome(UUID.randomUUID().toString());
            manager.persist(tipo);
            manager.flush();
            return Map.of("criadoPor", tipo.getCriadoPor(), "atualizadoPor", tipo.getAtualizadoPor());
        }
    }

    @Autowired WebApplicationContext context;
    @Autowired EntityManager manager;
    @Autowired UsuarioAtualAuditor auditor;
    private MockMvc mvc;
    private Usuario usuario;

    @BeforeEach
    void preparar() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        usuario = new Usuario();
        usuario.setFirebaseUid(UUID.randomUUID().toString());
        usuario.setEmail(UUID.randomUUID() + "@example.com");
        usuario.setPapel("CLIENTE");
        usuario.setStatus("ATIVO");
        usuario.setEmailVerificado(true);
        manager.persist(usuario);
        manager.flush();
    }

    private JWTClaimsSet.Builder claims() {
        Instant agora = Instant.now();
        return new JWTClaimsSet.Builder().subject(usuario.getFirebaseUid())
            .issuer("https://securetoken.google.com/mobifix-test").audience("mobifix-test")
            .issueTime(Date.from(agora.minusSeconds(10))).expirationTime(Date.from(agora.plusSeconds(600)))
            .claim("auth_time", agora.minusSeconds(20).getEpochSecond()).claim("email_verified", true)
            .claim("email", "nao-usar-para-vincular@example.com").claim("papel", "ADMIN");
    }
    private String assinar(JWTClaimsSet.Builder claims, RSAKey chave) throws JOSEException {
        SignedJWT token = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID("teste").build(), claims.build());
        token.sign(new RSASSASigner(chave));
        return token.serialize();
    }
    private void rejeitar(JWTClaimsSet.Builder claims) throws Exception {
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + assinar(claims, CHAVE)))
            .andExpect(status().isUnauthorized());
    }

    @Test void deveVincularPorUidEUsarDadosLocais() throws Exception {
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + assinar(claims(), CHAVE)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(usuario.getId().toString()))
            .andExpect(jsonPath("$.email").value(usuario.getEmail()))
            .andExpect(jsonPath("$.papel").value("CLIENTE"))
            .andExpect(jsonPath("$.firebaseUid").value(usuario.getFirebaseUid()))
            .andExpect(jsonPath("$.versao").doesNotExist());
    }
    @Test void devePreencherAuditoriaELimparContextoDepoisDaRequisicao() throws Exception {
        mvc.perform(post("/teste/auditoria").header("Authorization", "Bearer " + assinar(claims(), CHAVE)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.criadoPor").value(usuario.getId().toString()))
            .andExpect(jsonPath("$.atualizadoPor").value(usuario.getId().toString()));
        assertTrue(auditor.getCurrentAuditor().isEmpty());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
    @Test void deveRejeitarAusenciaOuTokenMalformado() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer invalido"))
            .andExpect(status().isUnauthorized());
    }
    @Test void deveRejeitarAssinaturaIncorreta() throws Exception {
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + assinar(claims(), gerarChave())))
            .andExpect(status().isUnauthorized());
    }
    @Test void deveRejeitarProjetoIncorreto() throws Exception {
        rejeitar(claims().audience("outro-projeto"));
        rejeitar(claims().issuer("https://securetoken.google.com/outro-projeto"));
    }
    @Test void deveRejeitarDatasInvalidas() throws Exception {
        rejeitar(claims().expirationTime(Date.from(Instant.now().minusSeconds(120))));
        rejeitar(claims().issueTime(Date.from(Instant.now().plusSeconds(120))));
        rejeitar(claims().claim("auth_time", Instant.now().plusSeconds(120).getEpochSecond()));
    }
    @Test void deveRejeitarClaimsObrigatoriosAusentes() throws Exception {
        rejeitar(claims().audience((String) null));
        rejeitar(claims().issuer(null));
        rejeitar(claims().expirationTime(null));
        rejeitar(claims().issueTime(null));
        rejeitar(claims().subject(null));
    }
    @Test void deveRejeitarUidOuVerificacaoInvalida() throws Exception {
        rejeitar(claims().subject(""));
        rejeitar(claims().claim("email_verified", false));
        rejeitar(claims().claim("auth_time", null));
    }
    @Test void deveRejeitarContaNaoVinculadaMesmoComMesmoEmail() throws Exception {
        rejeitar(claims().subject("uid-desconhecido").claim("email", usuario.getEmail()));
    }
    @Test void deveRejeitarContaLocalDesabilitadaOuPendente() throws Exception {
        usuario.setHabilitado(false); manager.flush(); rejeitar(claims());
        usuario.setHabilitado(true); usuario.setStatus("PENDENTE_VERIFICACAO"); manager.flush(); rejeitar(claims());
        usuario.setStatus("ATIVO"); usuario.setPapel("ADMIN"); manager.flush(); rejeitar(claims());
    }
}
