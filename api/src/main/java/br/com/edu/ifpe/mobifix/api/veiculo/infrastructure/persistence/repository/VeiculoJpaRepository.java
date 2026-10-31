package br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.repository;
import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.entity.VeiculoEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

@NullMarked
public interface VeiculoJpaRepository extends JpaRepository<VeiculoEntity, UUID> {
    List<VeiculoEntity> findAllByCliente_IdOrderByMarcaAscModeloAsc(UUID clienteId);
}
