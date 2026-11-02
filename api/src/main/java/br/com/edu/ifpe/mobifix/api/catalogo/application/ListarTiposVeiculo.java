package br.com.edu.ifpe.mobifix.api.catalogo.application;

import br.com.edu.ifpe.mobifix.api.catalogo.domain.model.TipoVeiculo;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;

import java.util.List;

public class ListarTiposVeiculo {

    private final TipoVeiculoRepository repository;

    public ListarTiposVeiculo(TipoVeiculoRepository repository) {
        this.repository = repository;
    }

    public List<TipoVeiculo> executar() {
        return repository.listarTodos();
    }
}
