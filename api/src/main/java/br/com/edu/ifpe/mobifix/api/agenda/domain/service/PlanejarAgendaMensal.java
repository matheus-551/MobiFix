package br.com.edu.ifpe.mobifix.api.agenda.domain.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;

public class PlanejarAgendaMensal {
    public List<HorarioAtendimento> planejar(UUID prestadorId, YearMonth mes) {
        if (prestadorId == null || mes == null) throw new IllegalArgumentException("Prestador e mês são obrigatórios.");
        List<HorarioAtendimento> horarios = new ArrayList<>();
        for (LocalDate data = mes.atDay(1); !data.isAfter(mes.atEndOfMonth()); data = data.plusDays(1)) {
            if (data.getDayOfWeek() == DayOfWeek.SATURDAY || data.getDayOfWeek() == DayOfWeek.SUNDAY) continue;
            for (int hora = 8; hora <= 18; hora++) {
                horarios.add(new HorarioAtendimento(UUID.randomUUID(), prestadorId, data, LocalTime.of(hora, 0), 3, false));
            }
        }
        return List.copyOf(horarios);
    }
}
