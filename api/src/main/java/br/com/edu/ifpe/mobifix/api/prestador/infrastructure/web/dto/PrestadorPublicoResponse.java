package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web.dto;

import java.util.List;
import java.util.UUID;

public record PrestadorPublicoResponse(UUID id, String nome, String descricao, String cidade, String uf,
                                      List<ItemCatalogoResponse> tiposVeiculo, List<ItemCatalogoResponse> especialidades) {
    public record ItemCatalogoResponse(Long id, String nome) {
    }
}
