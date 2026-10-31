package br.com.edu.ifpe.mobifix.api.prestador.application.busca;

import java.util.List;

public record PaginaPrestadores(List<PrestadorPublico> content, int page, int size, long totalElements, int totalPages) {
    public PaginaPrestadores {
        content = List.copyOf(content);
    }
}
