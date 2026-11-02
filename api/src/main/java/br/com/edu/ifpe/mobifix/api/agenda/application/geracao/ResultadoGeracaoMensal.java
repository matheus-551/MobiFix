package br.com.edu.ifpe.mobifix.api.agenda.application.geracao;

import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

public record ResultadoGeracaoMensal(YearMonth mes, int prestadoresProcessados, int horariosCriados, List<Falha> falhas) {
    public ResultadoGeracaoMensal { falhas = List.copyOf(falhas); }
    public record Falha(UUID prestadorId, String motivo) {
    }
}
