package br.com.edu.ifpe.mobifix.api.agenda.domain.model;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record HorarioDisponivel(
        UUID id, LocalDate data, LocalTime horaInicio, long vagasDisponiveis) {}
