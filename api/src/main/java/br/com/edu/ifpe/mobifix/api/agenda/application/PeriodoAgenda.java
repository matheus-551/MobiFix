package br.com.edu.ifpe.mobifix.api.agenda.application;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record PeriodoAgenda(LocalDate inicio, LocalDate fim) {
    public PeriodoAgenda {
        if (inicio == null || fim == null || fim.isBefore(inicio) || ChronoUnit.DAYS.between(inicio, fim) > 365) {
            throw new IllegalArgumentException("Informe um período válido de até 366 dias, incluindo início e fim.");
        }
    }
}
