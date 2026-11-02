package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.event;

import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.application.geracao.*;
import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.scheduler.GeracaoAgendaAutomatica;
import br.com.edu.ifpe.mobifix.api.prestador.application.event.PerfilPrestadorCriado;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GeracaoAgendaGatilhosTest {
    private final GerarAgendaMensal geracao = mock(GerarAgendaMensal.class);
    @Test
    void inicializacaoETarefaUsamMesmoCasoDeUso() {
        when(geracao.executar()).thenReturn(new ResultadoGeracaoMensal(YearMonth.of(2030, 1), 0, 0, List.of()));
        var automatica = new GeracaoAgendaAutomatica(geracao);
        automatica.run(new DefaultApplicationArguments());
        automatica.executar();
        verify(geracao, times(2)).executar();
    }
    @Test
    void erroExternoNaoDerrubaInicializacao() {
        when(geracao.executar()).thenThrow(new IllegalStateException("Falha simulada."));
        assertDoesNotThrow(() -> new GeracaoAgendaAutomatica(geracao).run(new DefaultApplicationArguments()));
    }
    @Test
    void eventoDisparaGeracaoDoNovoPrestador() {
        UUID id = UUID.randomUUID();
        new AgendaNovoPrestadorListener(geracao).perfilCriado(new PerfilPrestadorCriado(id));
        verify(geracao).gerarParaPrestador(id);
    }
    @Test
    void falhaNaAgendaInicialNaoInvalidaPerfilConfirmado() {
        UUID id = UUID.randomUUID();
        when(geracao.gerarParaPrestador(id)).thenThrow(new IllegalStateException("Falha simulada."));
        assertDoesNotThrow(() -> new AgendaNovoPrestadorListener(geracao).perfilCriado(new PerfilPrestadorCriado(id)));
    }
}
