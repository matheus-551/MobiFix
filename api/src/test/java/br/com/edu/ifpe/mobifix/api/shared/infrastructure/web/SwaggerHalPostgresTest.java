package br.com.edu.ifpe.mobifix.api.shared.infrastructure.web;

import java.net.URI;
import java.time.*;
import java.util.*;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.*;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.desativarUsuarioAtual.DesativarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.port.VeiculoRepository;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.*;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.*;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.domain.port.HorarioAtendimentoRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@EnabledIfSystemProperty(named = "mobifix.test.postgres", matches = "true")
@SpringBootTest
@Transactional
class SwaggerHalPostgresTest {
    private static final String HAL = "application/hal+json";
    @Autowired WebApplicationContext context;
    @Autowired UsuarioRepository usuarios;
    @Autowired DesativarUsuarioAtual desativar;
    @Autowired VeiculoRepository veiculos;
    @Autowired PerfilPrestadorRepository perfis;
    @Autowired TipoVeiculoRepository tipos;
    @Autowired EspecialidadeRepository especialidades;
    @Autowired HorarioAtendimentoRepository horarios;
    @Value("${app.mock.firebase-id}") String identidade;
    private MockMvc mvc;
    @BeforeEach
    void configurar() { mvc = MockMvcBuilders.webAppContextSetup(context).build(); }
    private Usuario conta(String firebase, TipoUsuario tipo) {
        return usuarios.salvar(new Usuario(UUID.randomUUID(), firebase, "Ana", "Silva", UUID.randomUUID() + "@example.com", "81999999999", "PE", tipo, true));
    }
    private PerfilPrestador perfil(Usuario usuario, String nome) {
        return perfis.salvar(new PerfilPrestador(UUID.randomUUID(), usuario.id(), nome, "Serviços automotivos", new Endereco("Rua A", "10", null, "Centro", "Cabo de Santo Agostinho", "PE", "50000000"),
                Set.of(tipos.listarTodos().getFirst().id()), Set.of(especialidades.listarTodos().getFirst().id())));
    }
    @Test
    void swaggerUiDisponivel() throws Exception {
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML));
    }
    @Test
    void openApiDocumentaFormatosErrosEExemplos() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("MobiFix API"))
                .andExpect(jsonPath("$.paths['/api/v1/usuarios/me'].put.summary").value("Editar dados pessoais"))
                .andExpect(jsonPath("$.paths['/api/v1/usuarios/me'].put.responses['200'].content['application/json'].schema").exists())
                .andExpect(jsonPath("$.paths['/api/v1/usuarios/me'].put.responses['200'].content['application/hal+json'].schema").exists())
                .andExpect(jsonPath("$.paths['/api/v1/usuarios/me'].put.responses['422']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/usuarios/me'].put.requestBody.content['application/json'].example.nome").value("Maria"))
                .andExpect(jsonPath("$.paths['/api/v1/usuarios/me'].delete.responses['204'].content").doesNotExist())
                .andExpect(jsonPath("$.paths['/api/v1/prestadores'].get.responses['200'].content['application/hal+json'].schema.properties._embedded.properties.prestadores").exists())
                .andExpect(jsonPath("$.security").doesNotExist());
    }
    @Test
    void catalogosMantemArraysJsonPorPadrao() throws Exception {
        mvc.perform(get("/api/v1/tipos-veiculo")).andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON)).andExpect(jsonPath("$").isArray());
        mvc.perform(get("/api/v1/especialidades").accept(MediaType.APPLICATION_JSON)).andExpect(status().isOk()).andExpect(jsonPath("$").isArray());
    }
    @Test
    void catalogosHalSaoColecoesComLinksReais() throws Exception {
        mvc.perform(get("/api/v1/tipos-veiculo").accept(HAL)).andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith(HAL))
                .andExpect(jsonPath("$._embedded.tiposVeiculo").isArray()).andExpect(jsonPath("$._links.self.href").value("http://localhost/api/v1/tipos-veiculo"))
                .andExpect(jsonPath("$._embedded.tiposVeiculo[0]._links.catalogo.href").value("http://localhost/api/v1/tipos-veiculo"));
        mvc.perform(get("/api/v1/especialidades").accept(HAL)).andExpect(status().isOk()).andExpect(jsonPath("$._embedded.especialidades").isArray());
    }
    @Test
    void negociacaoRespeitaPrioridadeDoAccept() throws Exception {
        mvc.perform(get("/api/v1/tipos-veiculo").header("Accept", "application/json, application/hal+json;q=0.5")).andExpect(status().isOk()).andExpect(jsonPath("$").isArray());
        mvc.perform(get("/api/v1/tipos-veiculo").header("Accept", "application/hal+json, application/json;q=0.5")).andExpect(status().isOk()).andExpect(jsonPath("$._embedded").exists());
    }
    @Test
    void usuarioHalOfereceAcoesEJsonPermaneceIgual() throws Exception {
        conta(identidade, TipoUsuario.CLIENTE);
        mvc.perform(get("/api/v1/usuarios/me").accept(HAL)).andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Ana"))
                .andExpect(jsonPath("$._links.self.href").value("http://localhost/api/v1/usuarios/me"))
                .andExpect(jsonPath("$._links.editar").exists()).andExpect(jsonPath("$._links.desativar").exists())
                .andExpect(jsonPath("$._links.veiculos.href").value("http://localhost/api/v1/veiculos/me"));
        mvc.perform(get("/api/v1/usuarios/me").accept(MediaType.APPLICATION_JSON)).andExpect(status().isOk()).andExpect(jsonPath("$._links").doesNotExist());
    }
    @Test
    void contaInativaNaoRecebeLinksDeAlteracao() throws Exception {
        conta(identidade, TipoUsuario.CLIENTE);
        desativar.executar(identidade);
        mvc.perform(get("/api/v1/usuarios/me").accept(HAL)).andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(false)).andExpect(jsonPath("$._links.self").exists())
                .andExpect(jsonPath("$._links.editar").doesNotExist()).andExpect(jsonPath("$._links.desativar").doesNotExist())
                .andExpect(jsonPath("$._links.veiculos").doesNotExist());
    }
    @Test
    void colecaoVaziaHalMantemNomeDoEmbedded() throws Exception {
        conta(identidade, TipoUsuario.CLIENTE);
        mvc.perform(get("/api/v1/veiculos/me").accept(HAL)).andExpect(status().isOk()).andExpect(jsonPath("$._embedded.veiculos").isEmpty()).andExpect(jsonPath("$._links.self").exists());
    }
    @Test
    void cadastroHalMantem201ECriaLinkParaConsulta() throws Exception {
        String body = """
                {"nome":"Ana","sobrenome":"Silva","email":"ana-hal@example.com","telefone":"81999999999","uf":"PE","tipo":"CLIENTE"}
                """;
        String resposta = mvc.perform(post("/api/v1/usuarios").contentType(MediaType.APPLICATION_JSON).accept(HAL).content(body))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").exists()).andExpect(jsonPath("$._links.self").exists()).andReturn().getResponse().getContentAsString();
        String href = JsonPath.read(resposta, "$._links.self.href");
        mvc.perform(get(URI.create(href)).accept(HAL)).andExpect(status().isOk()).andExpect(jsonPath("$.email").value("ana-hal@example.com"));
    }
    @Test
    void putHalEDeleteSemCorpoPreservamSemantica() throws Exception {
        conta(identidade, TipoUsuario.CLIENTE);
        mvc.perform(put("/api/v1/usuarios/me").contentType(MediaType.APPLICATION_JSON).accept(HAL)
                .content("{\"nome\":\"Maria\",\"sobrenome\":\"Souza\",\"telefone\":\"11988888888\",\"uf\":\"SP\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Maria")).andExpect(jsonPath("$._links.self").exists());
        mvc.perform(delete("/api/v1/usuarios/me").accept(HAL)).andExpect(status().isNoContent()).andExpect(content().string(""));
    }
    @Test
    void errosHalMantemProblemDetailsENaoGanhamLinks() throws Exception {
        mvc.perform(get("/api/v1/usuarios/me").accept(HAL)).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404)).andExpect(jsonPath("$._links").doesNotExist());
        conta(identidade, TipoUsuario.CLIENTE);
        mvc.perform(put("/api/v1/usuarios/me").contentType(MediaType.APPLICATION_JSON).accept(HAL).content("{}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors").isArray());
    }
    @Test
    void veiculoHalPossuiLinksValidosEDeleteContinua204() throws Exception {
        Usuario usuario = conta(identidade, TipoUsuario.CLIENTE);
        Veiculo veiculo = veiculos.salvar(new Veiculo(UUID.randomUUID(), usuario.id(), tipos.listarTodos().getFirst().id(), "Fiat", "Uno", 2020, null));
        mvc.perform(get("/api/v1/veiculos/{id}", veiculo.id()).accept(HAL)).andExpect(status().isOk())
                .andExpect(jsonPath("$._links.self.href").value("http://localhost/api/v1/veiculos/" + veiculo.id()))
                .andExpect(jsonPath("$._links.collection.href").value("http://localhost/api/v1/veiculos/me"));
        mvc.perform(get("/api/v1/veiculos/me").accept(HAL)).andExpect(status().isOk()).andExpect(jsonPath("$._embedded.veiculos[0].id").value(veiculo.id().toString()));
        mvc.perform(delete("/api/v1/veiculos/{id}", veiculo.id()).accept(HAL)).andExpect(status().isNoContent()).andExpect(content().string(""));
    }
    @Test
    void perfilPrivadoEPublicoOferecemLinksSemVazarDados() throws Exception {
        PerfilPrestador perfil = perfil(conta(identidade, TipoUsuario.PRESTADOR), "Oficina A");
        mvc.perform(get("/api/v1/prestadores/me/perfil").accept(HAL)).andExpect(status().isOk())
                .andExpect(jsonPath("$._links.publico.href").value("http://localhost/api/v1/prestadores/" + perfil.id()));
        mvc.perform(get("/api/v1/prestadores/{id}", perfil.id()).accept(HAL)).andExpect(status().isOk())
                .andExpect(jsonPath("$._links.horarios.href").value("http://localhost/api/v1/prestadores/" + perfil.id() + "/horarios"))
                .andExpect(jsonPath("$._links.editar").doesNotExist()).andExpect(jsonPath("$.usuarioId").doesNotExist())
                .andExpect(jsonPath("$.email").doesNotExist()).andExpect(jsonPath("$.endereco").doesNotExist());
    }
    @Test
    void paginaHalPreservaFiltrosEPermiteSeguirNext() throws Exception {
        for(int i = 0; i < 3; i++) perfil(conta(UUID.randomUUID().toString(), TipoUsuario.PRESTADOR), "Oficina " + i);
        String resposta = mvc.perform(get(URI.create("/api/v1/prestadores?uf=PE&cidade=Cabo%20de%20Santo%20Agostinho&page=0&size=1")).accept(HAL))
                .andExpect(status().isOk()).andExpect(jsonPath("$._embedded.prestadores").isArray())
                .andExpect(jsonPath("$.page.totalElements").value(3)).andExpect(jsonPath("$.page.number").value(0))
                .andExpect(jsonPath("$._links.next").exists()).andExpect(jsonPath("$._links.prev").doesNotExist()).andReturn().getResponse().getContentAsString();
        String href = JsonPath.read(resposta, "$._links.next.href");
        assertTrue(href.contains("uf=PE")); assertTrue(href.contains("Cabo%20de%20Santo%20Agostinho"));
        mvc.perform(get(URI.create(href)).accept(HAL)).andExpect(status().isOk()).andExpect(jsonPath("$.page.number").value(1)).andExpect(jsonPath("$.page.totalElements").value(3));
        mvc.perform(get("/api/v1/prestadores").param("page", "2").param("size", "1").accept(HAL))
                .andExpect(status().isOk()).andExpect(jsonPath("$._links.next").doesNotExist()).andExpect(jsonPath("$._links.prev").exists());
        mvc.perform(get("/api/v1/prestadores").accept(MediaType.APPLICATION_JSON)).andExpect(status().isOk()).andExpect(jsonPath("$.content").isArray()).andExpect(jsonPath("$._embedded").doesNotExist());
    }
    @Test
    void paginaHalVaziaTemSomenteNavegacaoPossivel() throws Exception {
        mvc.perform(get("/api/v1/prestadores").accept(HAL)).andExpect(status().isOk())
                .andExpect(jsonPath("$._embedded.prestadores").isEmpty()).andExpect(jsonPath("$.page.totalElements").value(0))
                .andExpect(jsonPath("$._links.self").exists()).andExpect(jsonPath("$._links.next").doesNotExist()).andExpect(jsonPath("$._links.last").doesNotExist());
    }
    @Test
    void agendasHalPreservamArraysJsonELinksDeEdicaoSoNoFuturo() throws Exception {
        PerfilPrestador perfil = perfil(conta(identidade, TipoUsuario.PRESTADOR), "Oficina A");
        LocalDate data = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(1);
        horarios.salvar(new HorarioAtendimento(UUID.randomUUID(), perfil.id(), data, LocalTime.of(8, 30), 3, false));
        horarios.salvar(new HorarioAtendimento(UUID.randomUUID(), perfil.id(), data.minusDays(2), LocalTime.NOON, 3, false));
        mvc.perform(get("/api/v1/prestadores/me/horarios").param("inicio", data.minusDays(2).toString()).param("fim", data.toString()).accept(HAL))
                .andExpect(status().isOk()).andExpect(jsonPath("$._embedded.horarios[0]._links.editar").doesNotExist())
                .andExpect(jsonPath("$._embedded.horarios[1]._links.editar").exists());
        mvc.perform(get("/api/v1/prestadores/{id}/horarios", perfil.id()).accept(HAL)).andExpect(status().isOk())
                .andExpect(jsonPath("$._embedded.horarios[0].vagasDisponiveis").value(3))
                .andExpect(jsonPath("$._embedded.horarios[0]._links.editar").doesNotExist());
        mvc.perform(get("/api/v1/prestadores/me/horarios").accept(MediaType.APPLICATION_JSON)).andExpect(status().isOk()).andExpect(jsonPath("$").isArray());
    }
    @Test
    void criacaoEEdicaoDeVeiculoHalMantemStatusECampos() throws Exception {
        conta(identidade, TipoUsuario.CLIENTE);
        Long tipoId = tipos.listarTodos().getFirst().id();
        String body = "{\"tipoVeiculoId\":" + tipoId + ",\"marca\":\"Fiat\",\"modelo\":\"Uno\",\"ano\":2020,\"placa\":null}";
        String resposta = mvc.perform(post("/api/v1/veiculos").contentType(MediaType.APPLICATION_JSON).accept(HAL).content(body))
                .andExpect(status().isCreated()).andExpect(jsonPath("$._links.self").exists()).andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(resposta, "$.id");
        mvc.perform(put("/api/v1/veiculos/{id}", id).contentType(MediaType.APPLICATION_JSON).accept(HAL).content(body.replace("Fiat", "Honda")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.marca").value("Honda")).andExpect(jsonPath("$.id").value(id));
    }
    @Test
    void criacaoEEdicaoDePerfilHalMantemContratos() throws Exception {
        conta(identidade, TipoUsuario.PRESTADOR);
        Long tipoId = tipos.listarTodos().getFirst().id(), especialidadeId = especialidades.listarTodos().getFirst().id();
        String body = """
                {"nomeFantasia":"Oficina HAL","descricao":"Freios", "endereco":{"logradouro":"Rua A","numero":"10","bairro":"Centro","cidade":"Recife","uf":"PE","cep":"50000000"},"tiposVeiculoIds":[%d],"especialidadeIds":[%d]}
                """.formatted(tipoId, especialidadeId);
        String resposta = mvc.perform(post("/api/v1/prestadores/me/perfil").contentType(MediaType.APPLICATION_JSON).accept(HAL).content(body))
                .andExpect(status().isCreated()).andExpect(jsonPath("$._links.publico").exists()).andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(resposta, "$.id");
        mvc.perform(put("/api/v1/prestadores/me/perfil").contentType(MediaType.APPLICATION_JSON).accept(HAL).content(body.replace("Oficina HAL", "Oficina Atualizada")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nomeFantasia").value("Oficina Atualizada")).andExpect(jsonPath("$.id").value(id));
    }
    @Test
    void criacaoEEdicaoDeHorarioHalRespeitaCapacidadeEBloqueio() throws Exception {
        PerfilPrestador perfil = perfil(conta(identidade, TipoUsuario.PRESTADOR), "Oficina A");
        LocalDate data = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(1);
        String resposta = mvc.perform(post("/api/v1/prestadores/me/horarios").contentType(MediaType.APPLICATION_JSON).accept(HAL)
                .content("{\"data\":\"" + data + "\",\"horaInicio\":\"08:30\",\"capacidadeTotal\":3}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$._links.editar").exists()).andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(resposta, "$.id");
        mvc.perform(put("/api/v1/prestadores/me/horarios/{id}", id).contentType(MediaType.APPLICATION_JSON).accept(HAL)
                .content("{\"capacidadeTotal\":5,\"bloqueado\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.bloqueado").value(true)).andExpect(jsonPath("$.capacidadeTotal").value(5));
        mvc.perform(get("/api/v1/prestadores/{id}/horarios", perfil.id()).accept(HAL)).andExpect(status().isOk()).andExpect(jsonPath("$._embedded.horarios").isEmpty());
    }
}
