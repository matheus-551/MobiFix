package br.com.edu.ifpe.mobifix.api.agendamento.application;

import java.util.UUID;

public record CriarAgendamentoCommand(UUID veiculoId, UUID horarioId, Long especialidadeId) {
    public CriarAgendamentoCommand {
        if (veiculoId == null
                || horarioId == null
                || especialidadeId == null
                || especialidadeId <= 0) {
            throw new IllegalArgumentException("Informe veículo, horário e especialidade válidos.");
        }
    }
}
