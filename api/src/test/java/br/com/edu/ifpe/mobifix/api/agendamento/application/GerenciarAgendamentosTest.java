package br.com.edu.ifpe.mobifix.api.agendamento.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.RegraAgendamentoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.port.ContextoAgendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.port.AgendamentoRepository;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

class GerenciarAgendamentosTest {

    private final ContextoAgendamento contexto = mock(ContextoAgendamento.class);

    private final AgendamentoRepository repository = mock(AgendamentoRepository.class);

    private final Clock clock =
            Clock.fixed(Instant.parse("2030-01-01T15:00:00Z"), ZoneId.of("America/Sao_Paulo"));

    private final GerenciarAgendamentos regras =
            new GerenciarAgendamentos(contexto, repository, clock);

    private final UUID clienteId = UUID.randomUUID();

    private final UUID prestadorId = UUID.randomUUID();

    private final UUID veiculoId = UUID.randomUUID();

    private final UUID horarioId = UUID.randomUUID();

    private final CriarAgendamentoCommand command =
            new CriarAgendamentoCommand(veiculoId, horarioId, 1L);

    private Usuario usuario(TipoUsuario tipo, boolean ativo) {
        return new Usuario(
                clienteId,
                "uid-real",
                "Ana",
                "Silva",
                "ana@example.com",
                "81999999999",
                "PE",
                tipo,
                ativo);
    }

    private HorarioAtendimento horario(
            LocalDate data, LocalTime hora, int capacidade, boolean bloqueado) {
        return new HorarioAtendimento(horarioId, prestadorId, data, hora, capacidade, bloqueado);
    }

    @BeforeEach
    void preparar() {
        when(contexto.clienteParaReserva("uid-real"))
                .thenReturn(usuario(TipoUsuario.CLIENTE, true));
        when(contexto.veiculoParaReserva(veiculoId, clienteId))
                .thenReturn(
                        Optional.of(
                                new Veiculo(veiculoId, clienteId, 1L, "Fiat", "Uno", 2020, null)));
        when(contexto.horarioParaReserva(horarioId))
                .thenReturn(
                        Optional.of(horario(LocalDate.of(2030, 1, 2), LocalTime.NOON, 3, false)));
        when(contexto.consultarPrestador(prestadorId))
                .thenReturn(
                        new ContextoAgendamento.Prestador(
                                true, TipoUsuario.PRESTADOR, Set.of(1L), Set.of(1L)));
    }

    @ParameterizedTest
    @CsvSource({"2030-01-01,11:59", "2030-01-01,12:00", "2029-12-31,18:00"})
    void passadoOuInstanteAtualNaoReserva(LocalDate data, LocalTime hora) {
        when(contexto.horarioParaReserva(horarioId))
                .thenReturn(Optional.of(horario(data, hora, 3, false)));
        assertThrows(RegraAgendamentoException.class, () -> regras.criar("uid-real", command));
    }

    @Test
    void bloqueadoNaoReserva() {
        when(contexto.horarioParaReserva(horarioId))
                .thenReturn(
                        Optional.of(horario(LocalDate.of(2030, 1, 2), LocalTime.NOON, 3, true)));
        assertThrows(RegraAgendamentoException.class, () -> regras.criar("uid-real", command));
    }

    @Test
    void prestadorInativoNaoReserva() {
        when(contexto.consultarPrestador(prestadorId))
                .thenReturn(
                        new ContextoAgendamento.Prestador(
                                false, TipoUsuario.PRESTADOR, Set.of(1L), Set.of(1L)));
        assertThrows(RegraAgendamentoException.class, () -> regras.criar("uid-real", command));
    }

    @Test
    void tipoDeVeiculoIncompativelNaoReserva() {
        when(contexto.consultarPrestador(prestadorId))
                .thenReturn(
                        new ContextoAgendamento.Prestador(
                                true, TipoUsuario.PRESTADOR, Set.of(2L), Set.of(1L)));
        assertThrows(RegraAgendamentoException.class, () -> regras.criar("uid-real", command));
    }
}
