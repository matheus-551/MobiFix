package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.config;

import java.time.Clock;
import java.time.ZoneId;
import br.com.edu.ifpe.mobifix.api.agenda.application.*;
import br.com.edu.ifpe.mobifix.api.agenda.domain.port.HorarioAtendimentoRepository;
import br.com.edu.ifpe.mobifix.api.prestador.application.ConsultarPerfilPrestadorAtual;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AgendaConfiguration {
    @Bean public Clock agendaClock() { return Clock.system(ZoneId.of("America/Sao_Paulo")); }
    @Bean public GerenciarAgenda gerenciarAgenda(ConsultarPerfilPrestadorAtual perfil, HorarioAtendimentoRepository horarios,
                                               PrestadorAgendaConsulta prestadores, @Qualifier("agendaClock") Clock clock) {
        return new GerenciarAgenda(perfil, horarios, prestadores, clock);
    }
}
