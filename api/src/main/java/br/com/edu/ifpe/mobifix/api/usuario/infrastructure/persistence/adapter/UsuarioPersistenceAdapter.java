package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.adapter;

import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.repository.UsuarioJpaRepository;

import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioInativoException;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import org.springframework.transaction.annotation.Transactional;
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

    @Override
    @Transactional
    public Usuario atualizarDadosPessoais(Usuario usuario) {
        UsuarioEntity existente = repository.buscarParaAlteracao(usuario.firebaseId())
                .filter(entity -> entity.getId().equals(usuario.id()))
                .orElseThrow(UsuarioNaoEncontradoException::new);
        // Revalida sob bloqueio para uma edicao concorrente nao reativar a conta.
        if (!existente.isAtivo()) throw new UsuarioInativoException();
        existente.atualizarDadosPessoais(usuario.nome(), usuario.sobrenome(), usuario.telefone(), usuario.uf());
        repository.flush();
        return toDomain(existente);
    }

    @Override
    @Transactional
    public void desativarPorFirebaseId(String firebaseId) {
        UsuarioEntity existente = repository.buscarParaAlteracao(firebaseId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        // Repetir a desativacao mantem o mesmo estado, sem excluir vinculos.
        existente.desativar();
        repository.flush();
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
