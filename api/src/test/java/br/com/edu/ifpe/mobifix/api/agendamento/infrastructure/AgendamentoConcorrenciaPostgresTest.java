package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure;

import static org.junit.jupiter.api.Assertions.*;

import br.com.edu.ifpe.mobifix.api.agenda.application.AtualizarHorarioCommand;
import br.com.edu.ifpe.mobifix.api.agenda.application.CriarHorarioCommand;
import br.com.edu.ifpe.mobifix.api.agenda.application.GerenciarAgenda;
import br.com.edu.ifpe.mobifix.api.agenda.application.exception.RegraAgendaException;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.domain.port.HorarioAtendimentoRepository;
import br.com.edu.ifpe.mobifix.api.agendamento.application.Agendamentos;
import br.com.edu.ifpe.mobifix.api.agendamento.application.CriarAgendamentoCommand;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.ConflitoAgendamentoException;
import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.persistence.repository.AgendamentoJpaRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.EspecialidadeRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.Endereco;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.PerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.port.VeiculoRepository;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/** Sem @Transactional no teste: cada thread utiliza uma transação real e independente. */
@EnabledIfSystemProperty(named = "mobifix.test.postgres", matches = "true")
@SpringBootTest
class AgendamentoConcorrenciaPostgresTest {

    @Autowired Agendamentos agendamentos;
    @Autowired AgendamentoJpaRepository reservas;
    @Autowired GerenciarAgenda agenda;
    @Autowired UsuarioRepository usuarios;
    @Autowired VeiculoRepository veiculos;
    @Autowired PerfilPrestadorRepository perfis;
    @Autowired HorarioAtendimentoRepository horarios;
    @Autowired TipoVeiculoRepository tipos;
    @Autowired EspecialidadeRepository especialidades;
    @Autowired JdbcTemplate jdbc;

    private final List<UUID> contasCriadas = new ArrayList<>();

    private final List<UUID> perfisCriados = new ArrayList<>();

    private Long tipo;

    private Long especialidade;

    private LocalDate dia;

    @BeforeEach
    void preparar() {
        tipo = tipos.listarTodos().getFirst().id();
        especialidade = especialidades.listarTodos().getFirst().id();
        dia = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(2);
    }

    private Usuario conta(TipoUsuario tipo) {
        String uid = UUID.randomUUID().toString();
        var u =
                usuarios.salvar(
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
        contasCriadas.add(u.id());

        return u;
    }

    private Usuario prestador() {
        var u = conta(TipoUsuario.PRESTADOR);
        var p =
                perfis.salvar(
                        new PerfilPrestador(
                                UUID.randomUUID(),
                                u.id(),
                                "Oficina",
                                null,
                                new Endereco(
                                        "Rua A", "10", null, "Centro", "Recife", "PE", "50000000"),
                                Set.of(tipo),
                                Set.of(especialidade)));
        perfisCriados.add(p.id());

        return u;
    }

    private Veiculo carro(Usuario u) {
        return veiculos.salvar(
                new Veiculo(UUID.randomUUID(), u.id(), tipo, "Fiat", "Uno", 2020, null));
    }

    private HorarioAtendimento horario(Usuario p, int vagas) {
        return agenda.criar(p.firebaseId(), new CriarHorarioCommand(dia, LocalTime.NOON, vagas));
    }

    private CriarAgendamentoCommand command(Veiculo v, HorarioAtendimento h) {
        return new CriarAgendamentoCommand(v.id(), h.id(), especialidade);
    }

    private List<String> simultaneos(List<Supplier<String>> operacoes) throws Exception {
        var preparados = new CountDownLatch(operacoes.size());
        var inicio = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(operacoes.size())) {
            var futuros = new ArrayList<Future<String>>();
            for (var operacao : operacoes)
                futuros.add(
                        executor.submit(() -> {
                            preparados.countDown();
                            if (!inicio.await(10, TimeUnit.SECONDS)) {
                                throw new IllegalStateException("Barreira não liberada.");
                            }
                            return operacao.get();
                        }));
            assertTrue(preparados.await(10, TimeUnit.SECONDS));
            inicio.countDown();
            var resultados = new ArrayList<String>();
            for (var futuro : futuros) resultados.add(futuro.get(30, TimeUnit.SECONDS));
            return resultados;
        } finally {
            inicio.countDown();
        }
    }

    private String reservar(Usuario cliente, Veiculo v, HorarioAtendimento h) {
        try {
            agendamentos.criar(cliente.firebaseId(), command(v, h));
            return "reservado";
        } catch (ConflitoAgendamentoException e) {
            return "conflito";
        }
    }

    @Test
    void seisRequisicoesNaoUltrapassamTresVagas() throws Exception {
        var prestador = prestador();
        var h = horario(prestador, 3);
        var operacoes = new ArrayList<Supplier<String>>();
        for (int i = 0; i < 6; i++) {
            var cliente = conta(TipoUsuario.CLIENTE);
            var v = carro(cliente);
            operacoes.add(() -> reservar(cliente, v, h));
        }

        var resultados = simultaneos(operacoes);
        assertEquals(3, Collections.frequency(resultados, "reservado"));
        assertEquals(3, Collections.frequency(resultados, "conflito"));
        assertEquals(3, reservas.countByHorario_Id(h.id()));
        assertTrue(agenda.listarPublicos(h.prestadorId(), dia, dia).isEmpty());
    }

    @Test
    void mesmoVeiculoEmDoisPrestadoresConcorrentesReservaApenasUmaVez() throws Exception {
        var primeiro = horario(prestador(), 3);
        var segundo = horario(prestador(), 3);
        var cliente = conta(TipoUsuario.CLIENTE);
        var v = carro(cliente);
        var resultados =
                simultaneos(
                        List.of(
                                () -> reservar(cliente, v, primeiro),
                                () -> reservar(cliente, v, segundo)));
        assertEquals(1, Collections.frequency(resultados, "reservado"));
        assertEquals(1, Collections.frequency(resultados, "conflito"));
        assertEquals(
                1,
                reservas.countByHorario_Id(primeiro.id())
                        + reservas.countByHorario_Id(segundo.id()));
    }

    @Test
    void reduzirCapacidadeConcorrenteNaoCriaSaldoNegativo() throws Exception {
        var prestador = prestador();
        var h = horario(prestador, 1);
        var cliente = conta(TipoUsuario.CLIENTE);
        var v = carro(cliente);
        var resultados =
                simultaneos(
                        List.of(
                                () -> reservar(cliente, v, h),
                                () -> {
                                    try {
                                        agenda.atualizar(
                                                prestador.firebaseId(),
                                                h.id(),
                                                new AtualizarHorarioCommand(0, false));
                                        return "reduzido";
                                    } catch (RegraAgendaException e) {
                                        return "capacidade-preservada";
                                    }
                                }));
        long ocupadas = reservas.countByHorario_Id(h.id());
        int capacidade =
                horarios.buscarPorIdEPrestadorId(h.id(), h.prestadorId())
                        .orElseThrow()
                        .capacidadeTotal();
        assertTrue(ocupadas <= capacidade);
        assertTrue(
                resultados.contains("reservado")
                        ? resultados.contains("capacidade-preservada")
                        : resultados.contains("reduzido"));
    }

    @Test
    void confirmarECancelarSimultaneamenteNaoRestauraReservaCancelada() throws Exception {
        var profissional = prestador();
        var horario = horario(profissional, 1);
        var cliente = conta(TipoUsuario.CLIENTE);
        var veiculo = carro(cliente);
        var reserva = agendamentos.criar(cliente.firebaseId(), command(veiculo, horario));

        simultaneos(
                List.of(
                        () -> {
                            agendamentos.cancelar(cliente.firebaseId(), reserva.id());
                            return "cancelado";
                        },
                        () -> {
                            try {
                                agendamentos.confirmar(profissional.firebaseId(), reserva.id());
                                return "confirmado";
                            } catch (ConflitoAgendamentoException exception) {
                                return "conflito";
                            }
                        }));

        var atual = agendamentos.consultar(cliente.firebaseId(), reserva.id());

        assertEquals("CANCELADO", atual.status().name());
        assertEquals(cliente.id(), atual.canceladoPor());
        assertEquals(0, reservas.countByHorario_Id(horario.id()));
    }

    @Test
    void cancelamentoConcorrenteComNovaReservaNaoDuplicaVagaDoVeiculo() throws Exception {
        var profissional = prestador();
        var horario = horario(profissional, 1);
        var cliente = conta(TipoUsuario.CLIENTE);
        var veiculo = carro(cliente);
        var anterior = agendamentos.criar(cliente.firebaseId(), command(veiculo, horario));

        var resultados =
                simultaneos(
                        List.of(
                                () -> {
                                    agendamentos.cancelar(cliente.firebaseId(), anterior.id());
                                    return "cancelado";
                                },
                                () -> reservar(cliente, veiculo, horario)));

        if (resultados.contains("conflito")) {
            agendamentos.criar(cliente.firebaseId(), command(veiculo, horario));
        }

        assertEquals(1, reservas.countByHorario_Id(horario.id()));
        assertEquals(2, agendamentos.listarMeus(cliente.firebaseId(), 0, 20).totalElements());
        assertEquals(
                "CANCELADO",
                agendamentos.consultar(cliente.firebaseId(), anterior.id()).status().name());
    }

    @AfterEach
    void limparSomenteDadosDesteTeste() {
        for (UUID id : contasCriadas)
            jdbc.update("delete from agendamento where cliente_id = ?", id);
        for (UUID id : contasCriadas) jdbc.update("delete from veiculo where cliente_id = ?", id);
        for (UUID id : perfisCriados) {
            jdbc.update("delete from horario_atendimento where prestador_id = ?", id);
            jdbc.update("delete from prestador_especialidade where prestador_id = ?", id);
            jdbc.update("delete from prestador_tipo_veiculo where prestador_id = ?", id);
            jdbc.update("delete from perfil_prestador where id = ?", id);
        }
        for (UUID id : contasCriadas) jdbc.update("delete from usuario where id = ?", id);
    }

    private String remarcar(Usuario cliente, UUID reservaId, HorarioAtendimento destino) {
        try {
            agendamentos.remarcar(cliente.firebaseId(), reservaId, destino.id());
            return "remarcado";
        } catch (ConflitoAgendamentoException exception) {
            return "conflito";
        }
    }

    @Test
    void duasRemarcacoesDisputamUltimaVagaSemPerderAReservaRecusada() throws Exception {
        var profissional = prestador();
        var origem = horario(profissional, 2);
        var destino =
                agenda.criar(
                        profissional.firebaseId(),
                        new CriarHorarioCommand(dia, LocalTime.of(14, 0), 1));
        var primeiro = conta(TipoUsuario.CLIENTE);
        var segundo = conta(TipoUsuario.CLIENTE);
        var primeiraReserva =
                agendamentos.criar(primeiro.firebaseId(), command(carro(primeiro), origem));
        var segundaReserva =
                agendamentos.criar(segundo.firebaseId(), command(carro(segundo), origem));

        var resultados =
                simultaneos(
                        List.of(
                                () -> remarcar(primeiro, primeiraReserva.id(), destino),
                                () -> remarcar(segundo, segundaReserva.id(), destino)));

        assertEquals(1, Collections.frequency(resultados, "remarcado"));
        assertEquals(1, Collections.frequency(resultados, "conflito"));
        assertEquals(1, reservas.countByHorario_Id(origem.id()));
        assertEquals(1, reservas.countByHorario_Id(destino.id()));
        assertNotEquals(
                agendamentos.consultar(primeiro.firebaseId(), primeiraReserva.id()).horarioId(),
                agendamentos.consultar(segundo.firebaseId(), segundaReserva.id()).horarioId());
    }

    @Test
    void remarcacoesEmSentidosOpostosNaoEntramEmImpasse() throws Exception {
        var profissional = prestador();
        var primeiroHorario = horario(profissional, 2);
        var segundoHorario =
                agenda.criar(
                        profissional.firebaseId(),
                        new CriarHorarioCommand(dia, LocalTime.of(14, 0), 2));
        var primeiro = conta(TipoUsuario.CLIENTE);
        var segundo = conta(TipoUsuario.CLIENTE);
        var primeiraReserva =
                agendamentos.criar(
                        primeiro.firebaseId(), command(carro(primeiro), primeiroHorario));
        var segundaReserva =
                agendamentos.criar(segundo.firebaseId(), command(carro(segundo), segundoHorario));

        var resultados =
                simultaneos(
                        List.of(
                                () -> remarcar(primeiro, primeiraReserva.id(), segundoHorario),
                                () -> remarcar(segundo, segundaReserva.id(), primeiroHorario)));

        assertEquals(List.of("remarcado", "remarcado"), resultados);
        assertEquals(
                segundoHorario.id(),
                agendamentos.consultar(primeiro.firebaseId(), primeiraReserva.id()).horarioId());
        assertEquals(
                primeiroHorario.id(),
                agendamentos.consultar(segundo.firebaseId(), segundaReserva.id()).horarioId());
        assertEquals(1, reservas.countByHorario_Id(primeiroHorario.id()));
        assertEquals(1, reservas.countByHorario_Id(segundoHorario.id()));
    }

    @Test
    void confirmarDuranteRemarcacaoPreservaHorarioEAuditoriaAtuais() throws Exception {
        var profissional = prestador();
        var origem = horario(profissional, 1);
        var destino =
                agenda.criar(
                        profissional.firebaseId(),
                        new CriarHorarioCommand(dia, LocalTime.of(14, 0), 1));
        var cliente = conta(TipoUsuario.CLIENTE);
        var reserva = agendamentos.criar(cliente.firebaseId(), command(carro(cliente), origem));

        var resultados =
                simultaneos(
                        List.of(
                                () -> remarcar(cliente, reserva.id(), destino),
                                () -> {
                                    agendamentos.confirmar(profissional.firebaseId(), reserva.id());
                                    return "confirmado";
                                }));

        var atual = agendamentos.consultar(cliente.firebaseId(), reserva.id());
        assertEquals("CONFIRMADO", atual.status().name());
        assertEquals(profissional.id(), atual.confirmadoPor());
        assertEquals(
                resultados.contains("remarcado") ? destino.id() : origem.id(), atual.horarioId());
        assertEquals(1, reservas.countByHorario_Id(atual.horarioId()));
        assertEquals(
                1,
                reservas.countByHorario_Id(origem.id()) + reservas.countByHorario_Id(destino.id()));
        if (resultados.contains("remarcado")) {
            assertEquals(cliente.id(), atual.remarcadoPor());
            assertNotNull(atual.remarcadoEm());
        }
    }

    @Test
    void cancelarDuranteRemarcacaoNaoRestauraReservaNemOcupaVaga() throws Exception {
        var profissional = prestador();
        var origem = horario(profissional, 1);
        var destino =
                agenda.criar(
                        profissional.firebaseId(),
                        new CriarHorarioCommand(dia, LocalTime.of(14, 0), 1));
        var cliente = conta(TipoUsuario.CLIENTE);
        var reserva = agendamentos.criar(cliente.firebaseId(), command(carro(cliente), origem));

        simultaneos(
                List.of(
                        () -> remarcar(cliente, reserva.id(), destino),
                        () -> {
                            agendamentos.cancelar(profissional.firebaseId(), reserva.id());
                            return "cancelado";
                        }));

        var atual = agendamentos.consultar(cliente.firebaseId(), reserva.id());
        assertEquals("CANCELADO", atual.status().name());
        assertEquals(profissional.id(), atual.canceladoPor());
        assertEquals(0, reservas.countByHorario_Id(origem.id()));
        assertEquals(0, reservas.countByHorario_Id(destino.id()));
    }
}
