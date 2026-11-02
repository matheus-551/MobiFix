package br.com.edu.ifpe.mobifix.api.agenda.application;
import java.time.LocalDate;
import java.time.LocalTime;
public record CriarHorarioCommand(LocalDate data, LocalTime horaInicio, int capacidadeTotal) {
}
