package br.com.edu.ifpe.mobifix.api.agendamento.application;

import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.Agendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.PaginaAgendamentos;

import java.util.UUID;

public interface Agendamentos {

    Agendamento criar(String firebaseId, CriarAgendamentoCommand command);

    Agendamento consultar(String firebaseId, UUID id);

    PaginaAgendamentos listarMeus(String firebaseId, int page, int size);

    Agendamento confirmar(String firebaseId, UUID id);

    Agendamento cancelar(String firebaseId, UUID id);

    Agendamento concluir(String firebaseId, UUID id);
}
