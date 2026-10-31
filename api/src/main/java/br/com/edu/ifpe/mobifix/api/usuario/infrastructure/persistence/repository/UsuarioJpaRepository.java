package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.repository;

import java.util.Optional;
import java.util.UUID;

import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;

import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

@NullMarked
public interface UsuarioJpaRepository extends JpaRepository<UsuarioEntity, UUID> {

    boolean existsByFirebaseId(String firebaseId);

    boolean existsByEmail(String email);

    Optional<UsuarioEntity> findByFirebaseId(String firebaseId);
}