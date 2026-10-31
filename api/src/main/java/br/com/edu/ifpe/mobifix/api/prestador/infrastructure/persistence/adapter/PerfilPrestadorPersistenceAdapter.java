package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.adapter;

import java.util.Optional;
import org.springframework.context.ApplicationEventPublisher;
import br.com.edu.ifpe.mobifix.api.prestador.application.event.PerfilPrestadorCriado;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.EspecialidadeEntity;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.TipoVeiculoEntity;

import br.com.edu.ifpe.mobifix.api.prestador.domain.model.Endereco;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.PerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.entity.EnderecoEmbeddable;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.entity.PerfilPrestadorEntity;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.repository.PerfilPrestadorJpaRepository;

import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;

import jakarta.persistence.EntityManager;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class PerfilPrestadorPersistenceAdapter implements PerfilPrestadorRepository {

    private final PerfilPrestadorJpaRepository repository;
    private final EntityManager entityManager;
    private final ApplicationEventPublisher eventos;

    public PerfilPrestadorPersistenceAdapter(PerfilPrestadorJpaRepository repository, EntityManager entityManager, ApplicationEventPublisher eventos) {
        this.repository = repository;
        this.eventos = eventos;
        this.entityManager = entityManager;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existePorUsuarioId(UUID usuarioId) {
        return repository.existsByUsuario_Id(usuarioId);
    }

    @Override
    @Transactional
    public PerfilPrestador salvar(PerfilPrestador perfil) {
        PerfilPrestadorEntity entity = toEntity(perfil);

        PerfilPrestadorEntity salvo = repository.saveAndFlush(entity);
        eventos.publishEvent(new PerfilPrestadorCriado(salvo.getId()));

        return toDomain(salvo);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PerfilPrestador> buscarPorUsuarioId(UUID usuarioId) {
        return repository.findByUsuario_Id(usuarioId).map(this::toDomain);
    }

    @Override
    @Transactional
    public PerfilPrestador atualizar(PerfilPrestador perfil) {
        PerfilPrestadorEntity existente = repository.findById(perfil.id())
                .filter(entity -> entity.getUsuario().getId().equals(perfil.usuarioId()))
                .orElseThrow(br.com.edu.ifpe.mobifix.api.prestador.application.exception.PerfilPrestadorNaoEncontradoException::new);

        PerfilPrestadorEntity dados = toEntity(perfil);
        existente.atualizarDados(
                dados.getNomeFantasia(), dados.getDescricao(), dados.getEndereco(),
                dados.getTiposVeiculo(), dados.getEspecialidades()
        );
        repository.flush();
        return toDomain(existente);
    }
    private PerfilPrestadorEntity toEntity(PerfilPrestador perfil) {
        UsuarioEntity usuario = entityManager.getReference(
                UsuarioEntity.class,
                perfil.usuarioId()
        );

        Set<TipoVeiculoEntity> tiposVeiculo =
                perfil.tiposVeiculoIds()
                        .stream()
                        .map(id -> entityManager.getReference(
                                TipoVeiculoEntity.class,
                                id
                        ))
                        .collect(Collectors.toSet());

        Set<EspecialidadeEntity> especialidades =
                perfil.especialidadeIds()
                        .stream()
                        .map(id -> entityManager.getReference(
                                EspecialidadeEntity.class,
                                id
                        ))
                        .collect(Collectors.toSet());

        Endereco endereco = perfil.endereco();

        EnderecoEmbeddable enderecoEntity = new EnderecoEmbeddable(
                endereco.logradouro(),
                endereco.numero(),
                endereco.complemento(),
                endereco.bairro(),
                endereco.cidade(),
                endereco.uf(),
                endereco.cep()
        );

        return PerfilPrestadorEntity.builder()
                .id(perfil.id())
                .usuario(usuario)
                .nomeFantasia(perfil.nomeFantasia())
                .descricao(perfil.descricao())
                .endereco(enderecoEntity)
                .tiposVeiculo(tiposVeiculo)
                .especialidades(especialidades)
                .build();
    }

    private PerfilPrestador toDomain(PerfilPrestadorEntity entity) {
        EnderecoEmbeddable enderecoEntity = entity.getEndereco();

        Endereco endereco = new Endereco(
                enderecoEntity.getLogradouro(),
                enderecoEntity.getNumero(),
                enderecoEntity.getComplemento(),
                enderecoEntity.getBairro(),
                enderecoEntity.getCidade(),
                enderecoEntity.getUf(),
                enderecoEntity.getCep()
        );

        Set<Long> tiposVeiculoIds = entity.getTiposVeiculo()
                .stream()
                .map(TipoVeiculoEntity::getId)
                .collect(Collectors.toSet());

        Set<Long> especialidadeIds = entity.getEspecialidades()
                .stream()
                .map(EspecialidadeEntity::getId)
                .collect(Collectors.toSet());

        return new PerfilPrestador(
                entity.getId(),
                entity.getUsuario().getId(),
                entity.getNomeFantasia(),
                entity.getDescricao(),
                endereco,
                tiposVeiculoIds,
                especialidadeIds
        );
    }
}
