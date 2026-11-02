package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.repository;

import java.util.Optional;
import java.util.UUID;

import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.entity.PerfilPrestadorEntity;

import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

@NullMarked
public interface PerfilPrestadorJpaRepository
        extends JpaRepository<PerfilPrestadorEntity, UUID> {

    boolean existsByUsuario_Id(UUID usuarioId);

    Optional<PerfilPrestadorEntity> findByUsuario_Id(UUID usuarioId);
}