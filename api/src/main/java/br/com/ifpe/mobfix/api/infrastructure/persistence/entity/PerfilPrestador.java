package br.com.ifpe.mobfix.api.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.util.UUID;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "perfil_prestador")
@Getter
@Setter
@NoArgsConstructor
public class PerfilPrestador extends EntidadeAuditavel {

    @Id
    @Column(name = "usuario_id")
    private UUID usuarioId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "nome_exibicao", length = 150, nullable = false)
    private String nomeExibicao;

    @Column(name = "endereco", length = 255)
    private String endereco;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.CHAR)
    @Column(name = "estado_uf", length = 2, columnDefinition = "char(2)")
    private String estadoUf;

    @OneToMany(mappedBy = "prestador", fetch = FetchType.LAZY)
    private Set<PrestadorTipoVeiculo> tiposVeiculo = new HashSet<>();

    @OneToMany(mappedBy = "prestador", fetch = FetchType.LAZY)
    private Set<PrestadorEspecialidade> especialidades = new HashSet<>();
}
