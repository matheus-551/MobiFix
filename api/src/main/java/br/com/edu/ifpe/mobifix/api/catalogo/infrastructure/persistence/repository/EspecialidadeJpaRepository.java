package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.repository;

import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.EspecialidadeEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

@NullMarked
public interface EspecialidadeJpaRepository extends JpaRepository<EspecialidadeEntity, Long> {

    boolean existsByNome(String nome);
}
