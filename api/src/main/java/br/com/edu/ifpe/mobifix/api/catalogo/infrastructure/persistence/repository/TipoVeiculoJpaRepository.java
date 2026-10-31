package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.repository;

import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.TipoVeiculoEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

@NullMarked
public interface TipoVeiculoJpaRepository extends JpaRepository<TipoVeiculoEntity, Long> {

    boolean existsByNome(String nome);
}
