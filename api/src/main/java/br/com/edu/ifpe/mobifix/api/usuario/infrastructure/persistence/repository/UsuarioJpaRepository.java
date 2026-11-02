package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.repository;

import java.util.Optional;
import java.util.UUID;

import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

@NullMarked
public interface UsuarioJpaRepository extends JpaRepository<UsuarioEntity, UUID> {

    boolean existsByFirebaseId(String firebaseId);

    boolean existsByEmail(String email);

    Optional<UsuarioEntity> findByFirebaseId(String firebaseId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from UsuarioEntity u where u.firebaseId = :firebaseId")
    Optional<UsuarioEntity> buscarParaAlteracao(@Param("firebaseId") String firebaseId);
}
