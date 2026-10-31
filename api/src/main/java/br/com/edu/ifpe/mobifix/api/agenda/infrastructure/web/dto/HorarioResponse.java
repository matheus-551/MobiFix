package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web.dto;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
public record HorarioResponse(UUID id, UUID prestadorId, LocalDate data, LocalTime horaInicio, int capacidadeTotal, boolean bloqueado) {
}
