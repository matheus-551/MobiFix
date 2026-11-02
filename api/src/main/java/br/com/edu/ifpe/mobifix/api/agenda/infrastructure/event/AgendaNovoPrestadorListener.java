package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.event;

import br.com.edu.ifpe.mobifix.api.agenda.application.geracao.GerarAgendaMensal;
import br.com.edu.ifpe.mobifix.api.prestador.application.event.PerfilPrestadorCriado;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class AgendaNovoPrestadorListener {
    private static final Logger log = LoggerFactory.getLogger(AgendaNovoPrestadorListener.class);
    private final GerarAgendaMensal geracao;
    public AgendaNovoPrestadorListener(GerarAgendaMensal geracao) { this.geracao = geracao; }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void perfilCriado(PerfilPrestadorCriado evento) {
        try {
            int criados = geracao.gerarParaPrestador(evento.prestadorId());
            log.info("Agenda inicial do prestador {}: {} horários criados.", evento.prestadorId(), criados);
        } catch (RuntimeException exception) {
            log.error("Perfil {} preservado; falha na agenda inicial será recuperada por uma próxima geração.", evento.prestadorId(), exception);
        }
    }
}
