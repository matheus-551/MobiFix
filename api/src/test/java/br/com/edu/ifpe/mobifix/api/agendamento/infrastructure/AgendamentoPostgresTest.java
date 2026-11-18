package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import br.com.edu.ifpe.mobifix.api.agenda.application.AtualizarHorarioCommand;
import br.com.edu.ifpe.mobifix.api.agenda.application.CriarHorarioCommand;
import br.com.edu.ifpe.mobifix.api.agenda.application.GerenciarAgenda;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.domain.port.HorarioAtendimentoRepository;
import br.com.edu.ifpe.mobifix.api.agendamento.application.Agendamentos;
import br.com.edu.ifpe.mobifix.api.agendamento.application.CriarAgendamentoCommand;
import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.persistence.initializer.AgendamentoSchemaInitializer;
import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.persistence.repository.AgendamentoJpaRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.EspecialidadeRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.Endereco;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.PerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;
import br.com.edu.ifpe.mobifix.api.shared.infrastructure.security.VerificadorTokenFirebase;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.port.VeiculoRepository;

import jakarta.persistence.EntityManager;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Set;
import java.util.UUID;

@EnabledIfSystemProperty(named = "mobifix.test.postgres", matches = "true")
@SpringBootTest
@Transactional
class AgendamentoPostgresTest {

    @Autowired Agendamentos agendamentos;
    @Autowired AgendamentoJpaRepository reservas;
    @Autowired GerenciarAgenda agenda;
    @Autowired UsuarioRepository usuarios;
    @Autowired VeiculoRepository veiculos;
    @Autowired PerfilPrestadorRepository perfis;
    @Autowired HorarioAtendimentoRepository horarios;
    @Autowired TipoVeiculoRepository tipos;
    @Autowired EspecialidadeRepository especialidades;
    @Autowired WebApplicationContext context;
    @MockitoBean VerificadorTokenFirebase verificador;

    @Autowired private EntityManager entityManager;

    @Autowired private JdbcTemplate jdbc;

    @Autowired private AgendamentoSchemaInitializer indice;

    private MockMvc mvc;

    private Usuario cliente;

    private Usuario outro;

    private Usuario profissional;

    private PerfilPrestador perfil;

    private Veiculo veiculo;

    private HorarioAtendimento horario;

    private Long tipo;

    private Long especialidade;

    private Usuario conta(TipoUsuario tipo) {
        String uid = UUID.randomUUID().toString();

        return usuarios.salvar(
                new Usuario(
                        UUID.randomUUID(),
                        uid,
                        "Ana",
                        "Silva",
                        uid + "@example.com",
                        "81999999999",
                        "PE",
                        tipo,
                        true));
    }

    private PerfilPrestador perfil(Usuario usuario) {
        return perfis.salvar(
                new PerfilPrestador(
                        UUID.randomUUID(),
                        usuario.id(),
                        "Oficina",
                        null,
                        new Endereco("Rua A", "10", null, "Centro", "Recife", "PE", "50000000"),
                        Set.of(tipo),
                        Set.of(especialidade)));
    }

    private Veiculo carro(Usuario usuario) {
        return veiculos.salvar(
                new Veiculo(UUID.randomUUID(), usuario.id(), tipo, "Fiat", "Uno", 2020, null));
    }

    @BeforeEach
    void preparar() {
        tipo = tipos.listarTodos().getFirst().id();
        especialidade = especialidades.listarTodos().getFirst().id();
        cliente = conta(TipoUsuario.CLIENTE);
        outro = conta(TipoUsuario.CLIENTE);
        profissional = conta(TipoUsuario.PRESTADOR);
        perfil = perfil(profissional);
        veiculo = carro(cliente);
        horario =
                agenda.criar(
                        profissional.firebaseId(),
                        new CriarHorarioCommand(
                                LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(2),
                                LocalTime.NOON,
                                3));
        when(verificador.verificar("cliente")).thenReturn(cliente.firebaseId());
        when(verificador.verificar("prestador")).thenReturn(profissional.firebaseId());
        when(verificador.verificar("outro")).thenReturn(outro.firebaseId());
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private String body(UUID carro, UUID slot, Long esp) {
        return "{\"veiculoId\":\""
                + carro
                + "\",\"horarioId\":\""
                + slot
                + "\",\"especialidadeId\":"
                + esp
                + "}";
    }

    private CriarAgendamentoCommand command(Veiculo carro) {
        return new CriarAgendamentoCommand(carro.id(), horario.id(), especialidade);
    }

    @Test
    void criaComTokenRetorna201LocationEConsultaRestritaAosEnvolvidos() throws Exception {
        var result =
                mvc.perform(
                                post("/api/v1/agendamentos")
                                        .header("Authorization", "Bearer cliente")
                                        .contentType("application/json")
                                        .content(body(veiculo.id(), horario.id(), especialidade)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.status").value("PENDENTE"))
                        .andExpect(jsonPath("$.clienteId").value(cliente.id().toString()))
                        .andExpect(jsonPath("$.prestadorId").value(perfil.id().toString()))
                        .andExpect(jsonPath("$._links").doesNotExist())
                        .andExpect(header().exists("Location"))
                        .andReturn();
        String location = result.getResponse().getHeader("Location");
        mvc.perform(get(location).header("Authorization", "Bearer cliente"))
                .andExpect(status().isOk());
        mvc.perform(get(location).header("Authorization", "Bearer prestador"))
                .andExpect(status().isOk());
        mvc.perform(get(location).header("Authorization", "Bearer outro"))
                .andExpect(status().isNotFound());
        mvc.perform(get(location)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/agendamentos/me").header("Authorization", "Bearer prestador"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/v1/agendamentos/me").header("Authorization", "Bearer outro"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void halOfereceAcoesPermitidasEPaginaVaziaNomeada() throws Exception {
        mvc.perform(
                        post("/api/v1/agendamentos")
                                .header("Authorization", "Bearer cliente")
                                .accept("application/hal+json")
                                .contentType("application/json")
                                .content(body(veiculo.id(), horario.id(), especialidade)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$._links.self").exists())
                .andExpect(jsonPath("$._links.collection").exists())
                .andExpect(jsonPath("$._links.cancelar").exists())
                .andExpect(jsonPath("$._links.confirmar").doesNotExist());
        mvc.perform(
                        get("/api/v1/agendamentos/me")
                                .header("Authorization", "Bearer cliente")
                                .accept("application/hal+json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$._embedded.agendamentos[0].status").value("PENDENTE"))
                .andExpect(jsonPath("$.page.totalElements").value(1));
        mvc.perform(
                        get("/api/v1/agendamentos/me")
                                .header("Authorization", "Bearer outro")
                                .accept("application/hal+json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$._embedded.agendamentos").isEmpty())
                .andExpect(jsonPath("$._links.first").doesNotExist());
    }

    @Test
    void disponibilidadeDescontaReservasEOcultaHorarioLotado() throws Exception {
        agendamentos.criar(cliente.firebaseId(), command(veiculo));
        assertEquals(
                2,
                agenda.listarPublicos(perfil.id(), horario.data(), horario.data())
                        .getFirst()
                        .vagasDisponiveis());
        agendamentos.criar(cliente.firebaseId(), command(carro(cliente)));
        agendamentos.criar(cliente.firebaseId(), command(carro(cliente)));
        assertTrue(agenda.listarPublicos(perfil.id(), horario.data(), horario.data()).isEmpty());
        mvc.perform(
                        post("/api/v1/agendamentos")
                                .header("Authorization", "Bearer cliente")
                                .contentType("application/json")
                                .content(body(carro(cliente).id(), horario.id(), especialidade)))
                .andExpect(status().isConflict());
        assertEquals(3, reservas.countByHorario_Id(horario.id()));
    }

    @Test
    void capacidadeNaoPodeSerReduzidaAbaixoDaOcupacao() throws Exception {
        agendamentos.criar(cliente.firebaseId(), command(veiculo));
        mvc.perform(
                        put("/api/v1/prestadores/me/horarios/{id}", horario.id())
                                .header("Authorization", "Bearer prestador")
                                .contentType("application/json")
                                .content("{\"capacidadeTotal\":0,\"bloqueado\":false}"))
                .andExpect(status().is(422));
        assertEquals(
                3,
                horarios.buscarPorIdEPrestadorId(horario.id(), perfil.id())
                        .orElseThrow()
                        .capacidadeTotal());
    }

    @Test
    void bloqueioPreservaReservaEPodeReabrirComNovaCapacidade() {
        var reserva = agendamentos.criar(cliente.firebaseId(), command(veiculo));
        agenda.atualizar(
                profissional.firebaseId(), horario.id(), new AtualizarHorarioCommand(1, true));
        assertTrue(agenda.listarPublicos(perfil.id(), horario.data(), horario.data()).isEmpty());
        assertEquals(
                reserva.id(), agendamentos.consultar(profissional.firebaseId(), reserva.id()).id());
        agenda.atualizar(
                profissional.firebaseId(), horario.id(), new AtualizarHorarioCommand(2, false));
        assertEquals(
                1,
                agenda.listarPublicos(perfil.id(), horario.data(), horario.data())
                        .getFirst()
                        .vagasDisponiveis());
    }

    @Test
    void mesmoVeiculoNaoReservaMesmoInstanteEmOutroPrestador() throws Exception {
        agendamentos.criar(cliente.firebaseId(), command(veiculo));
        var segundo = conta(TipoUsuario.PRESTADOR);
        perfil(segundo);
        var outroHorario =
                agenda.criar(
                        segundo.firebaseId(),
                        new CriarHorarioCommand(horario.data(), horario.horaInicio(), 3));
        mvc.perform(
                        post("/api/v1/agendamentos")
                                .header("Authorization", "Bearer cliente")
                                .contentType("application/json")
                                .content(body(veiculo.id(), outroHorario.id(), especialidade)))
                .andExpect(status().isConflict());
        assertEquals(0, reservas.countByHorario_Id(outroHorario.id()));
    }

    @Test
    void paginacaoTemOrdemDeterministicaEPreservaLinks() throws Exception {
        agendamentos.criar(cliente.firebaseId(), command(veiculo));
        agendamentos.criar(cliente.firebaseId(), command(carro(cliente)));
        var primeira = agendamentos.listarMeus(cliente.firebaseId(), 0, 1);
        var segunda = agendamentos.listarMeus(cliente.firebaseId(), 1, 1);
        assertEquals(2, primeira.totalElements());
        assertNotEquals(primeira.content().getFirst().id(), segunda.content().getFirst().id());
        var resposta =
                mvc.perform(
                                get("/api/v1/agendamentos/me?size=1&page=0")
                                        .header("Authorization", "Bearer cliente")
                                        .accept("application/hal+json"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$._links.next.href").exists())
                        .andReturn();
        String proxima =
                com.jayway.jsonpath.JsonPath.read(
                        resposta.getResponse().getContentAsString(), "$._links.next.href");
        mvc.perform(
                        get(proxima)
                                .header("Authorization", "Bearer cliente")
                                .accept("application/hal+json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.number").value(1))
                .andExpect(jsonPath("$._links.next").doesNotExist())
                .andExpect(jsonPath("$._links.prev").exists());
    }

    @Test
    void identidadeAlheiaNoCorpoNaoEscolheProprietario() throws Exception {
        String adulterado =
                body(veiculo.id(), horario.id(), especialidade)
                        .replace("}", ",\"clienteId\":\"" + outro.id() + "\"}");
        mvc.perform(
                        post("/api/v1/agendamentos")
                                .header("Authorization", "Bearer cliente")
                                .contentType("application/json")
                                .content(adulterado))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.clienteId").value(cliente.id().toString()));
    }

    @Test
    void validoSemTokenNaoCriaEValidacaoRetornaProblemDetails() throws Exception {
        mvc.perform(
                        post("/api/v1/agendamentos")
                                .contentType("application/json")
                                .content(body(veiculo.id(), horario.id(), especialidade)))
                .andExpect(status().isUnauthorized());
        mvc.perform(
                        post("/api/v1/agendamentos")
                                .header("Authorization", "Bearer cliente")
                                .contentType("application/json")
                                .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.errors").isArray());
        mvc.perform(
                        get("/api/v1/agendamentos/me?size=101")
                                .header("Authorization", "Bearer cliente"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void veiculoDeOutroClienteEDesativadoSaoIndisponiveis() throws Exception {
        mvc.perform(
                        post("/api/v1/agendamentos")
                                .header("Authorization", "Bearer outro")
                                .contentType("application/json")
                                .content(body(veiculo.id(), horario.id(), especialidade)))
                .andExpect(status().isNotFound());
        veiculos.desativar(veiculo.id(), cliente.id());
        mvc.perform(
                        post("/api/v1/agendamentos")
                                .header("Authorization", "Bearer cliente")
                                .contentType("application/json")
                                .content(body(veiculo.id(), horario.id(), especialidade)))
                .andExpect(status().isNotFound());
    }

    @Test
    void contaInativaESolicitacaoPorPrestadorNaoReservam() throws Exception {
        mvc.perform(
                        post("/api/v1/agendamentos")
                                .header("Authorization", "Bearer prestador")
                                .contentType("application/json")
                                .content(body(veiculo.id(), horario.id(), especialidade)))
                .andExpect(status().is(422));
        usuarios.desativarPorFirebaseId(cliente.firebaseId());
        mvc.perform(get("/api/v1/agendamentos/me").header("Authorization", "Bearer cliente"))
                .andExpect(status().is(422));
    }

    @Test
    void especialidadeNaoAtendidaNaoOcupaVaga() throws Exception {
        mvc.perform(
                        post("/api/v1/agendamentos")
                                .header("Authorization", "Bearer cliente")
                                .contentType("application/json")
                                .content(body(veiculo.id(), horario.id(), Long.MAX_VALUE)))
                .andExpect(status().is(422));
        assertEquals(0, reservas.countByHorario_Id(horario.id()));
    }

    @Test
    void openApiDocumentaOperacoesProtegidasEFormatos() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.paths['/api/v1/agendamentos'].post.summary")
                                .value("Criar agendamento"))
                .andExpect(
                        jsonPath("$.paths['/api/v1/agendamentos'].post.security[0].firebaseBearer")
                                .exists())
                .andExpect(
                        jsonPath("$.paths['/api/v1/agendamentos'].post.responses['409']").exists())
                .andExpect(
                        jsonPath(
                                        "$.paths['/api/v1/agendamentos/me'].get.responses['200'].content['application/hal+json'].schema.properties._embedded.properties.agendamentos")
                                .exists());
    }

    @Test
    void confirmarCancelarEReagendarPreservaAuditoriaELiberaVaga() throws Exception {
        var reserva = agendamentos.criar(cliente.firebaseId(), command(veiculo));

        mvc.perform(
                        patch("/api/v1/agendamentos/{id}/confirmar", reserva.id())
                                .header("Authorization", "Bearer prestador")
                                .accept("application/hal+json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMADO"))
                .andExpect(jsonPath("$.confirmadoPor").value(profissional.id().toString()))
                .andExpect(jsonPath("$.confirmadoEm").isNotEmpty())
                .andExpect(jsonPath("$._links.confirmar").doesNotExist())
                .andExpect(jsonPath("$._links.cancelar").exists());

        assertEquals(1, reservas.countByHorario_Id(horario.id()));

        mvc.perform(
                        patch("/api/v1/agendamentos/{id}/cancelar", reserva.id())
                                .header("Authorization", "Bearer cliente")
                                .accept("application/hal+json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELADO"))
                .andExpect(jsonPath("$.canceladoPor").value(cliente.id().toString()))
                .andExpect(jsonPath("$.confirmadoPor").value(profissional.id().toString()))
                .andExpect(jsonPath("$._links.cancelar").doesNotExist());

        assertEquals(0, reservas.countByHorario_Id(horario.id()));
        assertEquals(
                3,
                agenda.listarPublicos(perfil.id(), horario.data(), horario.data())
                        .getFirst()
                        .vagasDisponiveis());

        var nova = agendamentos.criar(cliente.firebaseId(), command(veiculo));

        assertNotEquals(reserva.id(), nova.id());
        assertEquals(2, agendamentos.listarMeus(cliente.firebaseId(), 0, 20).totalElements());
        assertEquals(
                "CANCELADO",
                agendamentos.consultar(cliente.firebaseId(), reserva.id()).status().name());
    }

    @Test
    void acoesRespeitamPermissoesEstadoEPrazo() throws Exception {
        var reserva = agendamentos.criar(cliente.firebaseId(), command(veiculo));

        mvc.perform(patch("/api/v1/agendamentos/{id}/confirmar", reserva.id()))
                .andExpect(status().isUnauthorized());
        mvc.perform(
                        patch("/api/v1/agendamentos/{id}/confirmar", reserva.id())
                                .header("Authorization", "Bearer cliente"))
                .andExpect(status().isForbidden());
        mvc.perform(
                        patch("/api/v1/agendamentos/{id}/cancelar", reserva.id())
                                .header("Authorization", "Bearer outro"))
                .andExpect(status().isNotFound());
        mvc.perform(
                        get("/api/v1/agendamentos/{id}", reserva.id())
                                .header("Authorization", "Bearer prestador")
                                .accept("application/hal+json"))
                .andExpect(jsonPath("$._links.confirmar").exists());

        agendamentos.confirmar(profissional.firebaseId(), reserva.id());

        mvc.perform(
                        patch("/api/v1/agendamentos/{id}/confirmar", reserva.id())
                                .header("Authorization", "Bearer prestador"))
                .andExpect(status().isConflict());
        mvc.perform(
                        patch("/api/v1/agendamentos/{id}/concluir", reserva.id())
                                .header("Authorization", "Bearer prestador"))
                .andExpect(status().is(422));

        agendamentos.cancelar(profissional.firebaseId(), reserva.id());

        assertEquals(
                profissional.id(),
                agendamentos.consultar(cliente.firebaseId(), reserva.id()).canceladoPor());

        mvc.perform(
                        patch("/api/v1/agendamentos/{id}/cancelar", reserva.id())
                                .header("Authorization", "Bearer cliente"))
                .andExpect(status().isConflict());
    }

    @Test
    void concluirPreservaHistoricoENaoPermiteCancelarAposInicio() throws Exception {
        var reserva = agendamentos.criar(cliente.firebaseId(), command(veiculo));
        agendamentos.confirmar(profissional.firebaseId(), reserva.id());
        var ontem = LocalDate.now(ZoneId.of("America/Sao_Paulo")).minusDays(1);

        // Simula a passagem do tempo sem adicionar configurações de relógio ao contexto inteiro.
        jdbc.update("update agendamento set data = ? where id = ?", ontem, reserva.id());
        jdbc.update("update horario_atendimento set data = ? where id = ?", ontem, horario.id());
        entityManager.clear();

        mvc.perform(
                        patch("/api/v1/agendamentos/{id}/cancelar", reserva.id())
                                .header("Authorization", "Bearer cliente"))
                .andExpect(status().is(422));
        mvc.perform(
                        get("/api/v1/agendamentos/{id}", reserva.id())
                                .header("Authorization", "Bearer prestador")
                                .accept("application/hal+json"))
                .andExpect(jsonPath("$._links.concluir").exists())
                .andExpect(jsonPath("$._links.cancelar").doesNotExist());
        mvc.perform(
                        patch("/api/v1/agendamentos/{id}/concluir", reserva.id())
                                .header("Authorization", "Bearer prestador"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONCLUIDO"))
                .andExpect(jsonPath("$.concluidoPor").value(profissional.id().toString()))
                .andExpect(jsonPath("$.confirmadoPor").value(profissional.id().toString()))
                .andExpect(jsonPath("$.concluidoEm").isNotEmpty());

        assertEquals(0, reservas.countByHorario_Id(horario.id()));

        mvc.perform(
                        patch("/api/v1/agendamentos/{id}/concluir", reserva.id())
                                .header("Authorization", "Bearer prestador"))
                .andExpect(status().isConflict());
    }

    @Test
    void ajusteDoIndicePreservaReservasExistentesEPodeRepetir() {
        var reserva = agendamentos.criar(cliente.firebaseId(), command(veiculo));

        jdbc.execute(
                "alter table agendamento add constraint uk_agendamento_veiculo_data_hora unique"
                    + " (veiculo_id, data, hora_inicio)");
        jdbc.execute("alter table agendamento drop constraint if exists agendamento_status_check");
        jdbc.execute(
                "alter table agendamento add constraint agendamento_status_check check (status in"
                    + " ('PENDENTE'))");
        indice.afterSingletonsInstantiated();
        indice.afterSingletonsInstantiated();

        assertEquals(reserva.id(), agendamentos.consultar(cliente.firebaseId(), reserva.id()).id());

        agendamentos.confirmar(profissional.firebaseId(), reserva.id());
        agendamentos.cancelar(cliente.firebaseId(), reserva.id());
        var nova = agendamentos.criar(cliente.firebaseId(), command(veiculo));

        assertNotEquals(reserva.id(), nova.id());
    }
}
