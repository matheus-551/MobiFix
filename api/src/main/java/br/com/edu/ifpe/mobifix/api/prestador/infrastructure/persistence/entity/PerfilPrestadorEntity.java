package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.entity;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.EspecialidadeEntity;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.TipoVeiculoEntity;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;

import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "perfil_prestador")
public class PerfilPrestadorEntity {

    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private UsuarioEntity usuario;

    @Column(name = "nome_fantasia", length = 150)
    private String nomeFantasia;

    @Column(length = 2000)
    private String descricao;

    @Embedded
    private EnderecoEmbeddable endereco;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "prestador_tipo_veiculo",
            joinColumns = @JoinColumn(name = "prestador_id", nullable = false),
            inverseJoinColumns = @JoinColumn(name = "tipo_veiculo_id", nullable = false),
            uniqueConstraints = @UniqueConstraint(columnNames = {"prestador_id", "tipo_veiculo_id"})
    )
    private Set<TipoVeiculoEntity> tiposVeiculo = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "prestador_especialidade",
            joinColumns = @JoinColumn(name = "prestador_id", nullable = false),
            inverseJoinColumns = @JoinColumn(name = "especialidade_id", nullable = false),
            uniqueConstraints = @UniqueConstraint(columnNames = {"prestador_id", "especialidade_id"})
    )
    private Set<EspecialidadeEntity> especialidades = new HashSet<>();

    public void atualizarDados(
            String nomeFantasia,
            String descricao,
            EnderecoEmbeddable endereco,
            Set<TipoVeiculoEntity> tiposVeiculo,
            Set<EspecialidadeEntity> especialidades
    ) {
        this.nomeFantasia = nomeFantasia;
        this.descricao = descricao;
        this.endereco = endereco;
        // Preserva as colecoes gerenciadas pelo Hibernate e substitui seus vinculos.
        this.tiposVeiculo.clear();
        this.tiposVeiculo.addAll(tiposVeiculo);
        this.especialidades.clear();
        this.especialidades.addAll(especialidades);
    }
    @Builder
    public PerfilPrestadorEntity(
            UUID id,
            UsuarioEntity usuario,
            String nomeFantasia,
            String descricao,
            EnderecoEmbeddable endereco,
            Set<TipoVeiculoEntity> tiposVeiculo,
            Set<EspecialidadeEntity> especialidades
    ) {
        this.id = id;
        this.usuario = usuario;
        this.nomeFantasia = nomeFantasia;
        this.descricao = descricao;
        this.endereco = endereco;
        this.tiposVeiculo = new HashSet<>(tiposVeiculo);
        this.especialidades = new HashSet<>(especialidades);
    }
}