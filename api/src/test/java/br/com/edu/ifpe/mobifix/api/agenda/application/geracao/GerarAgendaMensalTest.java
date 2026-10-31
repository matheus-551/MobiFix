package br.com.edu.ifpe.mobifix.api.agenda.application.geracao;

import java.time.*;
import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.domain.service.PlanejarAgendaMensal;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class GerarAgendaMensalTest {
    private final GeracaoAgendaMensalPort port = mock(GeracaoAgendaMensalPort.class);
    // UTC ja esta em janeiro, mas Sao Paulo ainda esta em dezembro.
    private final Clock clock = Clock.fixed(Instant.parse("2030-01-01T01:00:00Z"), ZoneId.of("America/Sao_Paulo"));
    private final GerarAgendaMensal caso = new GerarAgendaMensal(port, new PlanejarAgendaMensal(), clock);
    @Test
    void calculaProximoMesNoFusoCorretoEViradaDeAno() {
        UUID id = UUID.randomUUID();
        when(port.listarPrestadoresElegiveis()).thenReturn(List.of(id));
        when(port.inserirAusentes(eq(id), anyList())).thenReturn(10);
        var resultado = caso.executar();
        assertEquals(YearMonth.of(2030, 1), resultado.mes());
        assertEquals(10, resultado.horariosCriados());
        assertTrue(resultado.falhas().isEmpty());
        @SuppressWarnings("unchecked") ArgumentCaptor<List<HorarioAtendimento>> captor = ArgumentCaptor.forClass(List.class);
        verify(port).inserirAusentes(eq(id), captor.capture());
        assertTrue(captor.getValue().stream().allMatch(h -> YearMonth.from(h.data()).equals(YearMonth.of(2030, 1))));
    }
    @Test
    void falhaDeUmPrestadorNaoInterrompeOsDemais() {
        UUID falha = UUID.randomUUID(), sucesso = UUID.randomUUID();
        when(port.listarPrestadoresElegiveis()).thenReturn(List.of(falha, sucesso));
        when(port.inserirAusentes(eq(falha), anyList())).thenThrow(new IllegalStateException("Banco indisponível."));
        when(port.inserirAusentes(eq(sucesso), anyList())).thenReturn(242);
        var resultado = caso.executar();
        assertEquals(2, resultado.prestadoresProcessados());
        assertEquals(242, resultado.horariosCriados());
        assertEquals(falha, resultado.falhas().getFirst().prestadorId());
        verify(port).inserirAusentes(eq(sucesso), anyList());
    }
    @Test
    void semPrestadoresNaoExecutaGravacoes() {
        when(port.listarPrestadoresElegiveis()).thenReturn(List.of());
        assertEquals(0, caso.executar().horariosCriados());
        verify(port, never()).inserirAusentes(any(), anyList());
    }
    @Test
    void cadastroGeraApenasParaPrestadorInformado() {
        UUID id = UUID.randomUUID();
        caso.gerarParaPrestador(id);
        verify(port).inserirAusentes(eq(id), anyList());
        verify(port, never()).listarPrestadoresElegiveis();
    }
}
