package br.com.edu.ifpe.mobifix.api.prestador.application.busca;

import java.util.List;
import java.util.UUID;

public record PrestadorPublico(UUID id, String nome, String descricao, String cidade, String uf,
                               List<ItemCatalogo> tiposVeiculo, List<ItemCatalogo> especialidades) {
    public PrestadorPublico {
        tiposVeiculo = List.copyOf(tiposVeiculo);
        especialidades = List.copyOf(especialidades);
    }
    public record ItemCatalogo(Long id, String nome) {
    }
}
