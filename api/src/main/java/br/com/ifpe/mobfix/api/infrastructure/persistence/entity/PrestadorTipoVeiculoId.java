package br.com.ifpe.mobfix.api.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class PrestadorTipoVeiculoId implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(name = "prestador_id")
    private UUID prestadorId;

    @Column(name = "tipo_veiculo_id")
    private UUID tipoVeiculoId;
}
