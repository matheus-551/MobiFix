package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web.dto;

import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.PaginaAgendamentos;

import java.util.List;

public record PaginaAgendamentosResponse(
        List<AgendamentoResponse> content, int page, int size, long totalElements, int totalPages) {
    public static PaginaAgendamentosResponse de(PaginaAgendamentos pagina) {
        return new PaginaAgendamentosResponse(
                pagina.content().stream().map(AgendamentoResponse::de).toList(),
                pagina.page(),
                pagina.size(),
                pagina.totalElements(),
                pagina.totalPages());
    }
}
