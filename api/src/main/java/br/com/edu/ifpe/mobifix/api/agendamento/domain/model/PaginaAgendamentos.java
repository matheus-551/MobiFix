package br.com.edu.ifpe.mobifix.api.agendamento.domain.model;

import java.util.List;

public record PaginaAgendamentos(
        List<Agendamento> content, int page, int size, long totalElements, int totalPages) {
    public PaginaAgendamentos {
        content = List.copyOf(content);
    }
}
