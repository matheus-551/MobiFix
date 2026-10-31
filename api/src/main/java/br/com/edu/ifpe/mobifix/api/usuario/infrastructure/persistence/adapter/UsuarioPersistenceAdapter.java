package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.adapter;

import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.repository.UsuarioJpaRepository;

import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class UsuarioPersistenceAdapter implements UsuarioRepository {

    private final UsuarioJpaRepository repository;

    public UsuarioPersistenceAdapter(UsuarioJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public boolean existePorFirebaseId(String firebaseId) {
        return repository.existsByFirebaseId(firebaseId);
    }

    @Override
    public boolean existePorEmail(String email) {
        return repository.existsByEmail(email);
    }

    @Override
    public Usuario salvar(Usuario usuario) {
        UsuarioEntity entity = UsuarioEntity.builder()
                .id(usuario.id())
                .firebaseId(usuario.firebaseId())
                .nome(usuario.nome())
                .sobrenome(usuario.sobrenome())
                .email(usuario.email())
                .telefone(usuario.telefone())
                .uf(usuario.uf())
                .tipo(usuario.tipo())
                .ativo(usuario.ativo())
                .build();

        UsuarioEntity salvo = repository.save(entity);

        return toDomain(salvo);
    }

    @Override
    public Optional<Usuario> buscarPorFirebaseId(String firebaseId) {
        return repository.findByFirebaseId(firebaseId).map(this::toDomain);
    }

    private Usuario toDomain(UsuarioEntity entity) {
        return new Usuario(
                entity.getId(),
                entity.getFirebaseId(),
                entity.getNome(),
                entity.getSobrenome(),
                entity.getEmail(),
                entity.getTelefone(),
                entity.getUf(),
                entity.getTipo(),
                entity.isAtivo()
        );
    }
}