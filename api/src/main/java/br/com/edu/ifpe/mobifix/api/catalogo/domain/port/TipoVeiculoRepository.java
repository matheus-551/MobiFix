package br.com.edu.ifpe.mobifix.api.catalogo.domain.port;

import br.com.edu.ifpe.mobifix.api.catalogo.domain.model.TipoVeiculo;

import java.util.List;
import java.util.Set;

public interface TipoVeiculoRepository {

    List<TipoVeiculo> listarTodos();
    boolean existemTodosPorIds(Set<Long> ids);
}
