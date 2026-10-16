package br.com.ifpe.mobfix.api.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "prestador_especialidade")
@Getter
@Setter
@NoArgsConstructor
public class PrestadorEspecialidade extends EntidadeAuditavel {

    @EmbeddedId
    private PrestadorEspecialidadeId id = new PrestadorEspecialidadeId();

    @MapsId("prestadorId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prestador_id", nullable = false)
    private PerfilPrestador prestador;

    @MapsId("especialidadeId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "especialidade_id", nullable = false)
    private Especialidade especialidade;
}
