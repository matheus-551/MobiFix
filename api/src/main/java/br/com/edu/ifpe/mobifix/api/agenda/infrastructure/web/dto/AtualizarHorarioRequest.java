package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web.dto;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
public record AtualizarHorarioRequest(@NotNull @PositiveOrZero Integer capacidadeTotal, @NotNull Boolean bloqueado) {
}
