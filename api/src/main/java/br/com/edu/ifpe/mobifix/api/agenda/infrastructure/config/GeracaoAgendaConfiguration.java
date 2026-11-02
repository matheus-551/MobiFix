package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.config;

import java.time.Clock;
import br.com.edu.ifpe.mobifix.api.agenda.application.geracao.*;
import br.com.edu.ifpe.mobifix.api.agenda.domain.service.PlanejarAgendaMensal;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class GeracaoAgendaConfiguration {
    @Bean
    public GerarAgendaMensal gerarAgendaMensal(GeracaoAgendaMensalPort port, @Qualifier("agendaClock") Clock clock) {
        return new GerarAgendaMensal(port, new PlanejarAgendaMensal(), clock);
    }
}
