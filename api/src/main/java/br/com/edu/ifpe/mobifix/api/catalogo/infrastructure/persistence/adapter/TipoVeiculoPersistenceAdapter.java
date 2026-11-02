package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.adapter;

import br.com.edu.ifpe.mobifix.api.catalogo.domain.model.TipoVeiculo;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.repository.TipoVeiculoJpaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public class TipoVeiculoPersistenceAdapter implements TipoVeiculoRepository {

    private final TipoVeiculoJpaRepository repository;

    public TipoVeiculoPersistenceAdapter(TipoVeiculoJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<TipoVeiculo> listarTodos() {
        return repository.findAll(Sort.by("nome"))
                .stream()
                .map(entity -> new TipoVeiculo(
                        entity.getId(),
                        entity.getNome()
                )).toList();
    }

    @Override
    public boolean existemTodosPorIds(Set<Long> ids) {
        return repository.findAllById(ids).size() == ids.size();
    }
}
