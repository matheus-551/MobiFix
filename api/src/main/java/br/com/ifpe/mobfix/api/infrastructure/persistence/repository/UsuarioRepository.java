package br.com.ifpe.mobfix.api.infrastructure.persistence.repository;

import br.com.ifpe.mobfix.api.infrastructure.persistence.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByFirebaseUid(String firebaseUid);
}
