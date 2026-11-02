package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web.dto;
import java.time.LocalDate;
import java.time.LocalTime;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
public record CriarHorarioRequest(@NotNull LocalDate data, @NotNull LocalTime horaInicio, @NotNull @PositiveOrZero Integer capacidadeTotal) {
}
