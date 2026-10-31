package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web.dto;

import java.util.List;

public record BuscaPrestadoresResponse(List<PrestadorPublicoResponse> content, int page, int size, long totalElements, int totalPages) {
}
