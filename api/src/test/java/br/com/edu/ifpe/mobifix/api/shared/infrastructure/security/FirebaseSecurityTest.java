package br.com.edu.ifpe.mobifix.api.shared.infrastructure.security;

import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.authentication.*;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.mockito.Mockito.*;

@SpringJUnitConfig(FirebaseSecurityTest.Config.class)
@WebAppConfiguration
class FirebaseSecurityTest {
    @Configuration
    @EnableWebMvc
    @EnableWebSecurity
    @Import({SecurityConfiguration.class, IdentidadeSpringSecurity.class})
    static class Config {
        @Bean VerificadorTokenFirebase verificador() { return mock(VerificadorTokenFirebase.class); }
        @Bean Rotas rotas(IdentidadeAtual identidade) { return new Rotas(identidade); }
        @Bean static org.springframework.context.support.PropertySourcesPlaceholderConfigurer properties() {
            var config = new org.springframework.context.support.PropertySourcesPlaceholderConfigurer();
            var props = new java.util.Properties();
            props.setProperty("app.cors.allowed-origins", "http://localhost:5173");
            config.setProperties(props);
            return config;
        }
    }
    @RestController
    static class Rotas {
        private final IdentidadeAtual identidade;
        Rotas(IdentidadeAtual identidade) { this.identidade = identidade; }
        @GetMapping({"/api/v1/tipos-veiculo", "/api/v1/especialidades", "/api/v1/prestadores",
                "/api/v1/prestadores/{id}", "/api/v1/prestadores/{id}/horarios", "/swagger-ui/index.html", "/v3/api-docs"})
        String publica() { return "publico"; }
        @GetMapping({"/api/v1/usuarios/me", "/api/v1/veiculos/me", "/api/v1/prestadores/me/perfil", "/api/v1/prestadores/me/horarios"})
        String privada() { return identidade.firebaseId(); }
        @PostMapping("/api/v1/usuarios") String criar() { return identidade.firebaseId(); }
        @DeleteMapping("/api/v1/usuarios/me") void apagar() {}
    }
    @Autowired WebApplicationContext context;
    @Autowired VerificadorTokenFirebase verificador;
    MockMvc mvc;
    @BeforeEach void setup() {
        reset(verificador);
        when(verificador.verificar("valido")).thenReturn("uid-firebase-sem-uuid");
        mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }
    @ParameterizedTest
    @ValueSource(strings={"/api/v1/tipos-veiculo", "/api/v1/especialidades", "/api/v1/prestadores", "/api/v1/prestadores/abc", "/api/v1/prestadores/abc/horarios", "/swagger-ui/index.html", "/v3/api-docs"})
    void consultasPublicasSemLogin(String path) throws Exception {
        mvc.perform(get(path)).andExpect(status().isOk()); verifyNoInteractions(verificador);
    }
    @ParameterizedTest
    @ValueSource(strings={"/api/v1/usuarios/me", "/api/v1/veiculos/me", "/api/v1/prestadores/me/perfil", "/api/v1/prestadores/me/horarios"})
    void gerenciamentoExigeLogin(String path) throws Exception {
        mvc.perform(get(path).accept("application/hal+json")).andExpect(status().isUnauthorized())
            .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
            .andExpect(header().string("WWW-Authenticate", "Bearer")).andExpect(jsonPath("$.status").value(401));
        verifyNoInteractions(verificador);
    }
    @ParameterizedTest
    @ValueSource(strings={"Basic abc", "Bearer", "Bearer ", "Bearer a b", "Bearer a,b"})
    void headerMalformadoNaoChegaAoSdk(String header) throws Exception {
        mvc.perform(get("/api/v1/usuarios/me").header("Authorization", header)).andExpect(status().isUnauthorized());
        verifyNoInteractions(verificador);
    }
    @Test void rejeitaHeadersDuplicados() throws Exception {
        mvc.perform(get("/api/v1/usuarios/me").header("Authorization", "Bearer valido", "Bearer outro"))
            .andExpect(status().isUnauthorized()); verifyNoInteractions(verificador);
    }
    @Test void identidadeVemSomenteDoTokenVerificado() throws Exception {
        mvc.perform(post("/api/v1/usuarios").header("Authorization", "bearer valido")
                .header("X-Firebase-Id", "invasor").contentType("application/json").content("{\"firebaseId\":\"invasor\"}"))
            .andExpect(status().isOk()).andExpect(content().string("uid-firebase-sem-uuid"));
        verify(verificador).verificar("valido");
    }
    @Test void identidadeNaoVazaParaProximaRequisicaoNemCriaSessao() throws Exception {
        var result=mvc.perform(get("/api/v1/usuarios/me").header("Authorization", "Bearer valido"))
            .andExpect(status().isOk()).andReturn();
        Assertions.assertNull(result.getRequest().getSession(false));
        mvc.perform(get("/api/v1/usuarios/me")).andExpect(status().isUnauthorized());
    }
    @Test void trocaDeContaNaoReutilizaUidAnterior() throws Exception {
        when(verificador.verificar("outro")).thenReturn("outra-conta");
        mvc.perform(get("/api/v1/usuarios/me").header("Authorization", "Bearer valido")).andExpect(content().string("uid-firebase-sem-uuid"));
        mvc.perform(get("/api/v1/usuarios/me").header("Authorization", "Bearer outro")).andExpect(content().string("outra-conta"));
    }
    @Test void tokenRejeitadoRetorna401SemExporTokenOuExcecao() throws Exception {
        when(verificador.verificar("expirado")).thenThrow(new BadCredentialsException("dados secretos"));
        mvc.perform(get("/api/v1/usuarios/me").header("Authorization", "Bearer expirado"))
            .andExpect(status().isUnauthorized()).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("dados secretos"))));
    }
    @Test void falhaDeServicoRetorna503() throws Exception {
        when(verificador.verificar("falha")).thenThrow(new AuthenticationServiceException("credencial secreta"));
        mvc.perform(get("/api/v1/usuarios/me").header("Authorization", "Bearer falha"))
            .andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.status").value(503));
    }
    @Test void uidVazioNaoAutentica() throws Exception {
        when(verificador.verificar("vazio")).thenReturn("");
        mvc.perform(get("/api/v1/usuarios/me").header("Authorization", "Bearer vazio")).andExpect(status().isUnauthorized());
    }
    @Test void preflightPermitidoParaOrigemConfigurada() throws Exception {
        mvc.perform(options("/api/v1/usuarios").header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST").header("Access-Control-Request-Headers", "authorization,content-type"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        verifyNoInteractions(verificador);
    }
    @Test void origemNaoConfiguradaNaoRecebePermissaoCors() throws Exception {
        mvc.perform(options("/api/v1/usuarios").header("Origin", "https://desconhecido.example")
                .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
    @Test void metodoDeEscritaNaoEPublicoMesmoEmCatalogo() throws Exception {
        mvc.perform(post("/api/v1/tipos-veiculo")).andExpect(status().isUnauthorized());
    }
}
