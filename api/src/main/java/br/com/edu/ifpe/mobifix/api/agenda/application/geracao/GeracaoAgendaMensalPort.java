package br.com.edu.ifpe.mobifix.api.agenda.application.geracao;

import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;

public interface GeracaoAgendaMensalPort {
    List<UUID> listarPrestadoresElegiveis();
    int inserirAusentes(UUID prestadorId, List<HorarioAtendimento> horarios);
}
