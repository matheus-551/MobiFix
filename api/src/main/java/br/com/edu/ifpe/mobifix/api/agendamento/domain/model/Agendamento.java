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
        Instant criadoEm) {
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
}
