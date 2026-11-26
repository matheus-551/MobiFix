package br.com.edu.ifpe.mobifix.api.agendamento.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.ConflitoAgendamentoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.RegraAgendamentoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.port.ContextoAgendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.Agendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.StatusAgendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.port.AgendamentoRepository;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

class CicloAgendamentosTest {

    private final ContextoAgendamento contexto = mock(ContextoAgendamento.class);

    private final AgendamentoRepository repository = mock(AgendamentoRepository.class);

    private final Clock clock =
            Clock.fixed(Instant.parse("2030-01-01T15:00:00Z"), ZoneId.of("America/Sao_Paulo"));

    private final GerenciarAgendamentos regras =
            new GerenciarAgendamentos(contexto, repository, clock);

    private Agendamento preparar(StatusAgendamento status) {
        var usuario =
                new Usuario(
                        UUID.randomUUID(),
                        "uid",
                        "Ana",
                        "Silva",
                        "ana@example.com",
                        "81999999999",
                        "PE",
                        TipoUsuario.PRESTADOR,
                        true);
        var reserva =
                new Agendamento(
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        1L,
                        LocalDate.of(2030, 1, 1),
                        LocalTime.NOON,
                        status,
                        clock.instant().minusSeconds(3600));

        when(contexto.usuarioAtual("uid")).thenReturn(usuario);
        when(repository.buscarDoUsuario(reserva.id(), usuario.id()))
                .thenReturn(Optional.of(reserva));
        when(repository.bloquear(reserva.id())).thenReturn(Optional.of(reserva));
        when(contexto.horarioParaReserva(reserva.horarioId()))
                .thenReturn(
                        Optional.of(
                                new HorarioAtendimento(
                                        reserva.horarioId(),
                                        reserva.prestadorId(),
                                        reserva.data(),
                                        reserva.horaInicio(),
                                        3,
                                        false)));
        when(repository.atualizar(any())).thenAnswer(invocation -> invocation.getArgument(0));

        return reserva;
    }

    @Test
    void noInstanteInicialSomenteConclusaoEPermitida() {
        var reserva = preparar(StatusAgendamento.CONFIRMADO);

        assertThrows(RegraAgendamentoException.class, () -> regras.cancelar("uid", reserva.id()));
        assertEquals(StatusAgendamento.CONCLUIDO, regras.concluir("uid", reserva.id()).status());

        var pendente = preparar(StatusAgendamento.PENDENTE);

        assertThrows(RegraAgendamentoException.class, () -> regras.confirmar("uid", pendente.id()));
    }

    @Test
    void pendenteNaoConcluiEEstadosTerminaisNaoReabrem() {
        var pendente = preparar(StatusAgendamento.PENDENTE);

        assertThrows(
                ConflitoAgendamentoException.class, () -> regras.concluir("uid", pendente.id()));

        var cancelado = preparar(StatusAgendamento.CANCELADO);

        assertThrows(
                ConflitoAgendamentoException.class, () -> regras.confirmar("uid", cancelado.id()));

        var concluido = preparar(StatusAgendamento.CONCLUIDO);

        assertThrows(
                ConflitoAgendamentoException.class, () -> regras.cancelar("uid", concluido.id()));
    }
}
