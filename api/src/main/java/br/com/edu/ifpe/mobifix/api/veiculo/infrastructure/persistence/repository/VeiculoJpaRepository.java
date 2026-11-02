package br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.entity.VeiculoEntity;
import jakarta.persistence.LockModeType;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@NullMarked
public interface VeiculoJpaRepository extends JpaRepository<VeiculoEntity, UUID> {
    List<VeiculoEntity> findAllByCliente_IdAndAtivoTrueOrderByMarcaAscModeloAsc(UUID clienteId);

    Optional<VeiculoEntity> findByIdAndCliente_IdAndAtivoTrue(UUID id, UUID clienteId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from VeiculoEntity v where v.id = :id and v.cliente.id = :clienteId and v.ativo = true")
    Optional<VeiculoEntity> buscarAtivoParaAlteracao(@Param("id") UUID id, @Param("clienteId") UUID clienteId);
}
