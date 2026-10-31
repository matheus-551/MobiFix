package br.com.edu.ifpe.mobifix.api.catalogo.domain.port;

import br.com.edu.ifpe.mobifix.api.catalogo.domain.model.Especialidade;

import java.util.List;
import java.util.Set;

public interface EspecialidadeRepository {

    List<Especialidade> listarTodos();
    boolean existemTodosPorIds(Set<Long> ids);
}