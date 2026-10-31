package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.entity.PerfilPrestadorEntity;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@NullMarked
public interface PrestadorPublicoJpaRepository extends JpaRepository<PerfilPrestadorEntity, UUID>, JpaSpecificationExecutor<PerfilPrestadorEntity> {
    @EntityGraph(attributePaths = {"usuario", "tiposVeiculo", "especialidades"})
    List<PerfilPrestadorEntity> findAllByIdInAndUsuario_AtivoTrueAndUsuario_Tipo(Collection<UUID> ids, TipoUsuario tipo);

    @EntityGraph(attributePaths = {"usuario", "tiposVeiculo", "especialidades"})
    Optional<PerfilPrestadorEntity> findByIdAndUsuario_AtivoTrueAndUsuario_Tipo(UUID id, TipoUsuario tipo);
}
