package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.adapter;

import br.com.edu.ifpe.mobifix.api.catalogo.domain.model.Especialidade;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.EspecialidadeRepository;

import java.util.List;
import java.util.Set;

import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.repository.EspecialidadeJpaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

@Repository
public class EspecialidadePersistenceAdapter implements EspecialidadeRepository {

    private final EspecialidadeJpaRepository repository;

    public EspecialidadePersistenceAdapter(EspecialidadeJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Especialidade> listarTodos() {
        return repository.findAll(Sort.by("nome"))
                .stream()
                .map(entity -> new Especialidade(
                        entity.getId(),
                        entity.getNome()
                ))
                .toList();
    }

    @Override
    public boolean existemTodosPorIds(Set<Long> ids) {
        return repository.findAllById(ids).size() == ids.size();
    }
}