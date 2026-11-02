package br.com.edu.ifpe.mobifix.api.agenda.domain.service;

import java.time.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

class PlanejarAgendaMensalTest {
    private final PlanejarAgendaMensal planejador = new PlanejarAgendaMensal();
    @ParameterizedTest
    @ValueSource(strings = {"2024-02", "2025-02", "2026-11", "2026-12", "2027-01", "2028-02"})
    void planejaSomenteDiasUteisComOnzeHorariosETresVagas(String valor) {
        YearMonth mes = YearMonth.parse(valor);
        UUID prestadorId = UUID.randomUUID();
        var horarios = planejador.planejar(prestadorId, mes);
        long diasUteis = mes.atDay(1).datesUntil(mes.plusMonths(1).atDay(1))
                .filter(data -> data.getDayOfWeek() != DayOfWeek.SATURDAY && data.getDayOfWeek() != DayOfWeek.SUNDAY).count();
        assertEquals(diasUteis * 11, horarios.size());
        assertEquals(horarios.size(), horarios.stream().map(h -> h.data() + "T" + h.horaInicio()).distinct().count());
        assertEquals(horarios.size(), horarios.stream().map(h -> h.id()).distinct().count());
        for (var horario : horarios) {
            assertEquals(prestadorId, horario.prestadorId());
            assertEquals(mes, YearMonth.from(horario.data()));
            assertNotEquals(DayOfWeek.SATURDAY, horario.data().getDayOfWeek());
            assertNotEquals(DayOfWeek.SUNDAY, horario.data().getDayOfWeek());
            assertTrue(horario.horaInicio().getHour() >= 8 && horario.horaInicio().getHour() <= 18);
            assertEquals(0, horario.horaInicio().getMinute());
            assertEquals(3, horario.capacidadeTotal());
            assertFalse(horario.bloqueado());
        }
        assertEquals(diasUteis, horarios.stream().filter(h -> h.horaInicio().equals(LocalTime.of(18, 0))).count());
    }
    @Test
    void incluiFeriadoQueCaiEmDiaUtil() {
        var horarios = planejador.planejar(UUID.randomUUID(), YearMonth.of(2027, 1));
        assertEquals(11, horarios.stream().filter(h -> h.data().equals(LocalDate.of(2027, 1, 1))).count());
    }
    @Test
    void incluiDiaBissextoQuandoUtil() {
        assertEquals(11, planejador.planejar(UUID.randomUUID(), YearMonth.of(2024, 2)).stream()
                .filter(h -> h.data().equals(LocalDate.of(2024, 2, 29))).count());
    }
}
