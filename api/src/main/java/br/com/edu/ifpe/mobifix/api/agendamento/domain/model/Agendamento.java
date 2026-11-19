package br.com.edu.ifpe.mobifix.api.agendamento.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record Agendamento(
        UUID id,
        UUID clienteId,
        UUID prestadorId,
        UUID veiculoId,
        UUID horarioId,
        Long especialidadeId,
        LocalDate data,
        LocalTime horaInicio,
        StatusAgendamento status,
        Instant criadoEm,
        Instant confirmadoEm,
        UUID confirmadoPor,
        Instant canceladoEm,
        UUID canceladoPor,
        Instant concluidoEm,
        UUID concluidoPor,
        Instant remarcadoEm,
        UUID remarcadoPor) {
    public Agendamento {
        if (id == null
                || clienteId == null
                || prestadorId == null
                || veiculoId == null
                || horarioId == null
                || especialidadeId == null
                || especialidadeId <= 0
                || data == null
                || horaInicio == null
                || status == null
                || criadoEm == null) {
            throw new IllegalArgumentException(
                    "Os vínculos, data, horário, status e instante de criação são obrigatórios.");
        }
    }

    public Agendamento(
            UUID id,
            UUID clienteId,
            UUID prestadorId,
            UUID veiculoId,
            UUID horarioId,
            Long especialidadeId,
            LocalDate data,
            LocalTime horaInicio,
            StatusAgendamento status,
            Instant criadoEm) {
        this(
                id,
                clienteId,
                prestadorId,
                veiculoId,
                horarioId,
                especialidadeId,
                data,
                horaInicio,
                status,
                criadoEm,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
    }

    public Agendamento registrarStatus(
            StatusAgendamento novoStatus, UUID responsavel, Instant instante) {
        return new Agendamento(
                id,
                clienteId,
                prestadorId,
                veiculoId,
                horarioId,
                especialidadeId,
                data,
                horaInicio,
                novoStatus,
                criadoEm,
                novoStatus == StatusAgendamento.CONFIRMADO ? instante : confirmadoEm,
                novoStatus == StatusAgendamento.CONFIRMADO ? responsavel : confirmadoPor,
                novoStatus == StatusAgendamento.CANCELADO ? instante : canceladoEm,
                novoStatus == StatusAgendamento.CANCELADO ? responsavel : canceladoPor,
                novoStatus == StatusAgendamento.CONCLUIDO ? instante : concluidoEm,
                novoStatus == StatusAgendamento.CONCLUIDO ? responsavel : concluidoPor,
                remarcadoEm,
                remarcadoPor);
    }

    public Agendamento remarcar(
            UUID novoHorarioId,
            LocalDate novaData,
            LocalTime novaHora,
            UUID responsavel,
            Instant instante) {
        return new Agendamento(
                id,
                clienteId,
                prestadorId,
                veiculoId,
                novoHorarioId,
                especialidadeId,
                novaData,
                novaHora,
                status,
                criadoEm,
                confirmadoEm,
                confirmadoPor,
                canceladoEm,
                canceladoPor,
                concluidoEm,
                concluidoPor,
                instante,
                responsavel);
    }
}
