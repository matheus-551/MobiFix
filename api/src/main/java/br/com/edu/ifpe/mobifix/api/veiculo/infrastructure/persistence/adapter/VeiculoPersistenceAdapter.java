package br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.adapter;

import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.TipoVeiculoEntity;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.port.VeiculoRepository;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.entity.VeiculoEntity;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.repository.VeiculoJpaRepository;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class VeiculoPersistenceAdapter implements VeiculoRepository {
    private final VeiculoJpaRepository repository;
    private final EntityManager entityManager;
    public VeiculoPersistenceAdapter(VeiculoJpaRepository repository, EntityManager entityManager) {
        this.repository = repository;
        this.entityManager = entityManager;
    }
    @Override
    @Transactional
    public Veiculo salvar(Veiculo veiculo) {
        VeiculoEntity entity = new VeiculoEntity(veiculo.id(),
                entityManager.getReference(UsuarioEntity.class, veiculo.clienteId()),
                entityManager.getReference(TipoVeiculoEntity.class, veiculo.tipoVeiculoId()),
                veiculo.marca(), veiculo.modelo(), veiculo.ano(), veiculo.placa());
        return toDomain(repository.saveAndFlush(entity));
    }
    @Override
    @Transactional(readOnly = true)
    public List<Veiculo> listarPorClienteId(UUID clienteId) {
        return repository.findAllByCliente_IdOrderByMarcaAscModeloAsc(clienteId).stream().map(this::toDomain).toList();
    }
    private Veiculo toDomain(VeiculoEntity entity) {
        return new Veiculo(entity.getId(), entity.getCliente().getId(), entity.getTipoVeiculo().getId(),
                entity.getMarca(), entity.getModelo(), entity.getAno(), entity.getPlaca());
    }
}
