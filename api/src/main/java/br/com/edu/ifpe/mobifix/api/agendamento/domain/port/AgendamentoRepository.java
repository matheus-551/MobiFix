package br.com.edu.ifpe.mobifix.api.agendamento.domain.port;

import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.Agendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.PaginaAgendamentos;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

public interface AgendamentoRepository {

    long contarReservas(UUID horarioId);

    boolean veiculoReservado(UUID veiculoId, LocalDate data, LocalTime hora);

    Agendamento salvar(Agendamento agendamento);

    Optional<Agendamento> buscarDoUsuario(UUID id, UUID usuarioId);

    PaginaAgendamentos listarDoUsuario(UUID usuarioId, int page, int size);
}
