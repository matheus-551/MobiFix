package br.com.ifpe.mobfix.api.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "prestador_tipo_veiculo")
@Getter
@Setter
@NoArgsConstructor
public class PrestadorTipoVeiculo extends EntidadeAuditavel {

    @EmbeddedId
    private PrestadorTipoVeiculoId id = new PrestadorTipoVeiculoId();

    @MapsId("prestadorId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prestador_id", nullable = false)
    private PerfilPrestador prestador;

    @MapsId("tipoVeiculoId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_veiculo_id", nullable = false)
    private TipoVeiculo tipoVeiculo;
}
