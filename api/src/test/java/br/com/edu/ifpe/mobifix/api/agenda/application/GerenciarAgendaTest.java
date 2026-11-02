package br.com.edu.ifpe.mobifix.api.agenda.application;

import java.time.*;
import java.util.*;
import br.com.edu.ifpe.mobifix.api.agenda.application.exception.*;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.domain.port.HorarioAtendimentoRepository;
import br.com.edu.ifpe.mobifix.api.prestador.application.ConsultarPerfilPrestadorAtual;
import br.com.edu.ifpe.mobifix.api.prestador.application.exception.CadastroPrestadorInvalidoException;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GerenciarAgendaTest {
    private final ConsultarPerfilPrestadorAtual perfil = mock(ConsultarPerfilPrestadorAtual.class);
    private final HorarioAtendimentoRepository horarios = mock(HorarioAtendimentoRepository.class);
    private final PrestadorAgendaConsulta prestadores = mock(PrestadorAgendaConsulta.class);
    private final Clock clock = Clock.fixed(Instant.parse("2030-01-01T15:00:00Z"), ZoneId.of("America/Sao_Paulo"));
    private final GerenciarAgenda agenda = new GerenciarAgenda(perfil, horarios, prestadores, clock);
    private final UUID prestadorId = UUID.randomUUID();
    private final UUID id = UUID.randomUUID();
    private void conta() {
        when(perfil.executar("mock")).thenReturn(new PerfilPrestador(prestadorId, UUID.randomUUID(), "Oficina", null,
                new Endereco("Rua A", "10", null, "Centro", "Recife", "PE", "50000000"), Set.of(1L), Set.of(1L)));
    }
    @Test
    void criaHorarioManualForaDoPadraoMensal() {
        conta();
        when(horarios.salvar(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var salvo = agenda.criar("mock", new CriarHorarioCommand(LocalDate.of(2030, 1, 6), LocalTime.of(22, 30), 3));
        assertEquals(DayOfWeek.SUNDAY, salvo.data().getDayOfWeek());
        assertEquals(prestadorId, salvo.prestadorId());
        assertEquals(LocalTime.of(22, 30), salvo.horaInicio());
        assertFalse(salvo.bloqueado());
    }
    @Test
    void rejeitaHorarioDuplicado() {
        conta();
        when(horarios.existe(prestadorId, LocalDate.of(2030, 1, 2), LocalTime.NOON)).thenReturn(true);
        assertThrows(HorarioDuplicadoException.class, () -> agenda.criar("mock", new CriarHorarioCommand(LocalDate.of(2030, 1, 2), LocalTime.NOON, 3)));
        verify(horarios, never()).salvar(any());
    }
    @ParameterizedTest
    @ValueSource(strings = {"2030-01-01T11:59", "2030-01-01T12:00", "2029-12-31T18:00"})
    void rejeitaPassadoEInstanteAtualNoFusoCorreto(String dataHora) {
        conta();
        LocalDateTime horario = LocalDateTime.parse(dataHora);
        assertThrows(RegraAgendaException.class, () -> agenda.criar("mock", new CriarHorarioCommand(horario.toLocalDate(), horario.toLocalTime(), 3)));
        verifyNoInteractions(horarios);
    }
    @Test
    void capacidadeZeroEPermitida() {
        conta();
        when(horarios.salvar(any())).thenAnswer(invocation -> invocation.getArgument(0));
        assertEquals(0, agenda.criar("mock", new CriarHorarioCommand(LocalDate.of(2030, 1, 2), LocalTime.NOON, 0)).capacidadeTotal());
    }
    @Test
    void capacidadeNegativaESegundosSaoRejeitados() {
        assertThrows(IllegalArgumentException.class, () -> new HorarioAtendimento(id, prestadorId, LocalDate.of(2030, 1, 2), LocalTime.NOON, -1, false));
        assertThrows(IllegalArgumentException.class, () -> new HorarioAtendimento(id, prestadorId, LocalDate.of(2030, 1, 2), LocalTime.of(12, 0, 1), 3, false));
    }
    @Test
    void edicaoPreservaDonoDataHoraEIdentificador() {
        conta();
        var atual = new HorarioAtendimento(id, prestadorId, LocalDate.of(2030, 1, 2), LocalTime.NOON, 3, false);
        when(horarios.buscarPorIdEPrestadorId(id, prestadorId)).thenReturn(Optional.of(atual));
        when(horarios.atualizar(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var salvo = agenda.atualizar("mock", id, new AtualizarHorarioCommand(5, true));
        assertEquals(atual.id(), salvo.id()); assertEquals(atual.prestadorId(), salvo.prestadorId());
        assertEquals(atual.data(), salvo.data()); assertEquals(atual.horaInicio(), salvo.horaInicio());
        assertEquals(5, salvo.capacidadeTotal()); assertTrue(salvo.bloqueado());
    }
    @Test
    void horarioDeOutraContaOuInexistenteRetornaMesmoErro() {
        conta();
        assertThrows(HorarioNaoEncontradoException.class, () -> agenda.atualizar("mock", id, new AtualizarHorarioCommand(3, false)));
        verify(horarios, never()).atualizar(any());
    }
    @Test
    void naoEditaHorarioPassado() {
        conta();
        when(horarios.buscarPorIdEPrestadorId(id, prestadorId)).thenReturn(Optional.of(new HorarioAtendimento(id, prestadorId, LocalDate.of(2029, 12, 31), LocalTime.NOON, 3, false)));
        assertThrows(RegraAgendaException.class, () -> agenda.atualizar("mock", id, new AtualizarHorarioCommand(3, true)));
        verify(horarios, never()).atualizar(any());
    }
    @Test
    void contaSemPermissaoNaoCriaHorario() {
        when(perfil.executar("mock")).thenThrow(new CadastroPrestadorInvalidoException("Conta inválida."));
        assertThrows(CadastroPrestadorInvalidoException.class, () -> agenda.criar("mock", new CriarHorarioCommand(LocalDate.of(2030, 1, 2), LocalTime.NOON, 3)));
        verifyNoInteractions(horarios);
    }
    @Test
    void listagemPropriaUsaPeriodoPadraoEIdentidade() {
        conta();
        agenda.listarMeus("mock", null, null);
        verify(horarios).listar(prestadorId, LocalDate.of(2030, 1, 1), LocalDate.of(2030, 1, 31));
    }
    @Test
    void consultaPublicaUsaInstanteDoFuso() {
        when(prestadores.estaDisponivel(prestadorId)).thenReturn(true);
        agenda.listarPublicos(prestadorId, null, null);
        verify(horarios).listarDisponiveis(prestadorId, LocalDate.of(2030, 1, 1), LocalDate.of(2030, 1, 31), LocalDateTime.of(2030, 1, 1, 12, 0));
        verifyNoInteractions(perfil);
    }
    @Test
    void prestadorIndisponivelRetorna404() {
        assertThrows(HorarioNaoEncontradoException.class, () -> agenda.listarPublicos(prestadorId, null, null));
        verifyNoInteractions(horarios);
    }
    @Test
    void periodoRejeitaInversaoEConsultaExcessiva() {
        LocalDate inicio = LocalDate.of(2030, 1, 1);
        assertThrows(IllegalArgumentException.class, () -> new PeriodoAgenda(inicio, inicio.minusDays(1)));
        assertThrows(IllegalArgumentException.class, () -> new PeriodoAgenda(inicio, inicio.plusDays(366)));
        assertDoesNotThrow(() -> new PeriodoAgenda(inicio, inicio.plusDays(365)));
    }
}
