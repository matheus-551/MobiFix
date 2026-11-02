package br.com.edu.ifpe.mobifix.api.agenda.application.geracao;

import java.time.Clock;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.domain.service.PlanejarAgendaMensal;

public class GerarAgendaMensal {
    private final GeracaoAgendaMensalPort port;
    private final PlanejarAgendaMensal planejador;
    private final Clock clock;
    public GerarAgendaMensal(GeracaoAgendaMensalPort port, PlanejarAgendaMensal planejador, Clock clock) {
        this.port = port; this.planejador = planejador; this.clock = clock;
    }
    public ResultadoGeracaoMensal executar() {
        YearMonth mes = YearMonth.now(clock).plusMonths(1);
        var prestadores = port.listarPrestadoresElegiveis();
        var falhas = new ArrayList<ResultadoGeracaoMensal.Falha>();
        int criados = 0;
        for (UUID prestadorId : prestadores) {
            try {
                criados += gerar(prestadorId, mes);
            } catch (RuntimeException exception) {
                // Cada prestador e processado em sua propria transacao pelo adaptador.
                falhas.add(new ResultadoGeracaoMensal.Falha(prestadorId, exception.getMessage()));
            }
        }
        return new ResultadoGeracaoMensal(mes, prestadores.size(), criados, falhas);
    }
    public int gerarParaPrestador(UUID prestadorId) {
        return gerar(prestadorId, YearMonth.now(clock).plusMonths(1));
    }
    private int gerar(UUID prestadorId, YearMonth mes) {
        return port.inserirAusentes(prestadorId, planejador.planejar(prestadorId, mes));
    }
}
