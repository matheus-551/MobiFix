package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web.dto;

import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.Agendamento;

import org.springframework.hateoas.server.core.Relation;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Relation(value = "agendamento", collectionRelation = "agendamentos")
public record AgendamentoResponse(
        UUID id,
        UUID clienteId,
        UUID prestadorId,
        UUID veiculoId,
        UUID horarioId,
        Long especialidadeId,
        LocalDate data,
        LocalTime horaInicio,
        String status,
        Instant criadoEm,
        Instant confirmadoEm,
        UUID confirmadoPor,
        Instant canceladoEm,
        UUID canceladoPor,
        Instant concluidoEm,
        UUID concluidoPor) {
    public static AgendamentoResponse de(Agendamento agendamento) {
        return new AgendamentoResponse(
                agendamento.id(),
                agendamento.clienteId(),
                agendamento.prestadorId(),
                agendamento.veiculoId(),
                agendamento.horarioId(),
                agendamento.especialidadeId(),
                agendamento.data(),
                agendamento.horaInicio(),
                agendamento.status().name(),
                agendamento.criadoEm(),
                agendamento.confirmadoEm(),
                agendamento.confirmadoPor(),
                agendamento.canceladoEm(),
                agendamento.canceladoPor(),
                agendamento.concluidoEm(),
                agendamento.concluidoPor());
    }
}
