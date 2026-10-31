package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.scheduler;

import br.com.edu.ifpe.mobifix.api.agenda.application.geracao.GerarAgendaMensal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.agenda.geracao.automatica", havingValue = "true", matchIfMissing = true)
public class GeracaoAgendaAutomatica implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(GeracaoAgendaAutomatica.class);
    private final GerarAgendaMensal geracao;
    public GeracaoAgendaAutomatica(GerarAgendaMensal geracao) { this.geracao = geracao; }

    @Override
    public void run(ApplicationArguments args) { executar(); }

    @Scheduled(cron = "${app.agenda.geracao.cron:0 5 0 1 * *}", zone = "America/Sao_Paulo")
    public void executar() {
        try {
            var resultado = geracao.executar();
            log.info("Geração da agenda de {}: {} prestadores processados, {} horários criados, {} falhas.",
                    resultado.mes(), resultado.prestadoresProcessados(), resultado.horariosCriados(), resultado.falhas().size());
            resultado.falhas().forEach(falha -> log.error("Falha ao gerar agenda do prestador {}: {}", falha.prestadorId(), falha.motivo()));
        } catch (RuntimeException exception) {
            // Uma falha externa nao impede a API de iniciar; a proxima execucao recupera os ausentes.
            log.error("Não foi possível iniciar a geração mensal da agenda. A próxima execução poderá tentar novamente.", exception);
        }
    }
}
