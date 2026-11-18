package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.transaction;

import br.com.edu.ifpe.mobifix.api.agendamento.application.Agendamentos;
import br.com.edu.ifpe.mobifix.api.agendamento.application.CriarAgendamentoCommand;
import br.com.edu.ifpe.mobifix.api.agendamento.application.GerenciarAgendamentos;
import br.com.edu.ifpe.mobifix.api.agendamento.application.port.ContextoAgendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.Agendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.PaginaAgendamentos;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.port.AgendamentoRepository;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AgendamentosTransacionais implements Agendamentos {

    private final GerenciarAgendamentos regras;

    public AgendamentosTransacionais(
            ContextoAgendamento contexto,
            AgendamentoRepository repository,
            @Qualifier("agendaClock") Clock clock) {
        regras = new GerenciarAgendamentos(contexto, repository, clock);
    }

    @Override
    @Transactional
    public Agendamento criar(String firebaseId, CriarAgendamentoCommand command) {
        return regras.criar(firebaseId, command);
    }

    @Override
    public Agendamento consultar(String firebaseId, UUID id) {
        return regras.consultar(firebaseId, id);
    }

    @Override
    public PaginaAgendamentos listarMeus(String firebaseId, int page, int size) {
        return regras.listarMeus(firebaseId, page, size);
    }
}
