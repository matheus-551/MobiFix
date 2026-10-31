package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web.dto;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
public record HorarioDisponivelResponse(UUID id, LocalDate data, LocalTime horaInicio, int vagasDisponiveis) {
}
