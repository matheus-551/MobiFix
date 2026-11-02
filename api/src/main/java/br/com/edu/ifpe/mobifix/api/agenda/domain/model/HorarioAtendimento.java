package br.com.edu.ifpe.mobifix.api.agenda.domain.model;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record HorarioAtendimento(UUID id, UUID prestadorId, LocalDate data, LocalTime horaInicio,
                                 int capacidadeTotal, boolean bloqueado) {
    public HorarioAtendimento {
        if (id == null || prestadorId == null || data == null || horaInicio == null) {
            throw new IllegalArgumentException("Identificadores, data e hora são obrigatórios.");
        }
        if (horaInicio.getSecond() != 0 || horaInicio.getNano() != 0) {
            throw new IllegalArgumentException("Informe o horário com precisão de minutos, sem segundos.");
        }
        if (capacidadeTotal < 0) throw new IllegalArgumentException("A capacidade não pode ser negativa.");
    }
}
